import fs from 'node:fs';
const p='werk-data/verified-support-identity-architecture.json';
const x=JSON.parse(fs.readFileSync(p,'utf8'));
const fail=(m)=>{throw new Error(m)};
if(x.status!=='technical_architecture_options_no_identity_provider_selected') fail('identity must remain unselected');
if(x.activation_gate?.support_counting!==false||x.activation_gate?.vote!==false||x.activation_gate?.production!==false) fail('activation boundary missing');
if(!Array.isArray(x.models)||x.models.length<2) fail('at least two identity models required');
if(x.selected_model||x.recommended_model||x.winner) fail('identity model ranking/selection forbidden');
for(const m of x.models){
 if(m.selection_status!=='candidate_not_selected') fail('model selected: '+m.id);
 if(!Array.isArray(m.sources)||m.sources.length===0) fail('model source missing: '+m.id);
}
const forbidden=new Set(x.neutral_core_design?.forbidden_persistence||[]);
for(const k of ['name','date_of_birth','raw_bPK_or_equivalent_government_identifier']) if(!forbidden.has(k)) fail('missing forbidden persistence '+k);
if(!String(x.neutral_core_design?.pseudonym_derivation||'').includes('HMAC-SHA256')) fail('scoped pseudonym design missing');
if(!Array.isArray(x.threat_model)||x.threat_model.length<7) fail('threat model too small');
const graph=JSON.parse(fs.readFileSync('werk-data/werk-system-graph.json','utf8'));
if(!(graph.nodes||[]).some(n=>n.id==='IDENTITY-ARCHITECTURE')) fail('identity architecture missing from system graph');
if(!(graph.edges||[]).some(e=>e.from==='IDENTITY-ARCHITECTURE'&&e.to==='VERIFIED-SUPPORT'&&e.relation==='required_before_identity_activation')) fail('identity -> verified support gate missing');
console.log('WERK verified-support identity architecture contract: PASS');
