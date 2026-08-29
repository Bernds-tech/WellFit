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
- Related: WFG-AVATAR-PUPPET-001 / WFG-CR-007 / CTR-WFG-006
- Status: OPEN
- Updated: 2026-08-29
- Gap: the reusable articulated head/body Puppet renderer is now merged and fully green in WellFit-now (`d374e4db4777406d93a8aad72adc10ab47db216f`), but the actual public `wellfit-bewegt` ChatGPT Site is a separate Sites source and still does not contain the behavior. The user therefore correctly still sees no head movement on the public Landingpage.
- Close when: the owner opens `wellfit-bewegt` through ChatGPT Sites/Edit (or the original Site chat) so the Site is referenced in the composer; the verified Puppet renderer and Luma/Rudi/avatar pivots are ported to that Site source; pointer/CTA tracking is visually tested on the exact preview without seams/ghosting/layout regressions; and the verified version is deliberately published to the existing public Site URL.
- Next check: no more GitHub-only substitute work. The next execution context must be the actual ChatGPT Site reference in the composer.

Rules: `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` and `RECONCILIATION_REQUIRED` tasks require an open-loop reference or explicit no-follow-up rationale. Never delete historical loops; close or supersede them. States: `OPEN`, `BLOCKED`, `CLOSED`, `SUPERSEDED`.
