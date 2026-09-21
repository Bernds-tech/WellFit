import http from 'node:http';
import assert from 'node:assert/strict';
import {synthesizeVariants,validateSynthesisPayload} from '../src/lib/synthesis-provider.js';

const context={impact_map_refs:['IMPACT-SV-EMPLOYEE'],expert_input_refs:['EXP-ABC'],citizen_problem:{ref_id:'CITIZEN-PROBLEM'}};
const disabled=await synthesizeVariants(context);
assert.equal(disabled.available,false);
assert.equal(disabled.reason,'SYNTHESIS_PROVIDER_DISABLED');

const valid={model_version:'ci-model-v1',uncertainty_summary:'Offene Vollzugs- und Rechtsfragen bleiben getrennt zu prüfen.',variants:[
 {variant_id:'V1',title:'Stufenmodell',summary:'Die Entlastung wird in klar getrennte Umsetzungsschritte zerlegt.',mechanism:'Bestehende WERK-Reformpfade werden schrittweise kombiniert.',tradeoffs:['Mehr Prüfschritte vor Umsetzung.'],uncertainties:['Rechts- und Vollzugsdetails bleiben offen.'],source_refs:[{kind:'citizen_problem',ref_id:'CITIZEN-PROBLEM'},{kind:'impact_map',ref_id:'IMPACT-SV-EMPLOYEE'},{kind:'expert_input',ref_id:'EXP-ABC'}]},
 {variant_id:'V2',title:'Pilot mit Rückkopplung',summary:'Eine begrenzte Umsetzung wird mit vorab definierten Prüfpfaden gekoppelt.',mechanism:'Die Wirkung wird vor einer Ausweitung erneut bewertet.',tradeoffs:['Langsamerer Rollout.'],uncertainties:['Übertragbarkeit bleibt zu prüfen.'],source_refs:[{kind:'citizen_problem',ref_id:'CITIZEN-PROBLEM'},{kind:'impact_map',ref_id:'IMPACT-SV-EMPLOYEE'},{kind:'expert_input',ref_id:'EXP-ABC'}]}
]};
assert.equal(validateSynthesisPayload(valid,context).variants.length,2);
assert.throws(()=>validateSynthesisPayload({...valid,variants:[{...valid.variants[0],rank:1},valid.variants[1]]},context),/POLITICAL_RANKING/);
assert.throws(()=>validateSynthesisPayload({...valid,variants:[{...valid.variants[0],summary:'Das spart 10 %.'},valid.variants[1]]},context),/NUMERIC_EFFECT/);
assert.throws(()=>validateSynthesisPayload({...valid,variants:[{...valid.variants[0],source_refs:[{kind:'expert_input',ref_id:'EXP-STALE'}]},valid.variants[1]]},context),/SOURCE_REF_NOT_CURRENT/);

const server=http.createServer((req,res)=>{let body='';req.on('data',c=>body+=c);req.on('end',()=>{const payload=JSON.parse(body);assert.equal(payload.task,'werk_ideenwerk_synthesis');res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify(valid))})});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
try{
  process.env.SYNTHESIS_PROVIDER='http_json';
  process.env.SYNTHESIS_ENDPOINT=`http://127.0.0.1:${server.address().port}`;
  const result=await synthesizeVariants(context);
  assert.equal(result.available,true);
  assert.equal(result.model_version,'ci-model-v1');
  assert.equal(result.variants.length,2);
}finally{server.close();delete process.env.SYNTHESIS_PROVIDER;delete process.env.SYNTHESIS_ENDPOINT}
console.log('AI synthesis provider smoke: PASS');
