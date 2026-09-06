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
- Updated: 2026-09-06
- Gap: the articulated head/body Puppet renderer is technically merged in WellFit-now (`d374e4db4777406d93a8aad72adc10ab47db216f`), but no current rendered evidence proves the intended independent head/body motion and CTA targeting on the exact `wellfit-bewegt` Site. WellFit-now PR #403 deliberately kept its Puppet loop open rather than inferring visual verification from CI.
- Close when: the exact Site source is loaded, the relevant current avatar-attention behavior is synchronized as appropriate, pointer/CTA tracking is visually tested on the exact preview without seams/ghosting/layout regressions, and the verified version is deliberately published.
- Next check: no GitHub-only substitute work. The next execution context must be the actual editable `wellfit-bewegt` Site.

## WF-LOOP-006
- Related: WFG-RUDI-WORLD-001 / WFG-CR-008 / WellFit-now PRs #401/#402/#403
- Status: OPEN
- Updated: 2026-09-06
- Gap: the hardened DOM-surface-bound Rudi technical bridge is repository-VERIFIED in WellFit-now, but the exact public `wellfit-bewegt` Site has not been proven synchronized and visually accepted on that version. Hardened source is merge `b07d39938aeab4e32eddac7d19b8e15e22afacb7`; technical memory closeout is merge `40af0c25725e4bec096db690da808ad669691f2e`. Repository CI cannot prove perceived foot contact, climbing, foreground/background occlusion or public-Site delivery.
- Current evidence: PR #401 exact head `54186ec16a617549acbaa0437b0b81ab36ee2abb` passed Build #1285, Container #270, Database #262, Beta Emulator #241 and Project Memory gates; PR #402 exact head `23318cdf395bd25e46f1b2a31499f14cc8afd51d` passed Build #1288, Container #273, Database #265 and Project Memory Guard #116 / Quality #123 / Status #131; PR #403 exact head `a0f2f62793f1abf8403a60871eea84a35e9c2e9d` passed Build #1305, Container #290, Database #282 and Project Memory Guard #132 / Quality #140 / Status #148. The current active runtime has one DOM-bound controller, starts on the `F`, follows real DOM geometry without viewport clamping, uses visible grounded routes and fails closed into static DOM-bound presentation.
- Close when: hardened source `b07d399...` is synchronized into the actual editable Site source; a current real-WebGL preview visibly proves all ten manifest checks including grounded F-climb, surface-relative scrolling, complete offscreen departure, non-flying catch-up, plausible surface-to-surface traversal, correct front/back layering, unobscured/interactable controls, CTA gaze without relocation and reduced-motion/static fallback; and the accepted version is deliberately published.
- Next check: execute the Site-specific synchronization/preview from `RUDI_SITE_SYNC_MANIFEST.json`. Do not resume the deleted viewport/chapter controller, Site-v105 behavior, old props scenes or a second WellFit-now Rudi implementation.

Rules: `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` and `RECONCILIATION_REQUIRED` tasks require an open-loop reference or explicit no-follow-up rationale. Never delete historical loops; close or supersede them. States: `OPEN`, `BLOCKED`, `CLOSED`, `SUPERSEDED`.
