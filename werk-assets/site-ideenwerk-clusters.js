(()=>{
const API='https://jwomaoxefgnhsgiebaqy.supabase.co/functions/v1/werk-ideenwerk-api';
const HIDDEN_STATUSES=new Set(['quarantine','removed']);
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const state={cursor:null,topic:'',region:'',loading:false,seq:0,detailSeq:0};

function optionValues(id){
  const el=document.getElementById(id);
  if(!el)return [];
  return [...el.options].map(o=>String(o.value||o.textContent||'').trim()).filter(Boolean);
}

function statusLabel(value){
  const labels={
    cluster_review:'in Prüfung',
    approved:'geprüft',
    open:'offen',
    active:'aktiv',
    implemented_elsewhere:'bereits anderswo umgesetzt',
    not_pursued:'nicht weiterverfolgt'
  };
  return labels[value]||value||'Status offen';
}

function laneLabel(value){
  return value==='FAST'?'FAST':value==='DEEP'?'DEEP':value==='STANDARD'?'STANDARD':'Prüftiefe offen';
}

async function fetchJSON(url){
  const r=await fetch(url,{cache:'no-store'});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){
    const e=new Error(data.message||data.code||`HTTP ${r.status}`);
    e.status=r.status;e.code=data.code;throw e;
  }
  return data;
}

function buildQuery(cursor=null){
  const q=new URLSearchParams({limit:'8'});
  if(state.topic)q.set('topic',state.topic);
  if(state.region)q.set('region',state.region);
  if(cursor)q.set('cursor',cursor);
  return `${API}/clusters?${q.toString()}`;
}

function detailPanelId(clusterId){
  return `iwClusterDetail-${String(clusterId||'').replace(/[^A-Za-z0-9_-]/g,'')}`;
}

function clusterCard(c){
  const clusterId=String(c.cluster_id||'');
  const meta=[c.region_scope,statusLabel(c.review_status),laneLabel(c.process_lane_suggestion)].filter(Boolean).map(esc).join(' · ');
  const count=Number.isFinite(Number(c.submission_count))?Number(c.submission_count):0;
  const updated=c.updated_at?new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(c.updated_at)):'–';
  const panelId=detailPanelId(clusterId);
  return `<article class="iwCluster" data-live-cluster="${esc(clusterId)}"><span class="iwBadge">${esc(c.topic||'Thema offen')}</span><h4>${esc(c.title||'Unbenannter Themenraum')}</h4><small>${meta}</small><div class="iwHint">${count} zugeordnete Einreichung${count===1?'':'en'} · aktualisiert ${esc(updated)}</div><div class="iwActions"><button class="iwBtn" type="button" data-cluster-detail="${esc(clusterId)}" aria-expanded="false" aria-controls="${esc(panelId)}">Details & Lösungsvarianten</button></div><div id="${esc(panelId)}" data-cluster-detail-panel="${esc(clusterId)}" hidden></div></article>`;
}

function variantCard(v){
  const summary=String(v?.summary||'').trim();
  const updated=v?.updated_at?new Intl.DateTimeFormat('de-AT',{dateStyle:'medium'}).format(new Date(v.updated_at)):'–';
  return `<div class="iwNotice"><strong>${esc(v?.title||'Unbenannte Lösungsvariante')}</strong>${summary?`<div>${esc(summary)}</div>`:''}<div class="iwHint">${esc(statusLabel(v?.review_status))} · aktualisiert ${esc(updated)}</div></div>`;
}

