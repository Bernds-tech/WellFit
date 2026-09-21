import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
if(!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const c=new Client({connectionString:process.env.DATABASE_URL});
await c.connect();
async function expectError(sql,params,needle){await c.query('SAVEPOINT exp');let m='';try{await c.query(sql,params)}catch(e){m=String(e?.message||e)}await c.query('ROLLBACK TO SAVEPOINT exp');await c.query('RELEASE SAVEPOINT exp');assert.ok(m.includes(needle),`expected ${needle}, got ${m||'no error'}`)}
try{
 await c.query('BEGIN');
 const priv=await c.query(`SELECT
   has_table_privilege('anon','public.werk_identity_verification_receipts','SELECT') anon_select,
   has_table_privilege('authenticated','public.werk_identity_verification_receipts','SELECT') auth_select,
   has_function_privilege('anon','public.werk_record_verified_support(text,text,text,text)','EXECUTE') anon_exec,
   has_function_privilege('authenticated','public.werk_record_verified_support(text,text,text,text)','EXECUTE') auth_exec,
   has_function_privilege('service_role','public.werk_record_verified_support(text,text,text,text)','EXECUTE') service_exec`);
 assert.equal(priv.rows[0].anon_select,false);assert.equal(priv.rows[0].auth_select,false);assert.equal(priv.rows[0].anon_exec,false);assert.equal(priv.rows[0].auth_exec,false);assert.equal(priv.rows[0].service_exec,true);

 const cols=await c.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='werk_identity_verification_receipts'`);
 const names=new Set(cols.rows.map(r=>r.column_name));
 for(const forbidden of ['name','date_of_birth','address','bpk','raw_provider_subject','provider_access_token']) assert.equal(names.has(forbidden),false);

 const receiptFn=`SELECT public.werk_record_identity_verification_receipt($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS data`;
 const args=['synthetic_reference','test_scheme',null,'a'.repeat(64),'cluster_variant:VAR-TEST-001','b'.repeat(64),'elig-v1',new Date().toISOString(),new Date(Date.now()+3600000).toISOString(),'ci-identity-receipt-0001'];
 const first=await c.query(receiptFn,args);assert.equal(first.rows[0].data.replayed,false);
 const receiptId=first.rows[0].data.receipt_id;assert.match(receiptId,/^VREC-[A-F0-9]{20}$/);
 const replay=await c.query(receiptFn,args);assert.equal(replay.rows[0].data.replayed,true);
 const changed=[...args];changed[5]='c'.repeat(64);await expectError(receiptFn,changed,'WERK_IDENTITY_IDEMPOTENCY_CONFLICT');

 const supportFn=`SELECT public.werk_record_verified_support($1,$2,$3,$4) AS data`;
 const support=await c.query(supportFn,[receiptId,'cluster_variant','VAR-TEST-001','ci-verified-support-0001']);assert.equal(support.rows[0].data.replayed,false);assert.equal(support.rows[0].data.counting_state,'disabled_until_identity_activation');
 const supportReplay=await c.query(supportFn,[receiptId,'cluster_variant','VAR-TEST-001','ci-verified-support-0001']);assert.equal(supportReplay.rows[0].data.replayed,true);
 await expectError(supportFn,[receiptId,'cluster_variant','VAR-OTHER-001','ci-verified-support-0002'],'WERK_SUPPORT_SCOPE_MISMATCH');

 const count=await c.query(`SELECT count(*)::int n FROM public.supports WHERE target_type='cluster_variant' AND target_id='VAR-TEST-001' AND support_type='verified_support'`);
 assert.equal(count.rows[0].n,1);
 const audit=await c.query(`SELECT payload FROM public.audit_events WHERE subject_type='verified_support' ORDER BY created_at DESC LIMIT 1`);
 assert.ok(audit.rows.length===1);assert.equal(Object.prototype.hasOwnProperty.call(audit.rows[0].payload,'scope_pseudonym'),false);assert.equal(Object.prototype.hasOwnProperty.call(audit.rows[0].payload,'provider_assertion_hash'),false);

 const expiredArgs=['synthetic_reference','test_scheme',null,'d'.repeat(64),'cluster_variant:VAR-EXP-001','e'.repeat(64),'elig-v1',new Date(Date.now()-7200000).toISOString(),new Date(Date.now()-3600000).toISOString(),'ci-identity-receipt-expired'];
 const expired=await c.query(receiptFn,expiredArgs);
 await expectError(supportFn,[expired.rows[0].data.receipt_id,'cluster_variant','VAR-EXP-001','ci-verified-support-expired'],'WERK_SUPPORT_VERIFICATION_EXPIRED');

 await c.query('ROLLBACK');
 console.log('Verified support core DB smoke: PASS');
}catch(e){await c.query('ROLLBACK').catch(()=>{});throw e}finally{await c.end()}
