(()=>{
const STATUS={
received:{label:'Eingelangt',pipeline:'Eingelangt',next:'Nächster Schritt: automatische Strukturierung und Datenschutzprüfung.'},
privacy_hold:{label:'Datenschutzprüfung',pipeline:'Eingelangt',next:'Nächster Schritt: personenbezogene Daten prüfen bzw. bereinigen; danach kann die fachliche Verarbeitung weiterlaufen.'},
structured:{label:'Strukturiert',pipeline:'Strukturiert',next:'Nächster Schritt: ähnliche Einreichungen und mögliche Themencluster prüfen.'},
clarification:{label:'Rückfrage offen',pipeline:'Strukturiert',next:'Nächster Schritt: offene Rückfrage klären; erst danach wird die fachliche Verarbeitung fortgesetzt.'},
cluster_review:{label:'Clusterprüfung',pipeline:'Clusterprüfung',next:'Nächster Schritt: Ähnlichkeiten nachvollziehbar bestätigen oder verwerfen.'},
clustered:{label:'Themencluster',pipeline:'Clusterprüfung',next:'Nächster Schritt: Zuständigkeit, Recht, Kosten- und Datenbedarf im WERK-Vorcheck prüfen.'},
precheck:{label:'WERK-Vorcheck',pipeline:'WERK-Vorcheck',next:'Nächster Schritt: Prüfergebnisse vervollständigen und den passenden weiteren Prüfpfad bestimmen.'},
theme_room:{label:'Öffentlicher Themenraum',pipeline:'Öffentlicher Themenraum',next:'Nächster Schritt: Argumente, Ergänzungen und belastbare Varianten offen zusammenführen.'},
impact_review:{label:'Wirkungsprüfung',pipeline:'Wirkungsprüfung',next:'Nächster Schritt: Kosten, Finanzierung, Recht, Wirkungen und messbare Kennzahlen prüfen.'},
reform_candidate:{label:'Reformkandidat',pipeline:'Reformkandidat',next:'Nächster Schritt: fachliche Nachweise und Voraussetzungen für das Reformregister abschließen.'},
reform_register:{label:'Reformregister',pipeline:'Reformkandidat',next:'Nächster Schritt: den rechtlich und sachlich passenden Entscheidungspfad vorbereiten.'},
decision_path:{label:'Entscheidungspfad',pipeline:'Entscheidung',next:'Nächster Schritt: Entscheidung nur im dafür vorgesehenen demokratischen bzw. rechtlichen Verfahren.'},
not_pursued:{label:'Nicht weiterverfolgt',pipeline:null,next:'Der aktuelle Prüfpfad ist beendet. Begründung und vorhandene Prüfspuren bleiben nachvollziehbar.'},
implemented_elsewhere:{label:'Bereits anderweitig umgesetzt',pipeline:null,next:'Der Vorschlag überschneidet sich mit einer bestehenden Umsetzung; die Überschneidung bleibt nachvollziehbar.'},
quarantine:{label:'Moderationsprüfung',pipeline:null,next:'Nächster Schritt: Moderations- bzw. Missbrauchsprüfung. Es findet keine politische Bewertung statt.'},
removed:{label:'Entfernt',pipeline:null,next:'Der laufende Pfad ist beendet; zulässige Prüf- und Auditspuren bleiben nach den geltenden Regeln erhalten.'}
};
function enhance(box){
  if(!box)return;
  const cells=[...box.querySelectorAll('.iwStatusCell')];
  const statusCell=cells.find(c=>c.querySelector('span')?.textContent.trim()==='Status');
  const value=statusCell?.querySelector('b');
  if(!value)return;
  const raw=value.dataset.rawStatus||value.textContent.trim();
  const view=STATUS[raw];
  if(!view)return;
  value.dataset.rawStatus=raw;
  if(value.textContent!==view.label)value.textContent=view.label;
  const pipes=[...box.querySelectorAll('.iwPipeline .iwPipe')];
  for(const pipe of pipes){
    const active=Boolean(view.pipeline)&&pipe.querySelector('b')?.textContent.trim()===view.pipeline;
    pipe.classList.toggle('active',active);
  }
  let hint=box.querySelector('[data-iw-status-next]');
  if(!hint){
    hint=document.createElement('div');
    hint.className='iwHint';
    hint.dataset.iwStatusNext='1';
    const grid=box.querySelector('.iwStatusGrid');
    if(grid)grid.insertAdjacentElement('afterend',hint);else box.prepend(hint);
  }
  if(hint.textContent!==view.next)hint.textContent=view.next;
}
function start(){
  const root=document.getElementById('iwStatusDetail');
  if(root)enhance(root);
  const observer=new MutationObserver(()=>enhance(document.getElementById('iwStatusDetail')));
  observer.observe(document.body,{subtree:true,childList:true,characterData:true});
}
if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
