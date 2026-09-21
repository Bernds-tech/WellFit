# WERK Next Best Action

Updated: 2026-09-21 22:44 Europe/Vienna

## Current state
Two active Builder scopes are already implemented on WERK Österreich Staging and are blocked only on independent Supervisor countercheck. They must not be rebuilt or expanded while their locks remain active.

1. `WERK-ID-CORE-001` — provider-neutral Verified Support core. Functional head `da75785b8d7d312f8beefbb2c37ed59abd52a4ff`; WERK Verified Support Core Check #4 and IDEENWERK Backend Check #194 are green; Staging migration `20260921203233 verified_support_core` is live with runtime marker `047_verified_support_core_disabled`. Public counting, public identity endpoint, external identity provider activation and WERK VOTE remain disabled.
2. `WERK-PARLIAMENTARY-RUNTIME-001` — internal parliamentary evidence trace runtime. Functional head `b34cc1f4f9e107bcbb46e82ea68975652eab2152`; WERK Parliamentary Trace Runtime Check #2 and IDEENWERK Backend Check #197 are green; Staging migration `20260921204112 parliamentary_trace_runtime` is live with runtime marker `048_parliamentary_trace_internal_disabled`. No live parliamentary connector, public endpoint, legal-effect claim, actor scoring or Production activation exists.

The Connection Sweep confirms that both scopes extend existing nodes/edges rather than creating parallel systems: Verified Support remains upstream of the still-blocked WERK VOTE path, and the parliamentary trace reuses the existing `PARLIAMENTARY-PATH -> KPI-MEASUREMENT` connection. Existing counterchecked Impact Measurement is referenced rather than duplicated.

## Exact next action
1. **Await independent Supervisor counterchecks for both active locks.** The Builder must not self-promote either task, release either lock, or start a parallel implementation while the counterchecks are outstanding.
2. Supervisor should validate `WERK-ID-CORE-001` against exact functional head `da75785b8d7d312f8beefbb2c37ed59abd52a4ff`, exact-head CI, migration 047, ACL/RLS, replay/negative/privacy semantics and zero cleanup.
3. Supervisor should validate `WERK-PARLIAMENTARY-RUNTIME-001` against exact functional head `b34cc1f4f9e107bcbb46e82ea68975652eab2152`, exact-head CI, migration 048, state-machine/replay/negative semantics, service-role-only ACL and zero cleanup.
4. Only after independent receipts exist may the Builder reconcile `TASK_LEDGER`, `STARTED_WORK`, `WORK_LOCKS`, `DEPENDENCIES` and `OPEN_LOOPS`, and may the Owner Action Manager reassess any identity/provider/legal/privacy readiness. No Owner action becomes READY_NOW from Builder evidence alone.

## Boundaries
- Historical generic WellFit finishline/owner files do not steer WERK.
- Builder does not write `WERK_SUPERVISOR_STATE`, `WERK_EVIDENCE_FRESHNESS`, `WERK_FINISHLINE_STATE` or the Navigator-owned `WERK_NEXT_BEST_ACTIONS.json` catalog.
- No Production, paid provider, external identity activation, live parliament integration, WERK VOTE activation or irreversible action is authorized.
- The known `pg_net extension_in_public` item remains a separate Production-hardening loop and does not justify reopening either bounded Staging implementation.
