import pg from 'pg';
import assert from 'node:assert/strict';
const {Client}=pg;
const client=new Client({connectionString:process.env.DATABASE_URL});
if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
await client.connect();
async function expectPgError(sql,params,needle){await client.query('SAVEPOINT expected_error');let seen='';try{await client.query(sql,params)}catch(e){seen=String(e?.message||e)}await client.query('ROLLBACK TO SAVEPOINT expected_error');await client.query('RELEASE SAVEPOINT expected_error');assert.ok(seen.includes(needle),`expected ${needle}, got ${seen||'no error'}`)}
const publicId='IDEA-A150000000000040',tokenHash='b'.repeat(64);
try{
 await client.query('BEGIN');
 const access=await client.query(`SELECT has_table_privilege('anon','public.ideenwerk_ai_syntheses','SELECT') anon_select,has_table_privilege('authenticated','public.ideenwerk_ai_syntheses','SELECT') auth_select,has_function_privilege('anon','public.ideenwerk_record_ai_synthesis(text,text,text,jsonb,text,text,text)','EXECUTE') anon_exec`);
 assert.equal(access.rows[0].anon_select,false);assert.equal(access.rows[0].auth_select,false);assert.equal(access.rows[0].anon_exec,false);
 const op=await client.query(`INSERT INTO operators(external_subject_hash,display_name,active) VALUES($1,'CI Impact Reviewer',true) RETURNING id`,['4'.repeat(64)]);
 await client.query(`INSERT INTO operator_roles(operator_id,role) VALUES($1,'impact_reviewer')`,[op.rows[0].id]);
 const sub=await client.query(`INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status) VALUES($1,'ci-ai-synthesis','Die Arbeitslosenversicherung soll einfacher und nachvollziehbar reformiert werden.','Österreich','Sozialversicherung','received') RETURNING id`,[publicId]);
 await client.query(`INSERT INTO status_access(submission_id,token_hash) VALUES($1,$2)`,[sub.rows[0].id,tokenHash]);
 await client.query(`INSERT INTO structured_proposals(submission_id,problem,proposal,topic,region,open_questions,citizen_confirmed) VALUES($1,'Belastung und Systemkomplexität','Reformvarianten transparent prüfen','Sozialversicherung','Österreich','[]'::jsonb,false)`,[sub.rows[0].id]);
 await client.query(`SELECT public.ideenwerk_run_impact_bridge_check($1)`,[publicId]);
 const expertArgs=[op.rows[0].id,publicId,'subject_matter_expert','Sozialversicherungsrecht','Fachquelle','https://example.org/fachquelle','REF-40','professional','Fachlicher Bezug ohne Entscheidungsbefugnis.','Eine schrittweise Prüfung reduziert das Risiko, unterschiedliche Rechts- und Finanzierungsfragen zu vermischen.','Keine vollständige Wirkungsprognose.','Eine Betroffenenperspektive weist auf Umsetzungsrisiken hin.','Gegenquelle','https://example.org/gegenquelle','GREF-40',true,true,'ci-ai-expert-40'];
 const expertFn=`SELECT public.ideenwerk_record_expert_input(${expertArgs.map((_,i)=>`$${i+1}`).join(',')}) AS result`;
 const expert=await client.query(expertFn,expertArgs);const expertId=expert.rows[0].result.expert_input_id;
 const snapshot=await client.query(`SELECT public.ideenwerk_ai_synthesis_source_snapshot($1::uuid) AS data`,[sub.rows[0].id]);
 assert.equal(snapshot.rows[0].data.eligible,true);assert.ok(snapshot.rows[0].data.impact_bridge.mapping_refs.includes('IMPACT-SV-EMPLOYEE'));assert.ok(snapshot.rows[0].data.expert_input_refs.includes(expertId));
 const variants=[
  {variant_id:'V1',title:'Stufenmodell',summary:'Die Umsetzung wird in getrennte Prüfschritte gegliedert.',mechanism:'Bestehende Reformpfade werden nacheinander geprüft.',tradeoffs:['Mehr Zwischenschritte.'],uncertainties:['Rechtsdetails bleiben offen.'],source_refs:[{kind:'citizen_problem',ref_id:'CITIZEN-PROBLEM'},{kind:'impact_map',ref_id:'IMPACT-SV-EMPLOYEE'},{kind:'expert_input',ref_id:expertId}]},
  {variant_id:'V2',title:'Pilot mit Rückkopplung',summary:'Ein begrenzter Umsetzungspfad wird vor einer Ausweitung erneut bewertet.',mechanism:'Wirkungsprüfung und Betroffenenfeedback werden zwischen die Stufen gesetzt.',tradeoffs:['Langsamerer Rollout.'],uncertainties:['Übertragbarkeit bleibt offen.'],source_refs:[{kind:'citizen_problem',ref_id:'CITIZEN-PROBLEM'},{kind:'impact_map',ref_id:'IMPACT-SV-EMPLOYEE'},{kind:'expert_input',ref_id:expertId}]}
 ];
 const fn=`SELECT public.ideenwerk_record_ai_synthesis($1,$2,$3,$4::jsonb,$5,$6,$7) AS result`;
 const args=[publicId,'ci_http_json','ci-model-v1',JSON.stringify(variants),'Rechts- und Vollzugsfragen bleiben getrennt zu prüfen.',snapshot.rows[0].data.snapshot_hash,'ci-ai-synth-40'];
 const first=await client.query(fn,args);assert.equal(first.rows[0].result.replayed,false);assert.match(first.rows[0].result.synthesis_id,/^SYN-[A-F0-9]{20}$/);
 const replay=await client.query(fn,args);assert.equal(replay.rows[0].result.replayed,true);
 const changed=structuredClone(variants);changed[0].summary='Geänderter Inhalt';await expectPgError(fn,[...args.slice(0,3),JSON.stringify(changed),...args.slice(4)],'AI_SYNTHESIS_IDEMPOTENCY_CONFLICT');
 const ranked=structuredClone(variants);ranked[0].rank=1;await expectPgError(fn,[publicId,'ci_http_json','ci-model-v1',JSON.stringify(ranked),null,snapshot.rows[0].data.snapshot_hash,'ci-ai-synth-rank'],'AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN');
 const numeric=structuredClone(variants);numeric[0].summary='Diese Variante spart 10 %.';await expectPgError(fn,[publicId,'ci_http_json','ci-model-v1',JSON.stringify(numeric),null,snapshot.rows[0].data.snapshot_hash,'ci-ai-synth-num'],'AI_SYNTHESIS_NUMERIC_EFFECT_TEXT_FORBIDDEN');
 const staleRef=structuredClone(variants);staleRef[0].source_refs=[{kind:'expert_input',ref_id:'EXP-STALE'}];await expectPgError(fn,[publicId,'ci_http_json','ci-model-v1',JSON.stringify(staleRef),null,snapshot.rows[0].data.snapshot_hash,'ci-ai-synth-ref'],'AI_SYNTHESIS_SOURCE_REF_NOT_CURRENT');
 await expectPgError(`UPDATE public.ideenwerk_ai_syntheses SET model_version='tampered' WHERE synthesis_id=$1`,[first.rows[0].result.synthesis_id],'AI_SYNTHESIS_APPEND_ONLY');
 let status=await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS data`,[publicId,tokenHash]);assert.equal(status.rows[0].data.ai_synthesis.state,'current');assert.equal(status.rows[0].data.ai_synthesis.variants.length,2);
 await client.query(`UPDATE public.ideenwerk_impact_bridge_checks SET registry_version='stale-ci-version' WHERE submission_id=$1`,[sub.rows[0].id]);
 status=await client.query(`SELECT public.ideenwerk_get_private_status($1,$2) AS data`,[publicId,tokenHash]);assert.equal(status.rows[0].data.ai_synthesis.state,'revalidation_required');assert.equal(status.rows[0].data.ai_synthesis.variants.length,0);
 await client.query('ROLLBACK');console.log('AI synthesis DB smoke: PASS');
}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e}finally{await client.end()}
