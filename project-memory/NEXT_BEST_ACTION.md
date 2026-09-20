# WERK Next Best Action

This file is a derived selector, not a historical source of truth. Historical execution remains in `TASK_LEDGER.md`, `EXECUTION_RECEIPTS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md` and receipts.

- Project: `WERK Österreich`
- Selected action: `WERK-SEC-PGNET-ACL-001`
- Source: `CTR-WERK-SEC-PGNET-ACL-001` / `WERK-LOOP-SEC-PGNET-001`
- Status: `EXECUTABLE`
- Risk: `R3`
- Gate: `security_privacy`
- Title: pg_net Least-Privilege auf WERK Staging dauerhaft wiederherstellen

## Why this is next
Der unabhängige Supervisor hat live bestätigt, dass die aktuelle Staging-ACL nicht mehr der Absicht von Migration `016_internal_pg_net` entspricht: Schema `net` gewährt derzeit PUBLIC, `anon` und `authenticated` USAGE, während mehrere pg_net-Routinen PUBLIC EXECUTE tragen. Das ist ein neuer blockierender GELB-Sicherheitsbefund und hat nach WERK-Prioritätsregel Vorrang vor neuer Feature-Arbeit. Es wurde kein externer Exploit oder Datenabfluss nachgewiesen; deshalb ist dies kein ROT-Incident.

## Exact work
1. Alle tatsächlichen WERK-Abhängigkeiten von `pg_net` und Schema `net` bestimmen; keine angenommene Nutzung erfinden.
2. Supabase-verwaltetes Event-Trigger-Verhalten `issue_pg_net_access` / `extensions.grant_pg_net_access()` berücksichtigen und klären, wie Privilegien nach Extension-DDL/Updates dauerhaft least-privilege bleiben.
3. Eine bounded, reversible Hardening-Migration bzw. platform-kompatible Lösung bauen, die PUBLIC/`anon`/`authenticated` nicht mehr unnötig auf `net` zugreifen lässt und erforderliche interne Serverpfade nicht beschädigt.
4. Negative Tests für Privilege-Regression und relevante IDEENWERK-Backendpfade ergänzen.
5. Nur reversible Staging-Abnahme durchführen. Keine Production-Mutation.
6. Danach unabhängiger Supervisor-Gegencheck: Live-Schema-/Funktions-ACLs, relevante Backend-CI, Security Advisor, Edge-/Migration-State und synthetische Zero-Baseline.

## Safety
- `net.http_get`, `net.http_post`, `net.http_delete` oder andere externe pg_net-Aufrufe nicht zur bloßen Reachability-Prüfung ausführen.
- `pg_net` nicht blind verschieben, droppen oder deaktivieren, nur um den Advisor zu beruhigen.
- Keine Production-, kostenpflichtige, irreversible oder politische Aktion.
- Erst aktuelle Live-ACL-Evidence darf den Security-Befund schließen.

## Completed prerequisite
`WERK-GOV-001` ist unabhängig `COUNTERCHECKED`; `CTR-WERK-GOV-001` ist aufgelöst. WERK wird nicht mehr vom historischen WellFit-Selector gesteuert.

## Queued after this finding
- `WERK-IDEENWERK-IMPACT-BRIDGE-001` / `NBA-WERK-IMPACT-BRIDGE`: Bürgerideen/Cluster mit bestehenden WERK-Rechenmodellen und Reformakten verbinden, ohne Parallelrechnung oder erfundene Wirkungszahlen.

## Selection sources
`WERK_SUPERVISOR_STATE.json`, `CONTRADICTIONS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`, `TASK_LEDGER.md`, `EXECUTION_RECEIPTS.md`, `WERK_NEXT_BEST_ACTIONS.json`, `WERK_FINISHLINE_STATE.json` and `werk-data/werk-system-graph.json`.
