import os from 'node:os';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import { createEventId } from './lib/status-token.js';
import { assertTransition } from './lib/status-machine.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const WORKER_ID = process.env.WORKER_ID || `${os.hostname()}-${process.pid}`;
const POLL_MS = Number(process.env.WORKER_POLL_MS || 1500);
const LEXICAL_DUPLICATE_THRESHOLD = Number(process.env.LEXICAL_DUPLICATE_THRESHOLD || 0.90);
let stopping = false;

function piiFlags(text='') {
  const flags = [];
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) flags.push('email');
  if (/(?:\+43|0043|0)\s?\d[\d\s\/-]{6,}/.test(text)) flags.push('phone');
  return flags;
}

function createClusterId() {
  return `CLU-${randomBytes(8).toString('hex').toUpperCase()}`;
}

async function claimJob() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const q = await client.query(
      `SELECT id,job_type,subject_type,subject_id,payload,attempts,max_attempts
         FROM processing_jobs
        WHERE status='queued' AND available_at<=now()
        ORDER BY id
        FOR UPDATE SKIP LOCKED
        LIMIT 1`
    );
    if (!q.rowCount) { await client.query('COMMIT'); return null; }
    const job = q.rows[0];
    await client.query(
      `UPDATE processing_jobs
          SET status='running', attempts=attempts+1, locked_at=now(), locked_by=$2, updated_at=now()
        WHERE id=$1`, [job.id, WORKER_ID]
    );
    await client.query('COMMIT');
    return job;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function enqueue(client, jobType, subjectId, payload={}) {
  await client.query(
    `INSERT INTO processing_jobs(job_type,subject_type,subject_id,payload)
     VALUES($1,'submission',$2,$3::jsonb)
     ON CONFLICT DO NOTHING`,
    [jobType, subjectId, JSON.stringify(payload)]
  );
}

async function statusChange(client, publicId, to, actor='system', reasonCode=null, payload={}) {
  const q = await client.query('SELECT current_status FROM submissions WHERE public_id=$1 FOR UPDATE', [publicId]);
  if (!q.rowCount) throw new Error(`submission not found: ${publicId}`);
  const from = q.rows[0].current_status;
  if (from !== to) assertTransition(from, to);
  await client.query('UPDATE submissions SET current_status=$2, updated_at=now() WHERE public_id=$1', [publicId, to]);
  await client.query(
    `INSERT INTO audit_events(event_id,subject_type,subject_id,event_type,actor_type,reason_code,payload)
     VALUES($1,'submission',$2,'status_changed',$3,$4,$5::jsonb)`,
    [createEventId(), publicId, actor, reasonCode, JSON.stringify({ from, to, ...payload })]
  );
}

async function handlePiiScan(job) {
  const q = await pool.query('SELECT id,public_id,original_text,current_status FROM submissions WHERE public_id=$1', [job.subject_id]);
  if (!q.rowCount) throw new Error('submission missing');
  const row = q.rows[0];
  const flags = piiFlags(row.original_text);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (flags.length) {
      await client.query(
        `INSERT INTO abuse_signals(submission_id,signal_type,signal_value,expires_at)
         VALUES($1,'pii_detected',$2::jsonb,now()+interval '30 days')`,
        [row.id, JSON.stringify({ flags })]
      );
      if (row.current_status === 'received') await statusChange(client, row.public_id, 'privacy_hold', 'system', 'PII_REVIEW', { flags });
    } else {
      await enqueue(client, 'structure_submission', row.public_id, { source: 'pii_scan_pass' });
    }
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
  return { flags, next: flags.length ? 'privacy_hold' : 'structure_submission' };
}

