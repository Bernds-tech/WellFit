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
- Gap: the web avatar-attention implementation and cross-repo coordination are merged and COUNTERCHECKED, but runnable browser/preview evidence on the selected graphical surface and deliberate synchronization to the separate Sites-v71 candidate are still unavailable; visual acceptance must not be inferred from CI.
- Close when: the selected canonical/Sites surface proves pointer-to-avatar and control-target attention behavior without layout/transform regressions and the Sites-v71 synchronization/acceptance decision is recorded.
- Next check: preserve merged PRs #387/#23; when the editable Sites/canonical preview source is available, synchronize and visually countercheck the behavior before owner acceptance.

Rules: `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` and `RECONCILIATION_REQUIRED` tasks require an open-loop reference or explicit no-follow-up rationale. Never delete historical loops; close or supersede them. States: `OPEN`, `BLOCKED`, `CLOSED`, `SUPERSEDED`.