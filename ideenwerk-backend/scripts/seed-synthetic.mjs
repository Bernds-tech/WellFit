import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const count = Math.max(1, Number(process.env.SYNTHETIC_COUNT || process.argv[2] || 100000));
const batchSize = Math.max(100, Number(process.env.SYNTHETIC_BATCH || 1000));
const runId = String(process.env.SYNTHETIC_RUN_ID || `R${Date.now().toString(36).toUpperCase()}`);

const regions = ['Österreich','Wien','Niederösterreich','Oberösterreich','Steiermark','Tirol','Salzburg','Kärnten','Vorarlberg','Burgenland'];
const families = [
  { topic:'Verwaltung', problem:'Behördenwege dauern zu lange und dieselben Daten müssen mehrfach angegeben werden.', solutions:[
    'Ein gemeinsames digitales Genehmigungsportal mit Statusanzeige einführen.',
    'Verbindliche Bearbeitungsfristen und automatische Zuständigkeitsweiterleitung einführen.',
    'Once-Only-Datenprinzip zwischen Behörden ausbauen.'
  ]},
  { topic:'Soziales & Pensionen', problem:'Das Pensionssystem soll langfristig finanzierbar und generationengerecht sein.', solutions:[
    'Das tatsächliche Pensionsantrittsalter schrittweise erhöhen und Ausnahmen transparent begründen.',
    'Anreize für freiwillig längeres Arbeiten deutlich ausbauen.',
    'Ein flexibles Pensionsfenster mit versicherungsmathematischen Zu- und Abschlägen schaffen.'
  ]},
  { topic:'Gesundheit & Pflege', problem:'Pflege zuhause ist für viele Familien organisatorisch und finanziell schwierig.', solutions:[
    'Mobile Pflegedienste regional ausbauen und Leistungen bündeln.',
    'Pflegende Angehörige mit klaren Entlastungs- und Vertretungsangeboten unterstützen.',
    'Gemeinsame digitale Pflegekoordination zwischen Land, Gemeinden und Trägern schaffen.'
  ]},
  { topic:'Finanzen & Schulden', problem:'Österreich braucht dauerhaft ausgeglichene Haushalte und einen glaubwürdigen Schuldenabbau.', solutions:[
    'Budgetüberschüsse vorrangig zur Nettotilgung fälliger Schulden verwenden.',
    'Einen transparenten Schuldentilgungsfonds mit jährlichem Bericht einführen.',
    'Jede neue dauerhafte Ausgabe an eine Gegenfinanzierung und Wirkungsprüfung binden.'
  ]},
  { topic:'Bildung', problem:'Schülerinnen und Schüler brauchen bessere Unterstützung bei unterschiedlichen Lernständen.', solutions:[
    'Mehr standardisierte Lernstandsdiagnostik mit gezielter Förderung einsetzen.',
    'Schulen mehr organisatorische Autonomie bei transparenten Qualitätszielen geben.',
    'Verwaltungsaufwand für Lehrkräfte reduzieren und Unterstützungsdienste bündeln.'
  ]},
  { topic:'Verkehr & Infrastruktur', problem:'Regionale Mobilität soll verlässlich sein, ohne überall dieselbe Lösung vorzuschreiben.', solutions:[
    'Regionale Taktknoten und bedarfsorientierte Busangebote ausbauen.',
    'Park-and-Ride mit verlässlichen Anschlüssen stärker regional planen.',
    'Gemeinden und Länder sollen Mobilitätsbudgets stärker nach messbarer Nutzung steuern.'
  ]},
  { topic:'Migration & Integration', problem:'Integration und Aufnahme müssen rechtlich klar, finanzierbar und organisatorisch bewältigbar sein.', solutions:[
    'Bundesweite Mindestregeln mit klarer regionaler Verantwortlichkeit für zusätzliche freiwillige Leistungen verbinden.',
    'Integrationsleistungen stärker an Sprache, Arbeit und konkrete regionale Kapazitäten koppeln.',
    'Kosten und Zuständigkeiten zwischen Bund, Ländern und Gemeinden transparent ausweisen.'
  ]},
  { topic:'Umwelt & Energie', problem:'Energieversorgung soll leistbar, sicher und zunehmend klimaverträglich sein.', solutions:[
    'Netzausbau und Speicherplanung schneller genehmigen und regional koordinieren.',
    'Förderungen stärker an tatsächliche CO2- und Netzwirkung koppeln.',
    'Energieeffizienzprogramme regelmäßig auf Kosten je eingesparter Einheit prüfen.'
  ]}
];

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(0x5745524B);
const prefixes = ['Mein Vorschlag:','Ich würde ändern:','Aus meiner Sicht sollte gelten:','Eine Idee wäre:','Warum machen wir nicht Folgendes:'];
const suffixes = ['Das sollte transparent evaluiert werden.','Bitte vorher Kosten und Zuständigkeit prüfen.','Die Wirkung sollte nach einigen Jahren überprüft werden.','Dabei dürfen bestehende bessere Lösungen nicht verschlechtert werden.',''];

