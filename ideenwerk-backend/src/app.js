import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import pg from 'pg';
import { z } from 'zod';
import { createEventId, createPublicId, createStatusToken, hashStatusToken } from './lib/status-token.js';

const { Pool } = pg;
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(x => x.trim())
  .filter(Boolean));

const app = Fastify({
  bodyLimit: 64 * 1024,
  trustProxy: TRUST_PROXY,
  logger: {
    level: LOG_LEVEL,
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'res.headers.set-cookie',
        '*.status_token_once',
        '*.token'
      ],
      censor: '[REDACTED]'
    }
  }
});

await app.register(helmet, {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});
await app.register(cors, {
  credentials: false,
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (allowedOrigins.has(origin)) return cb(null, true);
    return cb(new Error('CORS_ORIGIN_DENIED'), false);
  }
});
await app.register(rateLimit, { global: false });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PORT = Number(process.env.PORT || 3000);
const SUBMISSION_RATE_LIMIT = Number(process.env.SUBMISSION_RATE_LIMIT || 20);
const REPORT_RATE_LIMIT = Number(process.env.REPORT_RATE_LIMIT || 30);
const PRIVACY_RATE_LIMIT = Number(process.env.PRIVACY_RATE_LIMIT || 30);

const submissionSchema = z.object({
  text: z.string().trim().min(20).max(5000),
  region: z.string().trim().max(120).optional(),
  topic: z.string().trim().max(120).optional(),
  consent_public_anonymous: z.boolean().default(false)
});

const reportSchema = z.object({
  target_type: z.enum(['submission','cluster','reform_candidate']),
  target_id: z.string().trim().min(1).max(160),
  reason: z.string().trim().min(2).max(120),
  details: z.string().trim().max(2000).optional()
});

const privacyRequestSchema = z.object({
  request_type: z.enum(['export','correction','deletion','restriction','cluster_appeal']),
  details: z.string().trim().max(3000).optional()
});

function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

async function resolveStatusAccess(publicId, token) {
  if (!token) return { error: 'STATUS_TOKEN_REQUIRED', code: 401, message: 'Status-Token fehlt.' };
  const tokenHash = hashStatusToken(token);
  const q = await pool.query(
    `SELECT s.id,s.public_id,s.original_text,s.public_text,s.region,s.topic,s.current_status,s.created_at,s.updated_at,
            a.expires_at,a.revoked_at
       FROM submissions s JOIN status_access a ON a.submission_id=s.id
      WHERE s.public_id=$1 AND a.token_hash=$2 LIMIT 1`,
    [publicId, tokenHash]
  );
  if (!q.rowCount) return { error: 'STATUS_ACCESS_DENIED', code: 403, message: 'Statuszugang ungültig.' };
  const row = q.rows[0];
  if (row.revoked_at) return { error: 'STATUS_ACCESS_REVOKED', code: 403, message: 'Statuszugang wurde widerrufen.' };
  if (row.expires_at && new Date(row.expires_at) < new Date()) return { error: 'STATUS_ACCESS_EXPIRED', code: 403, message: 'Statuszugang ist abgelaufen.' };
  return { row };
}

function privacyRequestId() {
  return `PRIV-${createPublicId().slice(5)}`;
}

app.addHook('onRequest', async (req, reply) => {
  if (req.url.startsWith('/api/ideenwerk/')) {
    reply.header('cache-control', 'no-store');
    reply.header('pragma', 'no-cache');
  }
});

app.get('/health', async () => ({ ok: true, service: 'werk-ideenwerk-backend', version: '0.6.0' }));
app.get('/ready', async (_req, reply) => {
  try {
    await pool.query('SELECT 1');
    return { ok: true, database: 'ready' };
  } catch {
    return reply.code(503).send({ ok: false, database: 'unavailable' });
  }
});