function renderClusterDetail(data){
  const cluster=data?.cluster||{};
  const variants=(Array.isArray(data?.variants)?data.variants:[]).filter(v=>!HIDDEN_STATUSES.has(String(v?.review_status||'')));
  const laneReason=String(cluster.process_lane_reason||'').trim();
  const variantsHtml=variants.length
    ? variants.map(variantCard).join('')
    : '<div class="iwNotice">Für diesen öffentlichen Problemraum ist derzeit noch keine öffentliche Lösungsvariante ausgewiesen.</div>';
  return `<div class="iwNotice"><strong>Problemraum · ${esc(cluster.title||'Details')}</strong><div class="iwHint">${esc(cluster.region_scope||'Region offen')} · ${esc(statusLabel(cluster.review_status))} · ${esc(laneLabel(cluster.process_lane_suggestion))}</div>${laneReason?`<div class="iwHint">Prüfpfad: ${esc(laneReason)}</div>`:''}<div class="iwHint">Die Gesamtzahl der Einreichungen beschreibt den Problemraum und ist keine Zustimmung zu einer bestimmten Lösungsvariante.</div></div><div class="iwHint"><strong>Öffentliche Lösungsvarianten</strong></div>${variantsHtml}`;
}

function setBusy(button,busy){
  if(!button)return;
  button.disabled=busy;
  button.setAttribute('aria-busy',busy?'true':'false');
}

async function toggleClusterDetail(button){
  const clusterId=String(button?.dataset?.clusterDetail||'');
  const panel=clusterId?document.querySelector(`[data-cluster-detail-panel="${clusterId}"]`):null;
  if(!panel)return;
  const expanded=button.getAttribute('aria-expanded')==='true';
  if(expanded){
    button.setAttribute('aria-expanded','false');
    button.textContent='Details & Lösungsvarianten';
    panel.hidden=true;
    return;
  }

  const requestId=String(++state.detailSeq);
  panel.dataset.requestId=requestId;
  panel.hidden=false;
  panel.innerHTML='<div class="iwNotice">Details und öffentliche Lösungsvarianten werden geladen …</div>';
  button.setAttribute('aria-expanded','true');
  button.textContent='Details schließen';
  setBusy(button,true);
  try{
    const data=await fetchJSON(`${API}/clusters/${encodeURIComponent(clusterId)}`);
    if(!panel.isConnected||panel.dataset.requestId!==requestId)return;
    panel.innerHTML=renderClusterDetail(data);
  }catch(e){
    if(!panel.isConnected||panel.dataset.requestId!==requestId)return;
    panel.innerHTML=e?.status===404
      ? '<div class="iwNotice">Dieser Themenraum ist nicht mehr öffentlich verfügbar. Verdeckte Prüf- und Quarantänefälle werden nicht angezeigt.</div>'
      : `<div class="iwNotice">Die Details konnten gerade nicht geladen werden${e?.code?` · ${esc(e.code)}`:''}.</div>`;
    console.error('WERK IDEENWERK cluster detail',e);
  }finally{
    if(panel.isConnected&&panel.dataset.requestId===requestId)setBusy(button,false);
  }
}

async function loadClusters(reset){
  const grid=document.getElementById('iwPublicClusterGrid');
  const more=document.getElementById('iwPublicClusterMore');
  const note=document.getElementById('iwPublicClusterNote');
  if(!grid||!more||!note)return;
  const seq=++state.seq;
  state.loading=true;
  setBusy(more,true);
  if(reset){
    state.cursor=null;
    grid.innerHTML='<div class="iwNotice">Öffentliche Themenräume werden aus WERK-Staging geladen …</div>';
  }
  try{
    const data=await fetchJSON(buildQuery(reset?null:state.cursor));
    if(seq!==state.seq)return;
    const rows=Array.isArray(data.clusters)?data.clusters:[];
    const html=rows.map(clusterCard).join('');
    if(reset){
      grid.innerHTML=html||'<div class="iwNotice">Noch keine öffentlichen Themenräume im WERK-Staging. Sobald ein Cluster öffentlich prüfbar ist, erscheint er hier.</div>';
    }else if(html){
      grid.insertAdjacentHTML('beforeend',html);
    }
    state.cursor=typeof data.next_cursor==='string'&&data.next_cursor?data.next_cursor:null;
    more.hidden=!state.cursor;
    note.textContent=rows.length
      ? 'Live aus dem öffentlichen WERK-Staging-Clusterregister. Verdeckte Prüf- und Quarantänefälle werden nicht angezeigt.'
      : 'Live-Register abgefragt. Derzeit gibt es für diese Filter keinen öffentlichen Themenraum.';
  }catch(e){
    if(seq!==state.seq)return;
    if(reset)grid.innerHTML='<div class="iwNotice">Die öffentlichen Themenräume konnten gerade nicht aus WERK-Staging geladen werden. Es werden keine Beispieldaten als Live-Daten ausgegeben.</div>';
    note.textContent=`Live-Abruf fehlgeschlagen${e?.code?` · ${e.code}`:''}.`;
    state.cursor=null;
    more.hidden=true;
    console.error('WERK IDEENWERK public clusters',e);
  }finally{
    if(seq===state.seq){state.loading=false;setBusy(more,false)}
  }
}

