(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function json(path){const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(path+' HTTP '+r.status);return r.json()}
function validateCoverage(master,map){
  const masterDomains=Array.isArray(master.domains)?master.domains:[];
  const mapped=(map.fields||[]).flatMap(f=>Array.isArray(f.domains)?f.domains:[]);
  const counts=new Map();mapped.forEach(d=>counts.set(d,(counts.get(d)||0)+1));
  const masterSet=new Set(masterDomains);
  const missing=masterDomains.filter(d=>!counts.has(d));
  const unknown=[...counts.keys()].filter(d=>!masterSet.has(d));
  const duplicates=[...counts.entries()].filter(([,n])=>n!==1).map(([d,n])=>({domain:d,count:n}));
  return {masterDomains,mapped,missing,unknown,duplicates,ok:masterDomains.length===41&&mapped.length===41&&missing.length===0&&unknown.length===0&&duplicates.length===0};
}
function renderStateNeutrality(core){
  const host=document.getElementById('stateNeutrality');
  if(!host)return;
  const n=core?.state_neutrality;
  if(!n||n.binding!==true){host.hidden=true;host.innerHTML='';return;}
  host.hidden=false;
  host.innerHTML=`<div class="stateNeutralityHead"><div><div class="ey">Verbindlicher Querschnittsgrundsatz</div><h3>${esc(n.name||'Weltanschaulich neutraler Staat')}</h3></div><span class="neutralityBadge">für alle Religionen & Weltanschauungen gleich</span></div><p class="neutralityLead">${esc(n.principle)}</p><div class="neutralityGrid"><div><b>Verfassung vor religiöser Herrschaft</b><p>${esc(n.constitutional_primacy)}</p></div><div><b>Persönliche Freiheit bleibt geschützt</b><p>${esc(n.individual_freedom)}</p></div><div><b>Gleicher Maßstab für alle</b><p>${esc(n.equal_application)}</p></div><div><b>Klare politische Grenze</b><p>${esc(n.political_boundary)}</p></div></div><p class="neutralityRule"><strong>Mitgliedschaft & Partnerschaft:</strong> ${esc(n.membership_rule)}</p>`;
}
async function renderPolicyFields(){
  const grid=document.getElementById('policyFieldGrid');
  const count=document.getElementById('policyFieldCount');
  if(!grid)return;
  try{
    const [core,map,master]=await Promise.all([
      json('./werk-data/core.json?v=20260905-v71-neutrality'),
      json('./werk-data/policy-field-map.json?v=20260905-v71'),
      json('./werk-data/austria-analysis-master.json?v=20260905-v71')
    ]);
    renderStateNeutrality(core);
    const fields=Array.isArray(core.policy_fields)?core.policy_fields:[];
    if(fields.length!==12)throw new Error('Erwartet werden 12 Leitfelder, erhalten: '+fields.length);
    const coverage=validateCoverage(master,map);
    const mapping=new Map((map.fields||[]).map(f=>[Number(f.id),f]));
    grid.innerHTML=fields.map((f,i)=>{
      const mf=mapping.get(Number(f.id));
      const domains=mf&&Array.isArray(mf.domains)?mf.domains:[];
      return `<article class="leitfeldCard"><div class="num">${String(f.id??i+1).padStart(2,'0')} · LEITFELD</div><h3>${esc(f.name)}</h3><p>${esc(f.summary)}</p><div class="leitfeldMeta"><span>${esc(f.track||'Programm')}</span><span>${domains.length} Analysebereiche</span></div><details class="leitfeldDomains"><summary>Abdeckung anzeigen</summary><ul>${domains.map(d=>`<li>${esc(d)}</li>`).join('')}</ul></details></article>`
    }).join('');
    if(count){
      count.classList.toggle('coverageOk',coverage.ok);
      count.classList.toggle('coverageWarn',!coverage.ok);
      count.textContent=coverage.ok
        ? `12 von 12 Leitfeldern sichtbar · 41 von 41 Analysebereichen eindeutig zugeordnet · 8 verbindliche WERK-Säulen separat`
        : `Abdeckungswarnung: ${coverage.missing.length} fehlend · ${coverage.unknown.length} unbekannt · ${coverage.duplicates.length} doppelt`;
    }
  }catch(e){
    console.error('WERK Leitfelder',e);
    grid.innerHTML='<div class="notice">Die Leitfelder oder ihre Analyseabdeckung konnten nicht vollständig geladen werden. Bitte Prüffassung neu laden.</div>';
    if(count){count.classList.add('coverageWarn');count.textContent='Leitfelder-Abdeckung derzeit nicht verifiziert.'}
  }
}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',renderPolicyFields);else renderPolicyFields();
})();