app.post('/api/ideenwerk/v1/submissions', {
  config: { rateLimit: { max: SUBMISSION_RATE_LIMIT, timeWindow: '1 minute' } }
}, async (req, reply) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ code: 'INVALID_SUBMISSION', message: 'Einreichung ist unvollständig oder ungültig.' });

  const idempotencyKey = String(req.headers['idempotency-key'] || '').trim() || null;
  if (idempotencyKey) {
    const old = await pool.query('SELECT public_id, current_status FROM submissions WHERE idempotency_key=$1 LIMIT 1', [idempotencyKey]);
    if (old.rowCount) {
      return reply.code(200).send({
        public_id: old.rows[0].public_id,
        status: old.rows[0].current_status,
        status_token_once: null,
        replayed: true,
        note: 'Idempotente Wiederholung erkannt. Aus Sicherheitsgründen wird ein bereits ausgegebener Status-Token nicht erneut im Klartext ausgegeben.'
      });
    }
  }

  const publicId = createPublicId();
  const statusToken = createStatusToken();
  const tokenHash = hashStatusToken(statusToken);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const ins = await client.query(
      `INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
       VALUES($1,$2,$3,$4,$5,'received') RETURNING id`,
      [publicId, idempotencyKey, parsed.data.text, parsed.data.region || null, parsed.data.topic || null]
    );
    const submissionId = ins.rows[0].id;
    await client.query('INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)', [submissionId, tokenHash]);
    await client.query(
      `INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
       VALUES($1,'submission',$2,'status_created','citizen',NULL,$3::jsonb)`,
      [createEventId(), publicId, JSON.stringify({ status: 'received', consent_public_anonymous: parsed.data.consent_public_anonymous })]
    );
    await client.query(
      `INSERT INTO processing_jobs(job_type,subject_type,subject_id,payload)
       VALUES('pii_scan','submission',$1,'{}'::jsonb)
       ON CONFLICT DO NOTHING`, [publicId]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    req.log.error({ err: e }, 'submission failed');
    return reply.code(500).send({ code: 'SUBMISSION_FAILED', message: 'Die Idee konnte technisch nicht angenommen werden.', request_id: req.id });
  } finally {
    client.release();
  }

  return reply.code(201).send({
    public_id: publicId,
    status: 'received',
    status_token_once: statusToken,
    status_url: `/api/ideenwerk/v1/status/${publicId}`,
    public_url: `/api/ideenwerk/v1/submissions/${publicId}`,
    note: 'Status-Token sicher speichern. Er wird serverseitig nicht im Klartext gespeichert.'
  });
});

app.get('/api/ideenwerk/v1/submissions/:publicId', async (req, reply) => {
  const { publicId } = req.params;
  const q = await pool.query(
    `SELECT public_id, public_text, region, topic, current_status, created_at
     FROM submissions WHERE public_id=$1 LIMIT 1`, [publicId]
  );
  if (!q.rowCount || !q.rows[0].public_text) return reply.code(404).send({ code: 'NOT_PUBLIC', message: 'Diese Einreichung ist nicht öffentlich verfügbar.' });
  return q.rows[0];
});

app.get('/api/ideenwerk/v1/status/:publicId', {
  config: { rateLimit: { max: 60, timeWindow: '1 minute' } }
}, async (req, reply) => {
  const access = await resolveStatusAccess(req.params.publicId, bearerToken(req));
  if (access.error) return reply.code(access.code).send({ code: access.error, message: access.message });
  const row = access.row;
  const history = await pool.query(
    `SELECT event_type,actor_type,reason_code,payload,created_at
       FROM audit_events WHERE subject_type='submission' AND subject_id=$1 ORDER BY created_at ASC`, [row.public_id]
  );
  return {
    public_id: row.public_id,
    original_text: row.original_text,
    region: row.region,
    topic: row.topic,
    current_status: row.current_status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    history: history.rows
  };
});

app.get('/api/ideenwerk/v1/privacy/export/:publicId', {
  config: { rateLimit: { max: PRIVACY_RATE_LIMIT, timeWindow: '1 minute' } }
}, async (req, reply) => {
  const access = await resolveStatusAccess(req.params.publicId, bearerToken(req));
  if (access.error) return reply.code(access.code).send({ code: access.error, message: access.message });
  const row = access.row;
  const [structured, memberships, audit, requests] = await Promise.all([
    pool.query(`SELECT problem,proposal,goal,suggested_level,topic,region,open_questions,citizen_confirmed,created_at,updated_at FROM structured_proposals WHERE submission_id=$1`, [row.id]),
    pool.query(`SELECT c.cluster_id,c.title,cm.assignment_method,cm.similarity,cm.created_at FROM cluster_members cm JOIN clusters c ON c.id=cm.cluster_id WHERE cm.submission_id=$1`, [row.id]),
    pool.query(`SELECT event_type,actor_type,reason_code,payload,created_at FROM audit_events WHERE subject_type='submission' AND subject_id=$1 ORDER BY created_at ASC`, [row.public_id]),
    pool.query(`SELECT request_id,request_type,details,status,decision_reason_code,created_at,resolved_at FROM privacy_requests WHERE submission_id=$1 ORDER BY created_at ASC`, [row.id])
  ]);
  return {
    export_type: 'IDEENWERK_PRIVATE_SUBMISSION_EXPORT',
    generated_at: new Date().toISOString(),
    submission: {
      public_id: row.public_id,
      original_text: row.original_text,
      public_text: row.public_text,
      region: row.region,
      topic: row.topic,
      current_status: row.current_status,
      created_at: row.created_at,
      updated_at: row.updated_at
    },
    structured_proposal: structured.rows[0] || null,
    cluster_memberships: memberships.rows,
    audit_history: audit.rows,
    privacy_requests: requests.rows
  };
});

