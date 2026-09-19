# WERK IDEENWERK – Staging Runbook

Status: **realer No-Login-Stagingpfad am 20.09.2026 verifiziert** (`Edge API → RPC → pg_cron-Worker → privater Status → Transparenzmetrik → Cleanup`). Die Laststufe mit 1.000 Einreichungen ist im isolierten CI grün; ein gesonderter 1k-Lauf gegen die echte Supabase-Staging-Datenbank bleibt ein eigenes Gate.

## 1. Grundregel

Das Staging verarbeitet bis zur Datenschutz-/Security-Freigabe ausschließlich synthetische Testdaten. Bestehende FanMind-, Trading- oder KI-Person-Studio-Datenbanken werden nicht für WERK wiederverwendet.

## 2. Empfohlene Umgebung

- Projekt: `WERK Österreich Staging`
- PostgreSQL: 17
- Region: `eu-central-1`
- API/Worker getrennt skalierbar
- Staging-Origin explizit in `ALLOWED_ORIGINS`
- `DB_RATE_LIMIT_ENABLED=true`
- `ABUSE_HASH_SECRET` mindestens 32 zufällige Zeichen
- `RETENTION_DRY_RUN=true`
- `SEMANTIC_PROVIDER=fallback` für den ersten Runtime-Lauf

## 3. Startreihenfolge

1. Datenbank bereitstellen.
2. `npm install`.
3. `npm run migrate`.
4. `npm run migrate` erneut – muss vollständig idempotent sein.
5. `npm run guardrails:operator`.
6. API starten.
7. Worker starten.
8. `/ready` prüfen – darf erst grün werden, wenn Migration `011_distributed_rate_limit.sql` vorhanden ist.
9. `npm run smoke`.
10. `npm run retention:run` im Dry-Run.

## 4. Backup-/Restore-Drill

1. `BACKUP_DIR=<isolierter pfad> npm run backup`.
2. Separate Restore-Datenbank erstellen.
3. `RESTORE_DATABASE_URL` auf diese Datenbank setzen.
4. `BACKUP_FILE` auf den erzeugten Dump setzen.
5. `RESTORE_CONFIRM=I_UNDERSTAND_TEST_RESTORE npm run restore:verify`.
6. Ergebnis dokumentieren; erst ein erfolgreicher Restore zählt als getestetes Backup.

## 5. Laststufen

### 1.000 Einreichungen

```bash
SYNTHETIC_RUN_ID=STG1K SYNTHETIC_COUNT=1000 SYNTHETIC_BATCH=250 npm run load:seed
SYNTHETIC_RUN_ID=STG1K BENCHMARK_MAX_SECONDS=180 npm run load:benchmark
SYNTHETIC_RUN_ID=STG1K npm run load:cleanup
```

Freigabe nur wenn keine Dead Jobs und keine verwaisten Review-Tasks/Cluster verbleiben.

### 10.000 Einreichungen

Erst nach erfolgreicher 1k-Stufe. Workerzahl, Queue-Latenz und Indizes dokumentieren.

### 100.000 Einreichungen

Erst nach erfolgreicher 10k-Stufe. Veröffentlicht werden mindestens Durchsatz sowie p50/p95/p99 der automatischen Vorverarbeitung und der manuelle Review-Backlog.

## 6. Clusterqualität

Der deterministische Fallback ist nur Sicherheits-/Ausfallmodus. Ein produktiver Semantikprovider benötigt ein größeres repräsentatives Goldset. Kritisch sind insbesondere:

- False Merge = unterschiedliche Lösungen fälschlich verschmolzen,
- Variant Loss = Lösungsvariante verschwindet,
- False Split = echte Duplikate bleiben unnötig getrennt,
- regionale Verzerrung,
- sensible Grundrechts-/Minderheitenthemen.

## 7. Reproduzierbarer Edge-E2E-Smoke

Der reale Bürgerpfad kann ohne Produktionsdaten wiederholt geprüft werden:

```bash
WERK_STAGING_EDGE_URL=https://<projekt>.supabase.co/functions/v1/werk-ideenwerk-api \
DATABASE_URL=postgres://<staging-db> \
npm run smoke:staging
```

Der Test prüft eine synthetische No-Login-Einreichung, den einmaligen Status-Token, den geschützten Statusabruf, die automatische Worker-Fortschreibung bis zu einem stabilen Prüfpunkt, Idempotenz ohne erneute Token-Ausgabe, Ablehnung eines falschen Tokens, die Transparenzmetrik sowie Dead-/Orphan-Job-Gates. Anschließend werden die eigenen synthetischen Datensätze transaktional bereinigt.

## 8. Kein Produktivsignal

Ein grünes Staging bedeutet nicht automatisch öffentliche Freigabe. OIDC/MFA/RBAC, Datenschutz-/Retention-Freigabe, WAF/Bot-Schutz, Penetrationstest, Betreiber-/Impressumsdaten und Produktiv-Backupregeln bleiben separate Gates.
