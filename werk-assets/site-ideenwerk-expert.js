(()=>{
'use strict';
const nativeFetch=window.fetch.bind(window);
let lastStatus=null;
const safe=(v)=>String(v??'').trim();
const labelType=(v)=>({subject_matter_expert:'Fachexpertise',affected_person:'Betroffene Person',practitioner:'Praxis',researcher:'Forschung',institution:'Institution',other:'Weitere Perspektive'}[v]||'Fach- oder Betroffeneninput');
const labelRelation=(v)=>({none_declared:'Keine besondere Beziehung offengelegt',professional:'Beruflicher Bezug',financial:'Finanzieller Bezug',organizational:'Organisatorischer Bezug',directly_affected:'Direkt betroffen',other:'Anderer offengelegter Bezug'}[v]||'Beziehung offengelegt');
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function safeLink(url,label){try{const u=new URL(url,location.href);if(!/^https?:$/.test(u.protocol))return null;const a=el('a','iwExpertLink',label||u.hostname);a.href=u.href;a.target='_blank';a.rel='noopener noreferrer';return a}catch{return null}}
function render(data){
  if(!data||!Array.isArray(data.expert_inputs))return;
  const host=document.getElementById('iwStatusDetail');
  if(!host)return;
  const entries=data.expert_inputs;
  const signature=JSON.stringify(entries.map(x=>[x.expert_input_id,x.created_at]));
  const old=host.querySelector('[data-werk-expert-input]');
  if(old&&old.dataset.signature===signature)return;
  if(old)old.remove();
  if(!entries.length)return;
  const section=el('section','iwExpertSection');
  section.dataset.werkExpertInput='1';section.dataset.signature=signature;
  section.append(el('h4','',`Fach- & Betroffeneninput (${entries.length})`));
  section.append(el('p','iwMuted','Diese Beiträge ergänzen die Prüfung mit offengelegter Quelle und Beziehung. Sie sind kein Expertenveto, keine politische Wertung und keine automatische Annahme oder Ablehnung.'));
  entries.forEach((x)=>{
    const card=el('article','iwExpertCard');
    const head=el('div','iwExpertHead');
    head.append(el('b','',labelType(x.contributor_type)));
    head.append(el('span','',safe(x.expertise_or_affected_role)));
    card.append(head);
    const src=el('p','iwExpertSource');src.append(document.createTextNode(`Quelle: ${safe(x.source_label)}`));
    const link=safeLink(x.source_url,' Quelle öffnen');if(link){src.append(document.createTextNode(' · '));src.append(link)}
    if(safe(x.source_reference))src.append(document.createTextNode(` · Referenz: ${safe(x.source_reference)}`));
    card.append(src);
    const rel=el('p','iwExpertRelation',labelRelation(x.relationship_code));
    if(safe(x.relationship_disclosure))rel.append(document.createTextNode(`: ${safe(x.relationship_disclosure)}`));
    card.append(rel);
    card.append(el('p','iwExpertStatement',safe(x.statement)));
    if(safe(x.evidence_note))card.append(el('p','iwExpertEvidence',`Evidenzhinweis: ${safe(x.evidence_note)}`));
    if(x.counterposition&&safe(x.counterposition.summary)){
      const counter=el('div','iwExpertCounter');counter.append(el('b','','Gegenposition / Gegenbeleg'));
      counter.append(el('p','',safe(x.counterposition.summary)));
      const cp=el('p','iwExpertSource',`Quelle: ${safe(x.counterposition.source_label)}`);
      const cpLink=safeLink(x.counterposition.source_url,' Quelle öffnen');if(cpLink){cp.append(document.createTextNode(' · '));cp.append(cpLink)}
      if(safe(x.counterposition.source_reference))cp.append(document.createTextNode(` · Referenz: ${safe(x.counterposition.source_reference)}`));
      counter.append(cp);card.append(counter);
    }
    card.append(el('small','iwMuted',safe(x.boundary)));
    section.append(card);
  });
  host.append(section);
}
window.fetch=async(...args)=>{
  const response=await nativeFetch(...args);
  try{
    const raw=typeof args[0]==='string'?args[0]:(args[0]&&args[0].url)||'';
    const method=String((args[1]&&args[1].method)||(args[0]&&args[0].method)||'GET').toUpperCase();
    if(method==='GET'&&/\/submissions\/IDEA-[A-F0-9]{16}\/status(?:\?|$)/.test(raw)&&response.ok){
      response.clone().json().then((data)=>{lastStatus=data;requestAnimationFrame(()=>render(data))}).catch(()=>{});
    }
  }catch{}
  return response;
};
const observer=new MutationObserver(()=>{if(lastStatus)render(lastStatus)});
window.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
})();
