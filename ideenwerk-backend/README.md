# WERK IDEENWERK Backend

Status: **Scaffold / nicht produktiv betrieben**

Dieses Verzeichnis übersetzt die öffentliche IDEENWERK-Governance in einen technischen Backend-Ausgangspunkt.

## Kernprinzipien

- Idee einreichen **ohne Login**.
- Statuszugang über einen unguessbaren Token; serverseitig nur SHA-256-Hash.
- Anonyme Einreichung, verifizierte Unterstützung und WERK VOTE sind drei getrennte Vertrauensstufen.
- KI-Verarbeitung läuft asynchron. Das Absenden einer Idee darf bei KI-Ausfall nicht fehlschlagen.
- Originaleinreichungen bleiben erhalten, auch wenn sie einem Cluster zugeordnet werden.
- Keine geheime KI-Gesamtnote.
- Öffentliche Aufmerksamkeitssignale und fachliche Qualitätsgates bleiben getrennt.
- Sehr ähnliche Copy-Paste-/Near-Duplicate-Texte können vor einer späteren semantischen KI-Prüfung mit `pg_trgm` vorgebündelt werden.

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
2. `sql/001_init.sql`, `sql/002_jobs.sql` und `sql/003_similarity.sql` ausführen.
3. `DATABASE_URL` setzen.
4. `npm install`
5. API mit `npm start` starten.
6. Worker separat mit `npm run worker` starten.

## Tests

```bash
npm test
```

Die Unit-Tests prüfen derzeit die Statusmaschine und die deterministische Queue-/Triage-Logik. Zusätzlich liegt unter `.github/workflows/ideenwerk-backend-check.yml` eine CI-Prüfung für Node-Syntax und Unit-Tests. Connector-erzeugte Commits starten GitHub Actions nicht zuverlässig automatisch; beim nächsten normalen Push greift der Workflow.

## Bereits scaffolded

- `POST /api/ideenwerk/v1/submissions` – anonyme/pseudonyme Einreichung mit Rate-Limit-Grundlage.
- `GET /api/ideenwerk/v1/submissions/:publicId` – nur moderierte öffentliche Fassung.
- `GET /api/ideenwerk/v1/status/:publicId` – privater Statuszugang mit Bearer-Token.
- `POST /api/ideenwerk/v1/moderation/report` – öffentliche Meldung.
- PostgreSQL-Schema für Einreichungen, Statuszugang, strukturierte Vorschläge, Cluster, Supports, Reviews, Audit Events, Abuse-Signale und Moderationsmeldungen.
- persistente Job-Queue mit Retry-/Dead-Job-Grundlage.
- Intake-Kette: `received -> PII scan -> structure_submission`.
- konservative Strukturierung auch ohne KI-Provider.
- Near-Duplicate-Pflichtstufe über `pg_trgm` mit hohem Ähnlichkeitsschwellwert.
- Audit-Ereignisse für Statusänderungen und Clusterzuordnung.
- Docker-Compose-Stack aus PostgreSQL, API und Worker.
- Smoke-Test für No-Login-Einreichung und privaten Statusabruf.

## Noch vor Produktivbetrieb zwingend

- Semantischen Embedding-/Clusterprovider implementieren und evaluieren.
- False-Merge-/False-Split-Rate messen; sensible Themen besonders absichern.
- Progressive Bot-Challenge/WAF/verteilter Rate-Limit-Store für Multi-Instance-Betrieb ergänzen.
- Datenschutz/DSGVO, Löschung, Auskunft, Aufbewahrungsfristen und Moderationsprozess rechtlich freigeben.
- Token-Threat-Model und Penetrationstest.
- CORS, Security Header, Reverse Proxy/WAF und Secret Management.
- PII-Redaktion und öffentlichen Freigabe-Workflow vervollständigen.
- Qualitätspfad für wenig populäre Einzelideen messen.
- Regionen-Bias und Kampagnen-/Astroturfing-Erkennung evaluieren.
- Backup/Restore und Audit-Export testen.
- Verifizierte Unterstützung technisch von anonymer Reaktion und späterer geheimer Stimme trennen.

## Wichtige Abgrenzung

Dieser Scaffold bedeutet **nicht**, dass IDEENWERK bereits serverseitig läuft. Die aktuelle V63-Website speichert Demo-Ideen weiterhin nur lokal im Browser. Das Backend wird erst dann als produktiv markiert, wenn Datenbank, API, Worker, Moderation, Datenschutz, Missbrauchsschutz und Runtime-Tests tatsächlich betrieben und abgenommen sind.
