# WERK IDEENWERK Backend

Status: **Scaffold / nicht produktiv betrieben**

Dieses Verzeichnis übersetzt die öffentliche IDEENWERK-Governance in einen technischen Backend-Ausgangspunkt.

## Kernprinzipien

- Idee einreichen **ohne Login**.
- Statuszugang über einen unguessbaren Token; serverseitig nur SHA-256-Hash.
- Anonyme Einreichung, verifizierte Unterstützung und WERK VOTE sind drei getrennte Vertrauensstufen.
- KI-/Semantikverarbeitung läuft asynchron. Das Absenden einer Idee darf bei Provider-Ausfall nicht fehlschlagen.
- Originaleinreichungen bleiben erhalten, auch wenn sie einem Cluster zugeordnet werden.
- Keine geheime KI-Gesamtnote.
- Öffentliche Aufmerksamkeitssignale und fachliche Qualitätsgates bleiben getrennt.
- Sehr ähnliche Copy-Paste-/Near-Duplicate-Texte können zuerst mit `pg_trgm` vorgebündelt werden.
- Die zweite Clusterstufe trennt ausdrücklich **gleiches Problem** von **gleicher Lösung**. Gleiches Problem mit anderer Lösung bleibt als Variante bestehen.
- Der deterministische Fallback darf keine semantische Auto-Verschmelzung auslösen.

## Schnellstart mit Docker

```bash
docker compose up --build
```

Danach:

- API: `http://localhost:8787`
- PostgreSQL lokal: Port `54329`
- Worker läuft separat im Compose-Stack.

Smoke-Test in einem zweiten Terminal:

```bash
npm run smoke
```

Beenden:

```bash
docker compose down
```

Für einen vollständigen Reset der lokalen Testdaten:

```bash
docker compose down -v
```

## Start ohne Docker

1. PostgreSQL bereitstellen.
2. SQL-Migrationen `001_init.sql` bis `004_semantic_features.sql` in Reihenfolge ausführen.
3. `DATABASE_URL` setzen.
4. `npm install`
5. API mit `npm start` starten.
6. Worker separat mit `npm run worker` starten.

## Tests

```bash
npm test
```

Die Unit-Tests prüfen Statusmaschine, Triage-Regeln und die kritische Clusterentscheidung: echtes Duplikat, gleiche Problemlage mit anderer Lösung, Grenzfall und getrennte Idee. Unter `.github/workflows/ideenwerk-backend-check.yml` liegt zusätzlich eine CI-Prüfung für Node-Syntax und Unit-Tests. Connector-erzeugte Commits starten GitHub Actions nicht zuverlässig automatisch; beim nächsten normalen Push greift der Workflow.

## 100.000-Einreichungen-Lasttest

Der große Lasttest umgeht **nicht** den öffentlichen API-Schutz. Er erzeugt intern klar markierte synthetische Testeinreichungen direkt in PostgreSQL und legt danach dieselben Worker-Jobs an, die auch echte Einreichungen durchlaufen.

```bash
# Beispiel: 100.000 synthetische Einreichungen erzeugen
SYNTHETIC_COUNT=100000 SYNTHETIC_RUN_ID=R100K npm run load:seed

# Queue und Durchsatz beobachten
SYNTHETIC_RUN_ID=R100K npm run load:benchmark

# Testdaten danach entfernen
SYNTHETIC_RUN_ID=R100K npm run load:cleanup
```

Mehrere Worker können lokal parallel gestartet werden, z. B.:

```bash
docker compose up --build --scale worker=4
```

Gemessen werden unter anderem Zahl der Einreichungen, Queue-Zustände, öffentliche Statuszustände und abgearbeitete Jobs pro Sekunde. Konkrete Performancewerte gelten erst nach einem real ausgeführten Benchmark auf einer definierten Infrastruktur.

## Clusterpipeline

