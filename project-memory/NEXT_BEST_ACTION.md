# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IDEENWERK-IMPACT-BRIDGE-001-CLOSEOUT`
- Parent task: `WERK-IDEENWERK-IMPACT-BRIDGE-001`
- Status: `PARTIAL_RECONCILIATION_REQUIRED`
- Risk: `R1`
- Gate: `impact_bridge`

## Current state
The Impact Bridge itself is independently `COUNTERCHECKED_STAGING`. Exact tested head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be` passed WERK Frontend Check #177 and WERK Impact Bridge Check #3. Live WERK Österreich Staging has migration `20260920223436 ideenwerk_impact_bridge`, runtime contract `037_ideenwerk_impact_bridge`, RLS/service-role-only bridge access, current version/source fail-closed behavior, Edge API version 7 and a restored zero-data synthetic baseline. Supervisor receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T225510Z.json`.

## Closeout progress in this Builder run
- `OPEN_LOOPS.md`: `WERK-LOOP-IMPACT-BRIDGE-001` consumed as `CLOSED_COUNTERCHECKED_STAGING`.
- `DEPENDENCIES.md`: `WERK-DEP-IDEENWERK-IMPACT-001` consumed as `SATISFIED` with independent countercheck evidence and downstream unlock noted.
- Product/runtime/database code was not changed.

## Remaining exact next step
Complete the remaining memory-only stale wording in `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md` and the master `EXECUTION_RECEIPTS.md` index. The Builder must update Task/Started/Lock state, while the master receipt index remains Supervisor-owned under the WERK write-authority contract. Release `LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001` only after those records consume the independent receipt.

After the canonical closeout is complete, select `WERK-EXPERT-001` / `NBA-WERK-EXPERT-PROCESS` as the next functional action by catalog priority.

## Do not rebuild
Do not reimplement migration 037, the registry, V71 status integration, stale-version path, existing-measure/competence/privacy/clarification work, or any parallel calculator.

## Residual independent finding
`WERK-LOOP-SEC-PGNET-001` remains a nonblocking Staging / blocking Production-hardening issue. It does not block the memory closeout or subsequent reversible Staging feature work.
