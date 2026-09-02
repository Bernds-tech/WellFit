import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import pg from 'pg';
import { z } from 'zod';
import { createEventId, createPublicId, createStatusToken, hashStatusToken } from './lib/status-token.js';

const { Pool } = pg;
const app = Fastify({ logger: true, bodyLimit: 64 * 1024 });
await app.register(rateLimit, { global: false });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const PORT = Number(process.env.PORT || 3000);
const SUBMISSION_RATE_LIMIT = Number(process.env.SUBMISSION_RATE_LIMIT || 20);
const REPORT_RATE_LIMIT = Number(process.env.REPORT_RATE_LIMIT || 30);

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

function bearerToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

app.get('/health', async () => ({ ok: true, service: 'werk-ideenwerk-backend', version: '0.2.0' }));

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
    req.log.error(e);
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
  const token = bearerToken(req);
  if (!token) return reply.code(401).send({ code: 'STATUS_TOKEN_REQUIRED', message: 'Status-Token fehlt.' });
  const tokenHash = hashStatusToken(token);
  const { publicId } = req.params;
  const q = await pool.query(
    `SELECT s.public_id,s.original_text,s.region,s.topic,s.current_status,s.created_at,s.updated_at,
            a.expires_at,a.revoked_at
       FROM submissions s JOIN status_access a ON a.submission_id=s.id
      WHERE s.public_id=$1 AND a.token_hash=$2 LIMIT 1`,
    [publicId, tokenHash]
  );
  if (!q.rowCount) return reply.code(403).send({ code: 'STATUS_ACCESS_DENIED', message: 'Statuszugang ungültig.' });
  const row = q.rows[0];
  if (row.revoked_at) return reply.code(403).send({ code: 'STATUS_ACCESS_REVOKED', message: 'Statuszugang wurde widerrufen.' });
  if (row.expires_at && new Date(row.expires_at) < new Date()) return reply.code(403).send({ code: 'STATUS_ACCESS_EXPIRED', message: 'Statuszugang ist abgelaufen.' });
  const history = await pool.query(
    `SELECT event_type,actor_type,reason_code,payload,created_at
       FROM audit_events WHERE subject_type='submission' AND subject_id=$1 ORDER BY created_at ASC`, [publicId]
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
  req.log.error(err);
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
