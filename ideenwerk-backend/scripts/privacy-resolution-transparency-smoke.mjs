import pg from 'pg';
import { randomBytes } from 'node:crypto';

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });
const suffix = randomBytes(8).toString('hex').toUpperCase();
const publicId = `IDEA-${suffix}`;
const requestId = `PRIV-${suffix}`;
const tokenHash = 'c'.repeat(64);
const operatorHash = 'd'.repeat(64);

function fail(message) {
  throw new Error(`[privacy-resolution-transparency] ${message}`);
}

function requestFrom(payload, path) {
  const request = path.reduce((value, key) => value?.[key], payload);
  if (!request || typeof request !== 'object') fail(`missing request at ${path.join('.')}`);
  return request;
}

function assertCitizenContract(request, surface) {
  if (request.status !== 'resolved') fail(`${surface} missing resolved status`);
  if (!request.review_started_at) fail(`${surface} missing review_started_at`);
  if (!request.resolved_at) fail(`${surface} missing resolved_at`);
  if (request.decision_reason_code !== 'TEST_RESOLVED') fail(`${surface} missing reason code`);
  if (Object.prototype.hasOwnProperty.call(request, 'assigned_operator_id')) {
    fail(`${surface} leaked assigned_operator_id`);
  }
}

await client.connect();
try {
  await client.query('BEGIN');

  const submission = await client.query(
    `INSERT INTO submissions(public_id,original_text,current_status,region,topic)
     VALUES($1,'Synthetic privacy transparency test','precheck','Wien','Verwaltung') RETURNING id`,
    [publicId]
  );
  const submissionId = submission.rows[0].id;

  await client.query(
    `INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,
    [submissionId, tokenHash]
  );

  const operator = await client.query(
    `INSERT INTO operators(external_subject_hash,display_name)
     VALUES($1,'Synthetic Privacy Reviewer') RETURNING id`,
    [operatorHash]
  );
  await client.query(
    `INSERT INTO operator_roles(operator_id,role) VALUES($1,'legal_reviewer')`,
    [operator.rows[0].id]
  );

  await client.query(
    `INSERT INTO privacy_requests(request_id,submission_id,request_type,details)
     VALUES($1,$2,'correction','synthetic transparency contract test')`,
    [requestId, submissionId]
  );

  await client.query(
    `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'reviewing','TEST_REVIEW_STARTED')`,
    [requestId, operatorHash]
  );
  await client.query(
    `SELECT ideenwerk_operator_transition_privacy_request($1,$2,'resolved','TEST_RESOLVED')`,
    [requestId, operatorHash]
  );

  const statusResult = await client.query(
    `SELECT ideenwerk_get_private_status($1,$2) AS payload`,
    [publicId, tokenHash]
  );
  const listResult = await client.query(
    `SELECT ideenwerk_list_privacy_requests($1,$2) AS payload`,
    [publicId, tokenHash]
  );
  const exportResult = await client.query(
    `SELECT ideenwerk_get_privacy_export($1,$2) AS payload`,
    [publicId, tokenHash]
  );

  assertCitizenContract(requestFrom(statusResult.rows[0].payload, ['privacy_requests', 0]), 'private status');
  assertCitizenContract(requestFrom(listResult.rows[0].payload, ['requests', 0]), 'privacy list');
  assertCitizenContract(requestFrom(exportResult.rows[0].payload, ['privacy_requests', 0]), 'privacy export');

  const denied = await client.query(
    `SELECT ideenwerk_get_private_status($1,$2) AS payload`,
    [publicId, 'e'.repeat(64)]
  );
  if (denied.rows[0].payload !== null) fail('wrong status token unexpectedly authorized');

  console.log('[privacy-resolution-transparency] PASS');
  await client.query('ROLLBACK');
} catch (error) {
  try { await client.query('ROLLBACK'); } catch {}
  console.error(error);
  process.exitCode = 1;
} finally {
  await client.end();
}
