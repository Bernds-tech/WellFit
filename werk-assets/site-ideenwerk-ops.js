(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[m]));
const label=s=>({
  scaffolded:'scaffolded',
  partial:'teilweise',
  'design-ready':'Design fertig',
  'implemented-not-run':'implementiert · noch nicht ausgeführt',
  'prepared-not-run':'vorbereitet · noch nicht ausgeführt',
  'implemented-partially-measured':'implementiert · teilweise gemessen',
  'scaffolded-partially-measured':'scaffolded · teilweise gemessen',
  'db-guardrails-prepared-not-run':'DB-Guardrails vorbereitet · Runtime offen'
}[s]||s);
const retentionWindow=x=>x.default_days?`${esc(x.default_days)} Tage`:x.default_grace_days?`${esc(x.default_grace_days)} Tage Nachfrist`:x.default_rule?esc(x.default_rule):'technisch begrenzt';
async function load(){try{if(document.getElementById('iwOps'))return;const [sec,ret]=await Promise.all([
  fetch('./werk-data/ideenwerk-security.json?v=20260903-v19',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('security '+r.status);return r.json()}),
  fetch('./werk-data/ideenwerk-retention.json?v=20260903-v19',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('retention '+r.status);return r.json()})
]);const host=document.querySelector('.page[data-page="ideenwerk"] .sec');if(!host)return;const el=document.createElement('section');el.id='iwOps';el.className='iwOps';el.innerHTML=`<div class="head"><div><div class="ey">IDEENWERK · Security & Betrieb</div><h2>Vorhandener Code ist noch kein bestandener Test.</h2></div><p>${esc(sec.principle)}</p></div><div class="iwOpsGrid">${sec.gates.map(g=>`<article class="iwOpsCard"><div class="iwOpsTop"><span class="iwOpsId">${esc(g.id)}</span><span class="iwOpsStatus ${esc(g.status)}">${esc(label(g.status))}</span></div><h3>${esc(g.name)}</h3><div class="iwOpsCols"><div><b>Vorhanden</b><ul>${(g.implemented||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><div><b>Noch offen</b><ul>${(g.open||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></article>`).join('')}</div><div class="iwOpsRule"><b>Freigaberegel:</b> ${esc(sec.release_rule)}</div><div style="height:18px"></div><div class="iwOpsGrid two"><article class="iwOpsCard"><div class="ey">Aufbewahrung</div><h3>Bürgerideen verfallen nicht automatisch.</h3><p>${esc(ret.principle)}</p><ul>${ret.never_automatic_by_age.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></article><article class="iwOpsCard"><div class="ey">Technische Kurzzeitdaten</div><h3>Nur klar begrenzte Betriebsdaten werden automatisch bereinigt.</h3>${ret.automatic_cleanup.map(x=>`<div class="iwOpsRetention"><b>${esc(x.data)}</b><span>${retentionWindow(x)}</span><small>${esc(x.rule)}</small></div>`).join('')}<p class="iwOpsFoot">${esc(ret.public_rule)}</p></article></div>`;host.appendChild(el)}catch(e){console.error('IDEENWERK ops',e)}}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',load);else setTimeout(load,0);
})();
