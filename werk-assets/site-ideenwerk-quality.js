(()=>{
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
function resultText(run){
  const r=run.result||{};
  if(run.type==='Node Unit Tests') return `${r.passed??0}/${r.tests??0} bestanden · ${r.failed??0} fehlgeschlagen`;
  if(run.type==='Cluster-Goldset') return `${r.correct??0}/${r.pairs??0} korrekt · Genauigkeit ${Math.round(Number(r.accuracy||0)*1000)/10}% · False Merge ${r.false_merge??'–'} · Variant Loss ${r.variant_loss??'–'} · False Split ${r.false_split??'–'}`;
  return Object.entries(r).map(([k,v])=>`${k}: ${v}`).join(' · ');
}
async function load(){try{
  if(document.getElementById('iwQuality'))return;
  const r=await fetch('./werk-data/ideenwerk-quality.json?v=20260903-v17',{cache:'no-store'});
  if(!r.ok)throw new Error('ideenwerk-quality '+r.status);
  const d=await r.json();
  const host=document.querySelector('.page[data-page="ideenwerk"] .sec');
  if(!host)return;
  const measured=Array.isArray(d.measured_runs)?d.measured_runs:[];
  const sec=document.createElement('section');sec.id='iwQuality';sec.className='iwQuality';
  sec.innerHTML=`<div class="head"><div><div class="ey">Qualität & Skalierung</div><h2>${esc(d.title)}</h2></div><p>${esc(d.rule)}</p></div>
  ${measured.length?`<div class="ey" style="margin-bottom:8px">Tatsächlich ausgeführte Tests</div><div class="iwQualityTests">${measured.map(t=>`<article class="iwQTest"><span class="iwQStatus">ausgeführt · ${esc(t.executed_at)}</span><h3>${esc(t.type)}</h3><p><b>${esc(resultText(t))}</b></p><p>${esc(t.scope)}</p><small><b>Umgebung:</b> ${esc(t.environment)}<br><b>Einschränkung:</b> ${esc(t.limitation)}</small></article>`).join('')}</div><div style="height:18px"></div>`:''}
  <div class="ey" style="margin-bottom:8px">Weitere Prüfungen</div><div class="iwQualityTests">${d.prepared_tests.map(t=>`<article class="iwQTest"><span class="iwQStatus">${esc(t.status)}</span><h3>${esc(t.name)}</h3><p>${esc(t.scope)}</p></article>`).join('')}</div>
  <div style="height:18px"></div><div class="table"><table><thead><tr><th>Messgröße</th><th>Warum wichtig?</th><th>Priorität</th><th>Aktueller Wert</th></tr></thead><tbody>${d.metrics.map(m=>`<tr><td><b>${esc(m.label)}</b><br><small>${esc(m.publication)}</small></td><td>${esc(m.meaning)}</td><td><span class="iwPriority ${m.priority==='kritisch'?'critical':''}">${esc(m.priority)}</span></td><td><span class="iwNotMeasured">${esc(m.current)}</span></td></tr>`).join('')}</tbody></table></div>
  <div class="iwQGates"><div class="ey">Freigabegates</div><h3>Keine Qualitätsbehauptung ohne Messung.</h3><ul>${d.release_gates.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`;
  host.appendChild(sec);
}catch(e){console.error('IDEENWERK quality',e)}}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',load);else load();
})();
