(()=>{
'use strict';
const nativeFetch=window.fetch.bind(window);
let lastStatus=null;
const safe=(v)=>String(v??'').trim();
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function refLabel(ref){const kind=safe(ref&&ref.kind),id=safe(ref&&ref.ref_id);if(kind==='citizen_problem')return 'Bürgeranliegen';if(kind==='impact_map')return `WERK-Wirkungsbezug ${id}`;if(kind==='expert_input')return `Fach-/Betroffeneninput ${id}`;return id||'Quelle'}
function render(data){
  if(!data||!Object.prototype.hasOwnProperty.call(data,'ai_synthesis'))return;
  const host=document.getElementById('iwStatusDetail');if(!host)return;
  const synth=data.ai_synthesis;
  const old=host.querySelector('[data-werk-ai-synthesis]');
  if(!synth){if(old)old.remove();return}
  const signature=JSON.stringify([synth.state,synth.synthesis_id,synth.created_at]);
  if(old&&old.dataset.signature===signature)return;
  if(old)old.remove();
  const section=el('section','iwSynthesisSection');section.dataset.werkAiSynthesis='1';section.dataset.signature=signature;
  section.append(el('h4','','KI-Synthese: Lösungsvarianten'));
  if(synth.state==='revalidation_required'){
    section.append(el('p','iwMuted','Der zugrunde liegende WERK- oder Expertenstand hat sich geändert. Frühere KI-Varianten werden deshalb nicht als aktuell angezeigt; zuerst ist eine erneute Prüfung erforderlich.'));
    host.append(section);return;
  }
  const variants=Array.isArray(synth.variants)?synth.variants:[];
  if(!variants.length)return;
  section.append(el('p','iwMuted','Die Varianten sind nachvollziehbares Arbeits- und Diskussionsmaterial. WERK reiht sie nicht, empfiehlt keinen Gewinner und trifft damit keine politische Entscheidung. Quantitative Wirkungen bleiben in den verknüpften WERK-Rechenartefakten.'));
  variants.forEach((v)=>{
    const card=el('article','iwSynthesisCard');
    card.append(el('h5','',safe(v.title)||safe(v.variant_id)||'Variante'));
    if(safe(v.summary))card.append(el('p','iwSynthesisSummary',safe(v.summary)));
    if(safe(v.mechanism))card.append(el('p','iwSynthesisMechanism',`Mechanismus: ${safe(v.mechanism)}`));
    const tradeoffs=Array.isArray(v.tradeoffs)?v.tradeoffs:[];
    if(tradeoffs.length){const box=el('div','iwSynthesisTradeoffs');box.append(el('b','','Abwägungen'));const ul=el('ul');tradeoffs.forEach(x=>ul.append(el('li','',safe(x))));box.append(ul);card.append(box)}
    const uncertainties=Array.isArray(v.uncertainties)?v.uncertainties:[];
    if(uncertainties.length){const box=el('div','iwSynthesisUncertainties');box.append(el('b','','Unsicherheiten / offene Prüfung'));const ul=el('ul');uncertainties.forEach(x=>ul.append(el('li','',safe(x))));box.append(ul);card.append(box)}
    const refs=Array.isArray(v.source_refs)?v.source_refs:[];
    if(refs.length){const box=el('div','iwSynthesisSources');box.append(el('b','','Verwendete Quellenbindungen'));const ul=el('ul');refs.forEach(r=>ul.append(el('li','',refLabel(r))));box.append(ul);card.append(box)}
    section.append(card);
  });
  if(safe(synth.uncertainty_summary))section.append(el('p','iwMuted',`Gesamtunsicherheit: ${safe(synth.uncertainty_summary)}`));
  if(safe(synth.model_provider)||safe(synth.model_version))section.append(el('small','iwMuted',`Modellbindung: ${safe(synth.model_provider)} ${safe(synth.model_version)}`.trim()));
  if(safe(synth.boundary))section.append(el('small','iwMuted',safe(synth.boundary)));
  host.append(section);
}
window.fetch=async(...args)=>{
  const response=await nativeFetch(...args);
  try{
    const raw=typeof args[0]==='string'?args[0]:(args[0]&&args[0].url)||'';
    const method=String((args[1]&&args[1].method)||(args[0]&&args[0].method)||'GET').toUpperCase();
    if(method==='GET'&&/\/submissions\/IDEA-[A-F0-9]{16}\/status(?:\?|$)/.test(raw)&&response.ok){response.clone().json().then((data)=>{lastStatus=data;requestAnimationFrame(()=>render(data))}).catch(()=>{})}
  }catch{}
  return response;
};
const observer=new MutationObserver(()=>{if(lastStatus)render(lastStatus)});
window.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
})();
