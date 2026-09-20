# WERK Next Best Action

This file is a derived selector, not a historical source of truth. Historical execution remains in `TASK_LEDGER.md`, `EXECUTION_RECEIPTS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md` and receipts.

- Project: `WERK Österreich`
- Selected action: `WERK-SEC-PGNET-001`
- Source finding: `CTR-WERK-SEC-PGNET-ACL-001`
- Open loop: `WERK-LOOP-SEC-PGNET-001`
- Status: `IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK`
- Risk: `R3`
- Gate: `security_privacy`
- Title: pg_net Data-API-Grenze auf WERK Staging absichern und unabhängig gegenprüfen

## Current result
Der Builder hat die blockierende GELB-Lücke bounded gehärtet, ohne die Supabase-verwaltete Extension zu verschieben, zu droppen oder externe `net.http_*`-Aufrufe auszuführen:

1. Migration `036_pg_net_data_api_guard.sql` ist auf WERK Österreich Staging als `20260920203049 pg_net_data_api_guard` aktiv.
2. PostgREST führt `public.werk_api_security_guard()` als `pgrst.db_pre_request` aus.
3. `anon` und `authenticated` werden für `Accept-Profile: net` bzw. `Content-Profile: net` fail-closed mit 403 blockiert; normales `public`-Profil bleibt erlaubt.
4. Es existiert kein WERK-eigener, für `anon`/`authenticated` ausführbarer Wrapper auf `net.http_*`/pg_net-Routinen.
5. `service_role` wird vom öffentlichen/userseitigen Profil-Guard nicht blockiert.
6. Direkte `net`-ACLs bleiben auf Hosted Supabase teilweise platform-managed durch `supabase_admin`; WERK behauptet deshalb ausdrücklich nicht, diese Managed Grants dauerhaft widerrufen zu haben.
7. Der Security Advisor meldet weiterhin `extension_in_public` für pg_net. Das ist nicht durch blindes Drop/Reinstall/Move zu kaschieren und bleibt für den Supervisor als Plattform-/Produktions-Hardening-Grenze sichtbar.
8. Reversible Rollback-Probe für Guard-Funktion und `pgrst.db_pre_request` wurde transaktional durchgeführt; der Staging-Zustand blieb danach intakt.
9. IDEENWERK Edge Function blieb Version 7 aktiv und die relevanten synthetischen Tabellen wurden mit Zero-Baseline verifiziert.

## CI status
Der pg_net-spezifische Guardrail, Migration/Idempotenz, Unit Tests, API/Privacy Smoke, Backup/Restore und die übrigen Backend-Guardrails bestanden auf exact head `4d79bf4fab4ec3448033f77919bd32c18ab6a7a4`. Der erste Gesamt-Backend-Lauf #161 scheiterte ausschließlich am bestehenden 1.000-Item-Queue-Benchmark durch 120-s-Timeout; der fehlgeschlagene Job wurde einmal unverändert neu gestartet. Keine Benchmark-Schwelle wurde gelockert.

## Exact next work
1. Re-run-Ergebnis von IDEENWERK Backend Check #161 konsumieren.
2. Bei grünem Re-run Builder-Claim mit exact head, Staging-Migration, negativen Guardrails, Zero-Baseline und Rollback-Evidence finalisieren.
3. Danach unabhängiger Supervisor-Gegencheck: aktuelle Managed-ACL-Grenze, PostgREST-Profilblock, Backend-CI, Security Advisor, Edge/Migration-State, Zero-Baseline und WERK-Evidence-TTL.
4. Erst wenn das blockierende GELB geschlossen oder präzise als akzeptierte Plattformgrenze klassifiziert ist, zur funktionalen Next-Best-Action wechseln.

## Safety
- `net.http_get`, `net.http_post`, `net.http_delete` oder andere externe pg_net-Aufrufe nicht zur Reachability-Prüfung ausführen.
- `pg_net` nicht blind verschieben, droppen oder deaktivieren, nur um den Advisor zu beruhigen.
- Keine Production-, kostenpflichtige, irreversible oder politische Aktion.
- Builder setzt keinen `ACCEPTED`-/`COUNTERCHECKED`-Status selbst.

## Completed prerequisite
`WERK-GOV-001` ist unabhängig `COUNTERCHECKED`; `CTR-WERK-GOV-001` ist aufgelöst. WERK wird nicht mehr vom historischen WellFit-Selector gesteuert.

## Queued after this finding
- `WERK-IDEENWERK-IMPACT-BRIDGE-001` / `NBA-WERK-IMPACT-BRIDGE`: Bürgerideen/Cluster mit bestehenden WERK-Rechenmodellen und Reformakten verbinden, ohne Parallelrechnung oder erfundene Wirkungszahlen.

## Selection sources
`WERK_SUPERVISOR_STATE.json`, `CONTRADICTIONS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `TASK_LEDGER.md`, `EXECUTION_RECEIPTS.md`, `WERK_NEXT_BEST_ACTIONS.json`, `WERK_FINISHLINE_STATE.json` and `werk-data/werk-system-graph.json`.
