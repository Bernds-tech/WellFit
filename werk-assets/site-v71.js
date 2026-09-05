(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
async function renderPolicyFields(){
  const grid=document.getElementById('policyFieldGrid');
  const count=document.getElementById('policyFieldCount');
  if(!grid)return;
  try{
    const r=await fetch('./werk-data/core.json?v=20260905-v71',{cache:'no-store'});
    if(!r.ok)throw new Error('core.json HTTP '+r.status);
    const d=await r.json();
    const fields=Array.isArray(d.policy_fields)?d.policy_fields:[];
    if(!fields.length)throw new Error('Keine Leitfelder definiert');
    grid.innerHTML=fields.map((f,i)=>`<article class="leitfeldCard"><div class="num">${String(f.id??i+1).padStart(2,'0')} · LEITFELD</div><h3>${esc(f.name)}</h3><p>${esc(f.summary)}</p><div class="leitfeldMeta"><span>${esc(f.track||'Programm')}</span></div></article>`).join('');
    if(count)count.textContent=`${fields.length} von ${fields.length} Leitfeldern sichtbar · die 8 verbindlichen WERK-Säulen bleiben davon getrennt`;
  }catch(e){
    console.error('WERK Leitfelder',e);
    grid.innerHTML='<div class="notice">Die Leitfelder konnten nicht geladen werden. Bitte Prüffassung neu laden.</div>';
    if(count)count.textContent='Leitfelder derzeit nicht geladen.';
  }
}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',renderPolicyFields);else renderPolicyFields();
})();
