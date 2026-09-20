import crypto from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const assert = (condition,message) => { if (!condition) throw new Error(message); };

const suffix = crypto.randomBytes(8).toString('hex').toUpperCase();
const publicId = `IDEA-${suffix}`;
const piiPublicId = `IDEA-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
const token = `clarification-ci-${crypto.randomBytes(16).toString('hex')}`;
const tokenHash = hash(token);
const original = 'Eine bestehende Regel soll verständlicher und einfacher überprüfbar werden.';
const clarification = 'Gemeint ist ausschließlich der digitale Antrag; die fachliche Entscheidung bleibt unverändert.';

async function seed(id) {
  const q = await pool.query(
    `INSERT INTO submissions(public_id,original_text,region,topic,current_status)
     VALUES($1,$2,'Österreich','Verwaltung','clarification') RETURNING id`,
    [id,original]
  );
  await pool.query(`INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,[q.rows[0].id,tokenHash]);
  return q.rows[0].id;
}

try {
  const submissionId = await seed(publicId);

  const denied = await pool.query(
    `SELECT ideenwerk_submit_clarification($1,$2,$3,$4) AS result`,
    [publicId,hash('wrong-token'),clarification,'ci-denied']
  );
  assert(denied.rows[0].result === null,'wrong token must be denied');

  const accepted = await pool.query(
    `SELECT ideenwerk_submit_clarification($1,$2,$3,$4) AS result`,
    [publicId,tokenHash,clarification,'ci-clarification-1']
  );
  const first = accepted.rows[0].result;
  assert(first?.accepted === true && first?.replayed === false,'clarification was not accepted');
  assert(first?.status === 'cluster_review','clarification did not re-enter cluster review');

  const state = await pool.query(
    `SELECT s.original_text,s.current_status,p.proposal,p.citizen_confirmed,
            f.provider,f.model_version,
            (SELECT count(*)::int FROM citizen_clarifications c WHERE c.submission_id=s.id) AS clarification_count,
            (SELECT count(*)::int FROM processing_jobs j WHERE j.subject_id=s.public_id AND j.job_type='semantic_cluster_review' AND j.status='queued') AS queued_review,
            (SELECT count(*)::int FROM audit_events a WHERE a.subject_id=s.public_id AND a.event_type='clarification_received') AS clarification_events
       FROM submissions s
       JOIN structured_proposals p ON p.submission_id=s.id
       JOIN proposal_features f ON f.submission_id=s.id
      WHERE s.id=$1`,[submissionId]
  );
  const row = state.rows[0];
  assert(row.original_text === original,'immutable original_text was changed');
  assert(row.current_status === 'cluster_review','unexpected current status');
  assert(row.proposal.includes(clarification),'derived proposal does not consume clarification');
  assert(row.citizen_confirmed === true,'citizen confirmation flag missing');
  assert(row.provider === 'deterministic_clarification' && row.model_version === 'clarification-v1-sql','clarification semantic provider not recorded');
  assert(row.clarification_count === 1,'clarification row count mismatch');
  assert(row.queued_review === 1,'semantic review was not queued');
  assert(row.clarification_events === 1,'clarification audit event missing');

  const replay = await pool.query(
    `SELECT ideenwerk_submit_clarification($1,$2,$3,$4) AS result`,
    [publicId,tokenHash,clarification,'ci-clarification-1']
  );
  assert(replay.rows[0].result?.replayed === true,'idempotent replay not detected');
  const countAfterReplay = await pool.query(`SELECT count(*)::int AS n FROM citizen_clarifications WHERE submission_id=$1`,[submissionId]);
  assert(countAfterReplay.rows[0].n === 1,'idempotent replay created a duplicate clarification');

  const listed = await pool.query(`SELECT ideenwerk_list_clarifications($1,$2) AS result`,[publicId,tokenHash]);
  assert(listed.rows[0].result?.clarifications?.length === 1,'private clarification list missing response');

  const piiSubmissionId = await seed(piiPublicId);
  const pii = await pool.query(
    `SELECT ideenwerk_submit_clarification($1,$2,$3,$4) AS result`,
    [piiPublicId,tokenHash,'Bitte dazu test@example.com kontaktieren.','ci-pii']
  );
  assert(pii.rows[0].result?.accepted === false && pii.rows[0].result?.code === 'CLARIFICATION_PII_DETECTED','PII guard did not reject contact data');
  const piiState = await pool.query(`SELECT current_status FROM submissions WHERE id=$1`,[piiSubmissionId]);
  assert(piiState.rows[0].current_status === 'clarification','PII rejection changed workflow state');

  console.log('clarification contract OK: token boundary, immutable original, private persistence, idempotency, PII guard and semantic re-entry verified');
} finally {
  await pool.query(`DELETE FROM submissions WHERE public_id IN ($1,$2)`,[publicId,piiPublicId]).catch(()=>{});
  await pool.end();
}
