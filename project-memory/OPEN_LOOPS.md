# WellFit Open Loops

Use this register for started, partial, blocked or implemented-but-unverified visual/landing/UI follow-up work.

## WF-LOOP-001
- Related: WF-MEM-001
- Status: CLOSED
- Updated: 2026-08-19
- Gap: v1 project memory lacked open-loop/dependency/evidence/stale-work controls.
- Close when: Project Memory Protocol v2 is merged and active.
- Result: Closed by the v2 governance upgrade.

## WF-LOOP-002
- Related: WFG-VIS-001
- Status: OPEN
- Updated: 2026-08-20
- Gap: substantive visual work exists in PR #2, but it is not reconciled to current main/cross-repo capability. Fresh GitHub metadata reports it as draft and mergeable, while its exact head has no current Actions acceptance. It remains unaccepted.
- Close when: one canonical visual baseline is selected, current checks/browser evidence are green, capability claims match WellFit-now/WellFit-Buddy, and visual acceptance is recorded.
- Next check: classify PR #2/current main/current visual assets; do not start a parallel redesign first. Treat mergeability only as Git compatibility, not acceptance.

## WF-LOOP-003
- Related: WFG-VIS-001 / PR #1
- Status: SUPERSEDED
- Updated: 2026-08-20
- Gap: PR #1 represents a flavor/size/subscription product-preview concept inconsistent with current WellFit product truth.
- Resolution: exclude and close the stale PR; preserve history, do not merge it.


## WF-LOOP-004
- Related: WFG-MOBILE-UX-001 / WF-CONTRACT-MOBILE-SHELL-001
- Status: OPEN
- Updated: 2026-08-26
- Gap: the one-screen AR shell target is owner-approved and specified, but graphical acceptance, general mobile-shell implementation, Unity/Buddy integration, build and exact-device evidence do not yet exist.
- Close when: the canonical contract is counterchecked and later exact-version visual + technical shell + Buddy AR implementation passes WF-INT-006 and the applicable device gates.
- Next check: countercheck this specification PR, then create separate repository-owned implementation tasks without bypassing WFB-UNITY-EDITOR-RESOLVE-001.

## WF-LOOP-005
- Related: WFG-AVATAR-ATTN-001 / WFN-AVATAR-ATTN-001
- Status: OPEN
- Updated: 2026-08-26
- Gap: the owner-requested web avatar attention layer is implemented on a WellFit-now branch, but exact PR CI/build/lint, browser/preview evidence, separate Sites-v71 synchronization and final visual acceptance are still open.
- Close when: exact implementation and coordination revisions are green/counterchecked, a runnable preview proves pointer-to-avatar and control-target attention behavior without layout regressions, and the selected canonical/Sites surface is deliberately synchronized or explicitly deferred.
- Next check: open the implementation and master-record PRs, run branch checks, then obtain visual preview evidence. Do not claim the public Sites-v71 candidate changed merely because the GitHub web code changed.

Rules: `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` and `RECONCILIATION_REQUIRED` tasks require an open-loop reference or explicit no-follow-up rationale. Never delete historical loops; close or supersede them. States: `OPEN`, `BLOCKED`, `CLOSED`, `SUPERSEDED`.