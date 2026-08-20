# Started Work Register

Canonical register for work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## WFG-VIS-001
- Started: 2026-08-15
- Updated: 2026-08-20
- Status: RECONCILIATION_REQUIRED
- Risk: R2
- Scope: canonical graphical/landing/UI baseline for WellFit.
- Branch/PR: `agent/import-wellfit-landingpage` / PR #2.
- Work lock: `LOCK-WFG-VIS-001` is STALE until the old branch is deliberately resumed or superseded.
- Dependencies: current WellFit-now technical capability, current WellFit-Buddy Buddy capability, `WF-CONTRACT-*` and `WF-XDEP-*` alignment.
- Assumptions: PR #2 is a candidate, not automatically the accepted canonical visual baseline.
- Completed so far: responsive landing/visual world and visual-only auth previews implemented on PR #2 according to its exact branch content and PR description.
- Still open: current-main reconciliation, exact visual acceptance, current CI/browser evidence, capability-claim cross-check, decision to rebase/replace selected portions.
- Evidence so far: PR #2 head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`; fresh 2026-08-20 metadata reports draft + mergeable, but exact-head Actions lookup returns no runs.
- Exact next step: inventory and classify current visual variants before further graphical implementation, then produce current exact-head CI/browser evidence for the selected baseline.
- Owner action needed: visual acceptance only after current preview/evidence exists.

## Closed work

No additional closed product work is recorded here yet.