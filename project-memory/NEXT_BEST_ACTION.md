# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IDEENWERK-IMPACT-BRIDGE-001-CLOSEOUT`
- Parent task: `WERK-IDEENWERK-IMPACT-BRIDGE-001`
- Status: `RECONCILIATION_REQUIRED`
- Risk: `R1`
- Gate: `impact_bridge`

## Current state
The Impact Bridge itself is independently `COUNTERCHECKED_STAGING`. Exact tested head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be` passed WERK Frontend Check #177 and WERK Impact Bridge Check #3. Live WERK Österreich Staging has migration `20260920223436 ideenwerk_impact_bridge`, runtime contract `037_ideenwerk_impact_bridge`, RLS/service-role-only bridge access, current version/source fail-closed behavior, Edge API version 7 and a restored zero-data synthetic baseline. Supervisor receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T225510Z.json`.

## Exact next step
Perform **memory-only closeout** of the now-stale pre-countercheck wording in the shared registers: `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md` and the master `EXECUTION_RECEIPTS.md` index. Mark the Impact Bridge task/dependency/loop `COUNTERCHECKED_STAGING`, release `LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001`, consume the Supervisor receipt, and do not change product/runtime/database code.

After that closeout, select `WERK-EXPERT-001` / `NBA-WERK-EXPERT-PROCESS` as the next functional action by catalog priority.

## Do not rebuild
Do not reimplement migration 037, the registry, V71 status integration, stale-version path, existing-measure/competence/privacy/clarification work, or any parallel calculator.

## Residual independent finding
`WERK-LOOP-SEC-PGNET-001` remains a nonblocking Staging / blocking Production-hardening issue. It does not block the memory closeout or subsequent reversible Staging feature work.
