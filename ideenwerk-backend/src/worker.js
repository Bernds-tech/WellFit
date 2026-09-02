import os from 'node:os';
import pg from 'pg';
import { createEventId } from './lib/status-token.js';
import { assertTransition } from './lib/status-machine.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const WORKER_ID = process.env.WORKER_ID || `${os.hostname()}-${process.pid}`;
const POLL_MS = Number(process.env.WORKER_POLL_MS || 1500);
let stopping = false;

function piiFlags(text='') {
  const flags = [];
  if (/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)) flags.push('email');
  if (/(?:\+43|0043|0)\s?\d[\d\s\/-]{6,}/.test(text)) flags.push('phone');
  return flags;
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
  if (!flags.length) return { flags: [] };
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO abuse_signals(submission_id,signal_type,signal_value,expires_at)
       VALUES($1,'pii_detected',$2::jsonb,now()+interval '30 days')`,
      [row.id, JSON.stringify({ flags })]
    );
    if (row.current_status === 'received') await statusChange(client, row.public_id, 'privacy_hold', 'system', 'PII_REVIEW', { flags });
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
  return { flags };
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
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
  return { mode: 'safe_fallback_without_ai' };
}

const handlers = {
  pii_scan: handlePiiScan,
  structure_submission: handleStructure
};

async function finishJob(job, result) {
  await pool.query(
    `UPDATE processing_jobs SET status='done',payload=payload || $2::jsonb,locked_at=NULL,locked_by=NULL,updated_at=now() WHERE id=$1`,
    [job.id, JSON.stringify({ result })]
  );
}

async function failJob(job, error) {
  const terminal = Number(job.attempts) + 1 >= Number(job.max_attempts);
  const delaySeconds = Math.min(300, Math.max(5, 2 ** Number(job.attempts) * 5));
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
    try {
      const job = await claimJob();
      if (!job) { await new Promise(r => setTimeout(r, POLL_MS)); continue; }
      const handler = handlers[job.job_type];
      if (!handler) throw new Error(`No worker handler for job_type=${job.job_type}`);
      const result = await handler(job);
      await finishJob(job, result);
    } catch (e) {
      console.error('[ideenwerk-worker]', e);
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
