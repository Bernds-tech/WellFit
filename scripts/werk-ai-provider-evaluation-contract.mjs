import fs from 'node:fs';
const p='werk-data/ideenwerk-ai-provider-evaluation.json';
const x=JSON.parse(fs.readFileSync(p,'utf8'));
const fail=(m)=>{throw new Error(m)};
if(x.status!=='technical_evaluation_no_provider_selected_no_activation') fail('status must remain non-activated');
if(x.activation_gate?.production!==false) fail('production must be false');
if(!Array.isArray(x.candidates)||x.candidates.length<2) fail('at least two provider candidates required');
if(x.selected_provider||x.recommended_provider||x.winner) fail('provider ranking/selection forbidden');
for(const c of x.candidates){
 if(c.selection_status!=='candidate_not_selected') fail('candidate selected unexpectedly: '+c.id);
 if(!Array.isArray(c.sources)||c.sources.length===0) fail('source missing: '+c.id);
 for(const s of c.sources){ if(!/^https:\/\//.test(s.url||'')) fail('invalid source url: '+c.id); }
}
if(x.cost_model?.hard_cap_status!=='OWNER_DECISION_REQUIRED_BEFORE_ACTIVATION') fail('cost cap boundary missing');
const dump=JSON.stringify(x).toLowerCase();
if(/api[_-]?key\s*[:=]\s*["'][a-z0-9_-]{12,}/i.test(dump)) fail('possible secret');
console.log('WERK AI provider evaluation contract: PASS');
