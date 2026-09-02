# WERK IDEENWERK Backend

Status: **lokal startbarer Scaffold / nicht produktiv betrieben**

Dieses Verzeichnis übersetzt die öffentliche IDEENWERK-Governance in einen technischen Backend-Ausgangspunkt.

## Kernprinzipien

- Idee einreichen **ohne Login**.
- Statuszugang über einen unguessbaren Token; serverseitig nur SHA-256-Hash.
- Anonyme Einreichung, verifizierte Unterstützung und WERK VOTE sind drei getrennte Vertrauensstufen.
- KI-/Semantikverarbeitung läuft asynchron. Das Absenden einer Idee darf bei Provider-Ausfall nicht fehlschlagen.
- Problemcluster, Lösungsvarianten und Originalideen sind getrennte Ebenen.
- Originaleinreichungen bleiben erhalten, auch wenn sie einem Cluster zugeordnet werden.
- Keine geheime KI-Gesamtnote.
- Politisch unbequem oder WERK-kritisch ist kein Moderations-/Löschgrund.
- Betriebsreife wird getrennt nach **implementiert**, **ausgeführt/getestet**, **sicherheitsgeprüft** und **rechtlich freigegeben** bewertet.

## Schnellstart mit Docker

```bash
docker compose up --build
```

Der Stack startet:

1. PostgreSQL 17
2. versionierten Migration-Runner
3. API auf `http://localhost:8787`
4. Worker

Die Migrationen werden **nicht mehr** über `docker-entrypoint-initdb.d` verwaltet. `npm run migrate` führt alle `sql/NNN_*.sql` genau einmal aus, speichert SHA-256-Prüfsummen und sperrt parallele Migrationen per PostgreSQL Advisory Lock.

> Falls ein sehr alter lokaler Docker-Volume-Stand noch aus der früheren InitDB-Phase existiert und nie produktiv genutzt wurde, ist für den Scaffold ein sauberer Reset mit `docker compose down -v` der einfachste Weg.

## Start ohne Docker

```bash
export DATABASE_URL='postgres://user:password@localhost:5432/werk'
npm install
npm run migrate
npm start
```

Worker separat:

```bash
npm run worker
```

## Security-Rand

Scaffolded sind derzeit:

- Helmet Security Header
- CORS-Allowlist über `ALLOWED_ORIGINS`
- `Cache-Control: no-store` für IDEENWERK-API
- Authorization/Cookie-Redaction
- sanitisierte Requestlogs ohne Client-IP und ohne konkrete Public-ID im Route-Log
- `TRUST_PROXY=false` als sichere Standardeinstellung
- per-Instance Rate Limits für Einreichung, Privacy und Moderationsmeldungen

Noch offen für echten Multi-Instance-Betrieb: verteilter Rate-Limit-Store, WAF/progressive Bot-Challenge, Threat Model, Penetrationstest sowie OIDC/MFA/RBAC für Operatoren.

## No-Login-Datenschutz

Der private Status-Token ermöglicht ohne Konto:

- Statusabruf
- privaten Datenexport
- Korrektur-Anfrage
- Lösch-Anfrage
- Einschränkung
- Cluster-Appeal

Bürgerideen werden **nicht allein aufgrund ihres Alters automatisch gelöscht**. `npm run retention:run` bereinigt nur definierte technische Kurzzeitdaten. Standard ist `RETENTION_DRY_RUN=true`.

## Backup und Restore

Backup:

```bash
BACKUP_DIR=./backups npm run backup
```

Ergebnis:

- PostgreSQL Custom-Format-Dump
- separates JSON-Manifest
- SHA-256-Prüfsumme
- keine Zugangsdaten im Manifest

Restore-Verifikation darf nur gegen eine **andere, ausdrücklich bestätigte Testdatenbank** laufen:

```bash
export RESTORE_DATABASE_URL='postgres://user:password@localhost:5432/werk_restore'
export BACKUP_FILE='./backups/ideenwerk-....dump'
export RESTORE_CONFIRM='I_UNDERSTAND_TEST_RESTORE'
npm run restore:verify
```

Das Script verweigert denselben Source-/Target-Datenbanknamen und prüft nach Restore die IDEENWERK-Pflichttabellen.

## Tests

Unit-Tests:

```bash
npm test
```

No-Login-/Privacy-Smoke-Test bei laufender API:

```bash
npm run smoke
```

Cluster-Goldset:

```bash
npm run eval:cluster
```

Konkrete Qualitätswerte gelten erst nach einem real ausgeführten Provider-Test.

## 100.000-Einreichungen-Lasttest

```bash
SYNTHETIC_COUNT=100000 SYNTHETIC_RUN_ID=R100K npm run load:seed
SYNTHETIC_RUN_ID=R100K npm run load:benchmark
SYNTHETIC_RUN_ID=R100K npm run load:cleanup
```

Der Generator legt klar markierte synthetische Testeinreichungen intern in PostgreSQL an und umgeht nicht den öffentlichen API-Schutz. Mehrere Worker können parallel betrieben werden.

## Integrations-CI

`.github/workflows/ideenwerk-backend-check.yml` ist vorbereitet für:

- Dependency-Installation
- Syntaxcheck
- Unit-Tests
- PostgreSQL 17
- Migrationen + Idempotenzprüfung
- API + Worker
- `/ready`
- No-Login-/Privacy-Smoke-Test
- Retention Dry-Run
- Backup
- Restore in zweite Testdatenbank
- Goldset-Diagnose
- kleinen Queue-Integrationstest

Connector-erzeugte Commits haben den neuen Workflow bisher nicht zuverlässig ausgelöst. Ein grüner CI-Lauf wird daher **erst dann behauptet, wenn er tatsächlich vorliegt**.

## Clusterpipeline

1. PII-Vorprüfung
2. konservative Strukturierung
3. `pg_trgm` Near-Duplicate-Suche
4. providerneutrale semantische Merkmale
5. Relationsentscheidung: gleiche Lösung / andere Lösungsvariante / mögliche Überschneidung / getrennt
6. Varianten-Schutz und bei Bedarf menschlicher Review
7. sachlicher Vorcheck

Fallback-Heuristik darf niemals automatisch semantisch verschmelzen.

## Vor Produktivbetrieb zwingend

- vollständigen Integrationslauf grün nachweisen
- Goldset und 100k-/Spike-Test real ausführen
- verteiltes Rate Limit/WAF/Bot-Challenge
- OIDC/MFA/RBAC für Operatoren
- DSGVO-/Retention-/Lösch-/Auskunftsprozess juristisch freigeben
- Status-Token-Threat-Model + Penetrationstest
- PII-Redaktionsqualität messen
- Regionen-/Popularitäts-/Astroturfing-Bias evaluieren
- Backup-RPO/RTO und externe verschlüsselte Backup-Ablage definieren
- wiederkehrenden Restore-Drill durchführen
- verifizierte Unterstützung strikt getrennt von anonymer Reaktion und geheimer amtlicher Stimme implementieren

## Abgrenzung

Der aktuelle WERK-V66-Stand verarbeitet **keine realen Bürgerdaten serverseitig**. Die Website speichert Demo-Ideen weiter nur lokal im Browser. Das Backend ist ein zunehmend vollständiger Test-/Deploy-Scaffold, aber noch kein produktiv freigegebener Bürgerdienst.