function synthetic(i) {
  const family = families[Math.floor(rnd()*families.length)];
  const solution = family.solutions[Math.floor(rnd()*family.solutions.length)];
  const region = regions[Math.floor(rnd()*regions.length)];
  const duplicateBand = i % 10;
  const prefix = duplicateBand < 3 ? prefixes[0] : prefixes[Math.floor(rnd()*prefixes.length)];
  const suffix = duplicateBand < 2 ? suffixes[0] : suffixes[Math.floor(rnd()*suffixes.length)];
  const text = `${prefix} ${family.problem} ${solution} ${suffix}`.replace(/\s+/g,' ').trim();
  return {
    publicId: `LOAD-${runId}-${String(i+1).padStart(7,'0')}`,
    idempotency: `load:${runId}:${i+1}`,
    text,
    region,
    topic: family.topic
  };
}

async function insertBatch(rows) {
  const publicIds = rows.map(x=>x.publicId);
  const keys = rows.map(x=>x.idempotency);
  const texts = rows.map(x=>x.text);
  const regionValues = rows.map(x=>x.region);
  const topics = rows.map(x=>x.topic);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(
      `INSERT INTO submissions(public_id,idempotency_key,original_text,region,topic,current_status)
       SELECT * FROM unnest($1::text[],$2::text[],$3::text[],$4::text[],$5::text[]) AS t(public_id,idempotency_key,original_text,region,topic)
       ON CONFLICT(idempotency_key) DO NOTHING
       RETURNING public_id`,
      [publicIds,keys,texts,regionValues,topics]
    );
    const ids = inserted.rows.map(x=>x.public_id);
    if (ids.length) {
      await client.query(
        `INSERT INTO processing_jobs(job_type,subject_type,subject_id,payload)
         SELECT 'pii_scan','submission',x,'{"source":"synthetic_load"}'::jsonb FROM unnest($1::text[]) x`,
        [ids]
      );
    }
    await client.query('COMMIT');
    return ids.length;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}

const started = Date.now();
let insertedTotal = 0;
for (let offset=0; offset<count; offset+=batchSize) {
  const size = Math.min(batchSize,count-offset);
  const rows = Array.from({length:size},(_,j)=>synthetic(offset+j));
  insertedTotal += await insertBatch(rows);
  if ((offset+size)%10000===0 || offset+size===count) {
    console.log(JSON.stringify({ run_id:runId, generated:offset+size, inserted:insertedTotal, elapsed_s:(Date.now()-started)/1000 }));
  }
}
console.log(JSON.stringify({ ok:true, run_id:runId, requested:count, inserted:insertedTotal, elapsed_s:(Date.now()-started)/1000 }));
await pool.end();