app.post('/api/ideenwerk/v1/privacy/requests/:publicId', {
  config: { rateLimit: { max: PRIVACY_RATE_LIMIT, timeWindow: '1 minute' } }
}, async (req, reply) => {
  const parsed = privacyRequestSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ code: 'INVALID_PRIVACY_REQUEST', message: 'Datenschutzanfrage ist ungültig.' });
  const access = await resolveStatusAccess(req.params.publicId, bearerToken(req));
  if (access.error) return reply.code(access.code).send({ code: access.error, message: access.message });
  const row = access.row;
  const requestId = privacyRequestId();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO privacy_requests(request_id,submission_id,request_type,details)
       VALUES($1,$2,$3,$4)`,
      [requestId,row.id,parsed.data.request_type,parsed.data.details||null]
    );
    await client.query(
      `INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
       VALUES($1,'submission',$2,'privacy_request_created','citizen',$3,$4::jsonb)`,
      [createEventId(),row.public_id,`PRIVACY_${parsed.data.request_type.toUpperCase()}`,JSON.stringify({request_id:requestId})]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
  return reply.code(201).send({
    request_id: requestId,
    request_type: parsed.data.request_type,
    status: 'received',
    note: 'Die Anfrage wird geprüft. Ein Löschwunsch ist keine sofortige irreversible Client-Löschung; Ergebnis und Reason Code werden nachvollziehbar dokumentiert.'
  });
});

app.get('/api/ideenwerk/v1/privacy/requests/:publicId', {
  config: { rateLimit: { max: PRIVACY_RATE_LIMIT, timeWindow: '1 minute' } }
}, async (req, reply) => {
  const access = await resolveStatusAccess(req.params.publicId, bearerToken(req));
  if (access.error) return reply.code(access.code).send({ code: access.error, message: access.message });
  const q = await pool.query(
    `SELECT request_id,request_type,details,status,decision_reason_code,created_at,resolved_at
       FROM privacy_requests WHERE submission_id=$1 ORDER BY created_at DESC`, [access.row.id]
  );
  return { public_id: access.row.public_id, requests: q.rows };
});

app.post('/api/ideenwerk/v1/moderation/report', {
  config: { rateLimit: { max: REPORT_RATE_LIMIT, timeWindow: '1 minute' } }
}, async (req, reply) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ code: 'INVALID_REPORT', message: 'Meldung ist ungültig.' });
  const reportId = `REP-${createPublicId().slice(5)}`;
  await pool.query(
    `INSERT INTO moderation_reports(report_id,target_type,target_id,reason,details)
     VALUES($1,$2,$3,$4,$5)`,
    [reportId, parsed.data.target_type, parsed.data.target_id, parsed.data.reason, parsed.data.details || null]
  );
  return reply.code(201).send({ report_id: reportId, status: 'received' });
});

app.setErrorHandler((err, req, reply) => {
  if (err?.message === 'CORS_ORIGIN_DENIED') {
    return reply.code(403).send({ code: 'CORS_ORIGIN_DENIED', message: 'Origin nicht freigegeben.', request_id: req.id });
  }
  req.log.error({ err }, 'unhandled error');
  reply.code(500).send({ code: 'INTERNAL_ERROR', message: 'Interner Fehler.', request_id: req.id });
});

async function shutdown(signal) {
  app.log.info({ signal }, 'shutdown');
  await app.close();
  await pool.end();
  process.exit(0);
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

app.listen({ port: PORT, host: '0.0.0.0' }).catch(err => {
  app.log.error(err);
  process.exit(1);
});