async function handleStructure(job) {
  const q = await pool.query('SELECT id,public_id,original_text,region,topic,current_status FROM submissions WHERE public_id=$1', [job.subject_id]);
  if (!q.rowCount) throw new Error('submission missing');
  const row = q.rows[0];
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO structured_proposals(submission_id,problem,proposal,goal,suggested_level,topic,region,open_questions,citizen_confirmed)
       VALUES($1,$2,$3,NULL,NULL,$4,$5,'[]'::jsonb,false)
       ON CONFLICT(submission_id) DO UPDATE SET problem=excluded.problem,proposal=excluded.proposal,topic=excluded.topic,region=excluded.region,updated_at=now()`,
      [row.id, row.original_text, row.original_text, row.topic, row.region]
    );
    if (row.current_status === 'received') await statusChange(client, row.public_id, 'structured', 'system', null, { mode: 'safe_fallback_without_ai' });
    await enqueue(client, 'lexical_duplicate_search', row.public_id, { threshold: LEXICAL_DUPLICATE_THRESHOLD });
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
  return { mode: 'safe_fallback_without_ai', next: 'lexical_duplicate_search' };
}

async function handleLexicalDuplicateSearch(job) {
  const q = await pool.query('SELECT id,public_id,original_text,region,topic,current_status,cluster_id FROM submissions WHERE public_id=$1', [job.subject_id]);
  if (!q.rowCount) throw new Error('submission missing');
  const row = q.rows[0];
  const threshold = Number(job.payload?.threshold || LEXICAL_DUPLICATE_THRESHOLD);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    if (row.current_status === 'structured') await statusChange(client, row.public_id, 'cluster_review', 'system', null, { method: 'pg_trgm', threshold });
    const candidates = await client.query(
      `SELECT id,public_id,cluster_id,similarity(original_text,$2) AS sim
         FROM submissions
        WHERE public_id<>$1 AND similarity(original_text,$2) >= $3
        ORDER BY sim DESC, created_at ASC
        LIMIT 5`,
      [row.public_id, row.original_text, threshold]
    );
    if (!candidates.rowCount) {
      await client.query('COMMIT');
      return { match: false, threshold, next: 'semantic_similarity_pending' };
    }

    const candidate = candidates.rows[0];
    let clusterDbId = candidate.cluster_id;
    let clusterPublicId = null;
    if (!clusterDbId) {
      clusterPublicId = createClusterId();
      const c = await client.query(
        `INSERT INTO clusters(cluster_id,title,topic,region_scope,review_status)
         VALUES($1,'Vorläufiger Cluster – interne Prüfung',$2,$3,'cluster_review') RETURNING id`,
        [clusterPublicId, row.topic || null, row.region || null]
      );
      clusterDbId = c.rows[0].id;
      await client.query('UPDATE submissions SET cluster_id=$2,updated_at=now() WHERE id=$1', [candidate.id, clusterDbId]);
      await client.query(
        `INSERT INTO cluster_members(cluster_id,submission_id,similarity,assignment_method)
         VALUES($1,$2,$3,'lexical_pg_trgm') ON CONFLICT DO NOTHING`,
        [clusterDbId, candidate.id, candidate.sim]
      );
    } else {
      const c = await client.query('SELECT cluster_id FROM clusters WHERE id=$1', [clusterDbId]);
      clusterPublicId = c.rows[0]?.cluster_id || null;
    }

    await client.query('UPDATE submissions SET cluster_id=$2,updated_at=now() WHERE id=$1', [row.id, clusterDbId]);
    await client.query(
      `INSERT INTO cluster_members(cluster_id,submission_id,similarity,assignment_method)
       VALUES($1,$2,$3,'lexical_pg_trgm') ON CONFLICT DO NOTHING`,
      [clusterDbId, row.id, candidate.sim]
    );
    await statusChange(client, row.public_id, 'clustered', 'system', 'DUPLICATE_CLUSTERED', {
      method: 'lexical_pg_trgm', threshold, matched_public_id: candidate.public_id, similarity: Number(candidate.sim), cluster_id: clusterPublicId
    });
    await client.query('COMMIT');
    return { match: true, cluster_id: clusterPublicId, matched_public_id: candidate.public_id, similarity: Number(candidate.sim), method: 'lexical_pg_trgm' };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}

const handlers = {
  pii_scan: handlePiiScan,
  structure_submission: handleStructure,
  lexical_duplicate_search: handleLexicalDuplicateSearch
};

async function finishJob(job, result) {
  await pool.query(
    `UPDATE processing_jobs SET status='done',payload=payload || $2::jsonb,locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,
    [job.id, JSON.stringify({ result })]
  );
}

async function failJob(job, error) {
  const attemptAfterClaim = Number(job.attempts) + 1;
  const terminal = attemptAfterClaim >= Number(job.max_attempts);
  const delaySeconds = Math.min(300, Math.max(5, 2 ** attemptAfterClaim * 5));
  await pool.query(
    `UPDATE processing_jobs
        SET status=$2,last_error=$3,locked_at=NULL,locked_by=NULL,
            available_at=CASE WHEN $2='queued' THEN now()+($4::text || ' seconds')::interval ELSE available_at END,
            updated_at=now()
      WHERE id=$1`,
    [job.id, terminal ? 'dead' : 'queued', String(error?.message || error).slice(0,2000), delaySeconds]
  );
}

async function loop() {
  while (!stopping) {
    let job = null;
    try {
      job = await claimJob();
      if (!job) { await new Promise(r => setTimeout(r, POLL_MS)); continue; }
      const handler = handlers[job.job_type];
      if (!handler) throw new Error(`No worker handler for job_type=${job.job_type}`);
      const result = await handler(job);
      await finishJob(job, result);
    } catch (e) {
      console.error('[ideenwerk-worker]', e);
      if (job) {
        try { await failJob(job, e); }
        catch (failErr) { console.error('[ideenwerk-worker] failJob failed', failErr); }
      }
      await new Promise(r => setTimeout(r, POLL_MS));
    }
  }
}

async function shutdown() {
  stopping = true;
  await pool.end();
  process.exit(0);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`[ideenwerk-worker] ${WORKER_ID} started`);
loop();
