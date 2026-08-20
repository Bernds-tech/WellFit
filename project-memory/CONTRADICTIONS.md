# Contradiction / Reconciliation Register

Any conflict between project memory and actual Git/PR/CI/preview/runtime evidence is recorded here and forces `RECONCILIATION_REQUIRED` until resolved.

Statuses: `OPEN`, `RECONCILIATION_REQUIRED`, `RESOLVED`, `SUPERSEDED`.

## CTR-WFG-001
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: WFG-VIS-001 / PR #1
- Risk: R2
- Source A: PR #1
- Claim A: WellFit public product is a flavor/size/subscription product configurator.
- Source B: current WellFit/WellFit-now/WellFit-Buddy product roles and current WellFit product implementation.
- Claim B: WellFit is the graphical frontend of the movement/Buddy product; technical capability is in WellFit-now and Buddy capability in WellFit-Buddy.
- Stronger/current evidence: current program memory plus current WellFit-now product/runtime.
- Status: RESOLVED
- Resolution/action: PR #1 is obsolete/superseded and must be closed, not merged.
- Evidence: PR #1 metadata; `WELLFIT_MASTER_STATE.json`; current role definitions.

## CTR-WFG-002
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: WFG-VIS-001
- Risk: R2
- Source A: `STARTED_WORK.md`, `OPEN_LOOPS.md`, `EVIDENCE.md` before this reconciliation
- Claim A: no active substantive visual work was recorded.
- Source B: open PR #2
- Claim B: substantive visual implementation has existed since 2026-08-15 and remains unresolved.
- Stronger/current evidence: current PR metadata and exact head.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: carry WFG-VIS-001 through Task Ledger, Started Work, Loop, Evidence, Lock and dependencies; resolve after this reconciliation merges.
- Evidence: PR #2 head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`.

## CTR-WFG-003
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: governance
- Risk: R3
- Source A: `BRANCH_PROTECTION_CONTRACT.json`
- Claim A: main requires PRs/status checks/conversation resolution and blocks force-push/delete.
- Source B: live GitHub branch metadata
- Claim B: `main` reports `protected=false` and no enforced required checks.
- Stronger/current evidence: live GitHub branch API.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: keep branch+PR discipline operationally; owner must activate GitHub protection/ruleset when available.
- Evidence: live `main` branch metadata on 2026-08-20.

## CTR-WFG-004
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: cross-repo responsibility
- Risk: R3
- Source A: earlier memory wording
- Claim A: WellFit-Buddy owns native AR/mobile/buddy generally.
- Source B: current owner-defined role split
- Claim B: WellFit-now is the technical part, WellFit is graphical, WellFit-Buddy is the Buddy; general technical mobile logic remains technical unless Buddy-specific.
- Stronger/current evidence: latest owner direction, persisted through this reconciliation.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: update master/local role and dependency/contract wording consistently across all three repositories.
- Evidence: this reconciliation PR and matching local-repo reconciliation PRs.

Never resolve a contradiction by deleting the older record. Preserve the stale claim and record why it was superseded.