1. **PII-Vorprüfung** – personenbezogene Kontaktdaten führen in einen Privacy-Hold.
2. **konservative Strukturierung** – funktioniert auch ohne externen Semantikprovider.
3. **Near-Duplicate-Suche** – `pg_trgm` für Copy-Paste-/sehr nahe Textvarianten.
4. **semantische Merkmale** – providerneutraler Adapter erzeugt Problem- und Lösungssignaturen.
5. **Relationsentscheidung** – `same_problem_same_solution`, `same_problem_different_solution`, `possible_overlap` oder `separate`.
6. **Varianten-Schutz** – gleiche Problemlage + andere Lösung wird menschlich geprüft und nicht verschmolzen.
7. **kein relevanter Treffer** – Idee geht automatisch weiter in den fachlichen Vorcheck.

Der externe semantische Dienst ist bewusst austauschbar. `SEMANTIC_PROVIDER=fallback` bleibt die sichere Standardeinstellung. Später kann ein JSON-kompatibler Dienst über `SEMANTIC_PROVIDER=http_json` und `SEMANTIC_ENDPOINT` angeschlossen werden.

## Bereits scaffolded

- `POST /api/ideenwerk/v1/submissions` – anonyme/pseudonyme Einreichung mit Rate-Limit-Grundlage.
- `GET /api/ideenwerk/v1/submissions/:publicId` – nur moderierte öffentliche Fassung.
- `GET /api/ideenwerk/v1/status/:publicId` – privater Statuszugang mit Bearer-Token.
- `POST /api/ideenwerk/v1/moderation/report` – öffentliche Meldung.
- PostgreSQL-Schema für Einreichungen, Statuszugang, strukturierte Vorschläge, semantische Merkmale, Clusterkandidaten, Cluster, Supports, Reviews, Audit Events, Abuse-Signale und Moderationsmeldungen.
- persistente Job-Queue mit Retry-/Dead-Job-Grundlage.
- Intake-Kette: `received -> PII scan -> structure -> lexical duplicate -> semantic review -> precheck/review`.
- konservative Strukturierung auch ohne KI-Provider.
- Near-Duplicate-Pflichtstufe über `pg_trgm` mit hohem Ähnlichkeitsschwellwert.
- providerneutrale zweite Clusterstufe mit Problem-/Lösungs-Trennung.
- Audit-Ereignisse für Statusänderungen und Clusterkandidaten.
- Docker-Compose-Stack aus PostgreSQL, API und Worker.
- Smoke-Test für No-Login-Einreichung und privaten Statusabruf.
- reproduzierbarer synthetischer 100k-Seed, Queue-Benchmark und Cleanup.

## Noch vor Produktivbetrieb zwingend

- Semantik-/Embeddingprovider mit echtem Evaluationsdatensatz anbinden und vergleichen.
- False-Merge-/False-Split-Rate messen; sensible Themen besonders absichern.
- menschlichen Clusterreview und Appeal-Workflow als Operator-Oberfläche implementieren.
- Progressive Bot-Challenge/WAF/verteilter Rate-Limit-Store für Multi-Instance-Betrieb ergänzen.
- Datenschutz/DSGVO, Löschung, Auskunft, Aufbewahrungsfristen und Moderationsprozess rechtlich freigeben.
- Token-Threat-Model und Penetrationstest.
- CORS, Security Header, Reverse Proxy/WAF und Secret Management.
- PII-Redaktion und öffentlichen Freigabe-Workflow vervollständigen.
- Qualitätspfad für wenig populäre Einzelideen messen.
- Regionen-Bias und Kampagnen-/Astroturfing-Erkennung evaluieren.
- Backup/Restore und Audit-Export testen.
- Verifizierte Unterstützung technisch von anonymer Reaktion und späterer geheimer Stimme trennen.
- 100k- und Spike-Lasttest tatsächlich auf definierter Testinfrastruktur ausführen und Ergebnisse dokumentieren.

## Wichtige Abgrenzung

Dieser Scaffold bedeutet **nicht**, dass IDEENWERK bereits serverseitig läuft. Die aktuelle V63-Website speichert Demo-Ideen weiterhin nur lokal im Browser. Das Backend wird erst dann als produktiv markiert, wenn Datenbank, API, Worker, Moderation, Datenschutz, Missbrauchsschutz und Runtime-Tests tatsächlich betrieben und abgenommen sind.
