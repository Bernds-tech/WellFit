# WERK Next Best Action

Updated: 2026-09-21 22:56 Europe/Vienna

## Current state
The independent Supervisor countercheck has now run for both active Staging scopes. Neither task may be promoted or closed yet. `WERK-PARLIAMENTARY-RUNTIME-001` has a **RED data-integrity contract breach** and a secondary YELLOW replay-race gap. `WERK-ID-CORE-001` has a **YELLOW receipt-validity gap**. Both existing locks/scopes remain the only legitimate implementation scopes; do not create parallel tasks or systems.

`WERK-PARLIAMENTARY-RUNTIME-001`: exact functional head `b34cc1f4f9e107bcbb46e82ea68975652eab2152` has WERK Parliamentary Trace Runtime Check #2 and IDEENWERK Backend Check #197 green, and migration `20260921204112 parliamentary_trace_runtime` is live. However, the contract promises evidence-required transitions and an append-only event ledger while the live tables have no enforcement triggers and service-role direct table mutation can bypass the controlled transition RPC. In addition, source decision/version replay is SELECT-then-INSERT without a database UNIQUE guard, leaving a concurrent duplicate race. Tables are currently zero-row and external/public parliamentary integration remains disabled.

`WERK-ID-CORE-001`: exact functional head `da75785b8d7d312f8beefbb2c37ed59abd52a4ff` has WERK Verified Support Core Check #4 and IDEENWERK Backend Check #194 green, and migration `20260921203233 verified_support_core` remains live after migration 048. RLS/ACL, disabled public counting/provider endpoint and zero baseline are intact. Countercheck nevertheless found that receipt creation does not reject `verified_at` values in the future and support recording does not require `verified_at <= now()`. No public counting/provider is active and there are no receipt/support rows, so this is a bounded YELLOW validity gap, not an observed public integrity loss.

## Exact next action
1. **First reconcile the existing `WERK-PARLIAMENTARY-RUNTIME-001` scope in place.** Enforce the append-only/evidence-transition contract against direct writes and make decision/version creation race-safe at database level. Add regression tests that falsify direct bypass and concurrent duplicate creation. Keep external connector/publication/Production disabled.
2. **Then reconcile the existing `WERK-ID-CORE-001` scope in place.** Fail closed on future-dated verification receipts and add a negative regression. Keep provider activation, public endpoint/counting and WERK VOTE disabled.
3. Push new exact functional head(s), rerun the dedicated checks plus IDEENWERK Backend Check, and provide fresh rollback/zero-cleanup Staging evidence after the corrective migration(s).
4. Only after a new independent Supervisor countercheck may locks/loops/dependencies be closed or Owner Action readiness be reassessed. No new feature slice is executable while the RED finding remains open.

## Boundaries
- Historical generic WellFit finishline/owner files do not steer WERK.
- Reconcile existing Task/Loop/Dependency IDs; no parallel parliamentary trace, identity ledger or task system.
- No political ranking, legal-effect claim, external identity activation, live parliamentary connector, public verified-support counting, WERK VOTE, paid/irreversible action or Production action is authorized.
- The known `pg_net extension_in_public` WARN remains a separate Production-hardening loop.
- Supervisor receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T205000Z.json`.