function makeSelect(id,label,values){
  const wrap=document.createElement('div');
  wrap.className='iwField';
  const lab=document.createElement('label');lab.htmlFor=id;lab.textContent=label;
  const select=document.createElement('select');select.id=id;
  const all=document.createElement('option');all.value='';all.textContent='alle';select.appendChild(all);
  [...new Set(values)].forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;select.appendChild(o)});
  wrap.append(lab,select);
  return {wrap,select};
}

function mount(){
  const host=document.querySelector('.iwClusters');
  if(!host||host.dataset.liveClustersMounted==='1')return false;
  const marker=[...host.querySelectorAll('.ey')].find(x=>/Öffentliche Themenräume/i.test(x.textContent||''));
  const grid=marker?.nextElementSibling?.classList?.contains('iwClusterGrid')?marker.nextElementSibling:host.querySelector('.iwClusterGrid');
  if(!marker||!grid)return false;
  host.dataset.liveClustersMounted='1';
  marker.textContent='Öffentliche Themenräume · live aus WERK-Staging';
  grid.id='iwPublicClusterGrid';
  grid.innerHTML='<div class="iwNotice">Öffentliche Themenräume werden aus WERK-Staging geladen …</div>';

  const fields=document.createElement('div');fields.className='iwFields';fields.id='iwPublicClusterFilters';
  const topic=makeSelect('iwPublicClusterTopic','Thema',optionValues('iwTopic'));
  const region=makeSelect('iwPublicClusterRegion','Region',optionValues('iwRegion'));
  fields.append(topic.wrap,region.wrap);
  marker.insertAdjacentElement('afterend',fields);

  const actions=document.createElement('div');actions.className='iwActions';
  const refresh=document.createElement('button');refresh.className='iwBtn';refresh.type='button';refresh.id='iwPublicClusterRefresh';refresh.textContent='Aktualisieren';
  const more=document.createElement('button');more.className='iwBtn';more.type='button';more.id='iwPublicClusterMore';more.textContent='Weitere laden';more.hidden=true;
  actions.append(refresh,more);
  grid.insertAdjacentElement('afterend',actions);
  const note=document.createElement('div');note.className='iwHint';note.id='iwPublicClusterNote';note.textContent='Live-Register wird geladen.';
  actions.insertAdjacentElement('afterend',note);

  grid.addEventListener('click',event=>{
    const target=event.target;
    const button=target instanceof Element?target.closest('[data-cluster-detail]'):null;
    if(button instanceof HTMLButtonElement)toggleClusterDetail(button);
  });
  topic.select.addEventListener('change',()=>{state.topic=topic.select.value;loadClusters(true)});
  region.select.addEventListener('change',()=>{state.region=region.select.value;loadClusters(true)});
  refresh.addEventListener('click',()=>loadClusters(true));
  more.addEventListener('click',()=>state.cursor&&loadClusters(false));
  loadClusters(true);
  return true;
}

if(!mount()){
  const observer=new MutationObserver(()=>{if(mount())observer.disconnect()});
  observer.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>observer.disconnect(),15000);
}
})();
