# WERK Next Best Action

This file is a derived selector, not a historical source of truth. Historical execution remains in `TASK_LEDGER.md`, `EXECUTION_RECEIPTS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md` and receipts.

- Project: `WERK Österreich`
- Selected action: `WERK-SEC-PGNET-001-CLOSEOUT`
- Related task: `WERK-SEC-PGNET-001`
- Status: `RECONCILIATION_REQUIRED_BEFORE_FEATURE_WORK`
- Risk: `R2` bookkeeping / `R3` production-hardening boundary
- Gate: `security_privacy`
- Title: pg_net-Staging-Gegencheck konsumieren, stale Task/Lock schließen und dann Impact Bridge starten

## Independent supervisor result
The bounded staging security implementation is independently counterchecked for its actual claim scope:

1. Functional security head `4d79bf4fab4ec3448033f77919bd32c18ab6a7a4` has IDEENWERK Backend Check #161 final `SUCCESS` on attempt 2; the pg_net guardrail and unchanged 1,000-item queue integration both passed.
2. WERK Österreich Staging is `ACTIVE_HEALTHY`; `werk-ideenwerk-api` remains ACTIVE version 7.
3. Live migration truth is `20260920203116 pg_net_data_api_guard` — not the `20260920203049` timestamp written in the Builder claim. Same migration name/content, but the receipt timestamp must be corrected to live truth.
4. `authenticator` currently has `pgrst.db_pre_request=public.werk_api_security_guard`.
5. Independent transient guard verification blocks an `anon` request context selecting profile `net` with `WERK_INTERNAL_SCHEMA`, while profile `public` remains allowed.
6. `anon` and `authenticated` are NOLOGIN roles; the guard is executable by anon/authenticated/service_role; no WERK-owned public function wrapping `net.http_*` exists.
7. Hosted Supabase still owns/restores direct `net` schema/function ACLs, including PUBLIC/anon/authenticated schema usage and PUBLIC execute on pg_net routines. WERK therefore does not claim durable direct-ACL revocation.
8. Security Advisor still reports `extension_in_public` for pg_net. This remains a non-blocking staging / blocking production-hardening limitation; no extension move/drop/reinstall is authorized merely to silence the advisor.
9. The 13 checked IDEENWERK citizen/review/privacy/cluster tables are at zero synthetic baseline.
10. No outbound `net.http_*` call was executed by the supervisor.

## Exact next work
Before ordinary feature work, perform one bounded Project-Memory reconciliation only:

1. Correct the Builder claim / receipts to live migration id `20260920203116`.
2. Mark `WERK-SEC-PGNET-001` `COUNTERCHECKED` for the bounded **staging Data-API boundary**; do not claim production security acceptance.
3. Release `LOCK-WERK-SEC-PGNET-001` and remove stale `IN_PROGRESS` / `IMPLEMENTED_NOT_VERIFIED` wording from Started Work / Task Ledger / current selector.
4. Resolve `CTR-WERK-SEC-PGNET-ACL-001` by documenting that migration 036 supersedes the old direct-ACL assumption with the enforceable Hosted-Supabase-compatible boundary: NOLOGIN request roles + no WERK pg_net wrapper + PostgREST pre-request denial of profile `net`.
5. Keep `WERK-LOOP-SEC-PGNET-001` open only as a **non-blocking production-hardening limitation** while `extension_in_public` and Supabase-managed direct ACLs remain.
6. Append the independent countercheck receipt to `EXECUTION_RECEIPTS.md` and consume the security task completion.
7. Immediately after this memory-only closeout, select `WERK-IDEENWERK-IMPACT-BRIDGE-001` / `NBA-WERK-IMPACT-BRIDGE` as the next functional Builder action.

## Do not repeat
- Do not rebuild or further mutate pg_net staging merely because the advisor warning remains.
- Do not call `net.http_*` as a security test.
- Do not move/drop/reinstall a Supabase-managed extension without a separately justified platform-safe plan.
- Do not treat the staging countercheck as `ACCEPTED` or `PRODUCTION_CONFIRMED` security.

## Queued functional action
`WERK-IDEENWERK-IMPACT-BRIDGE-001`: connect citizen ideas/clusters to existing WERK calculation and reform artifacts with version-bound provenance and open calculation gates, without parallel calculations or invented fiscal effects.

## Selection sources
`WERK_SUPERVISOR_STATE.json`, `WERK_EVIDENCE_FRESHNESS.json`, `CONTRADICTIONS.md`, `OPEN_LOOPS.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `DEPENDENCIES.md`, `TASK_LEDGER.md`, `EXECUTION_RECEIPTS.md`, `WERK_NEXT_BEST_ACTIONS.json`, `WERK_FINISHLINE_STATE.json` and `werk-data/werk-system-graph.json`.
