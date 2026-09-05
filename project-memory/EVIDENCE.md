# WellFit Evidence and Acceptance

Implementation and acceptance are separate states.

Status model: `IMPLEMENTED`, `IMPLEMENTED_NOT_VERIFIED`, `VERIFIED`, `COUNTERCHECKED`, `ACCEPTED`, `PRODUCTION_CONFIRMED`. Historical `DONE` remains valid only for v1 records.

Every evidence record should contain a unique evidence ID, related task/change ID, date, target/environment, evidence type, immutable reference where practical, result, limitations and acceptance state.

## WF-EV-001
- Related: WF-MEM-001
- Date: 2026-08-19
- Target: repository governance
- Type: merged repository controls
- Reference: Project Memory Protocol v1 and guard workflow on `main`
- Result: durable operational memory established
- Limitations: v1 did not separate open loops, dependencies, acceptance levels or stale scanning
- Acceptance: VERIFIED

## WF-EV-002
- Related: WFG-VIS-001
- Date: 2026-08-20 reconciliation of work from 2026-08-15
- Target: graphical WellFit candidate baseline
- Type: implementation evidence
- Reference: PR #2, exact head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`
- Result: PR contains a substantive landing/UI candidate with responsive pages and visual-only access screens. Fresh PR metadata reports `draft=true`, `mergeable=true`.
- Limitations: mergeability is not acceptance; PR is based on older main; no GitHub Actions runs exist on the exact head; PR-body test statements are not independent current acceptance evidence.
- Acceptance: IMPLEMENTED_NOT_VERIFIED

## WF-EV-003
- Related: WFG-VIS-001
- Date: 2026-08-20
- Target: current GitHub state
- Type: independent countercheck evidence
- Reference: current PR metadata for #1/#2; current main; current V9 master memory; exact-head workflow lookup for PR #2
- Result: PR #1 is inconsistent with current product scope; PR #2 is the only plausible active visual candidate, is currently mergeable but still draft and has zero exact-head Actions runs, so it is not currently acceptable.
- Limitations: this is repository/PR countercheck, not visual owner acceptance or browser/device acceptance.
- Acceptance: COUNTERCHECKED

## WF-EV-004
- Related: WFG-RECON-20260820
- Date: 2026-08-20
- Target: governance/security
- Type: remote branch-state countercheck
- Reference: GitHub branch API for `main`
- Result: `main` is currently `protected=false`, while `BRANCH_PROTECTION_CONTRACT.json` requires PRs/status checks/conversation resolution and blocks force-push/delete.
- Limitations: branch protection/ruleset activation remains an owner/governance action.
- Acceptance: VERIFIED

## WF-EV-005
- Related: WFG-MASTER-MIG-002-RECON / WF-MIG-002
- Date: 2026-08-26
- Target: WellFit program-level Buddy migration readiness
- Type: immutable cross-repository source/baseline countercheck
- Reference: WellFit-now `447093decd783b33a6e724170dbe4667e899348b:native/unity/WellFitBuddyAR`; WellFit-Buddy merged PRs #18/#19 and main `48405aad8489c03d68f58526867eb14bb4458823`
- Result: the exact source is valuable scaffold/reference material, not a complete or compile-ready Unity project; WellFit-Buddy contains the reviewed baseline and Git LFS preparation but no Unity runtime, successful build or device acceptance.
- Limitations: static repository and CI evidence only; no Unity editor, Android build or real-device execution occurred.
- Acceptance: COUNTERCHECKED

## WF-EV-006
- Related: WFG-MOBILE-UX-001 / WF-CONTRACT-MOBILE-SHELL-001
- Date: 2026-08-26
- Target: canonical mobile one-screen AR UX
- Type: owner product decision plus bounded cross-repository contract
- Reference: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md` and PR #22
- Result: full-screen persistent camera/AR root, minimal logo/menu chrome, overlay feature navigation, PC-first deep configuration and split repository authority are specified.
- Limitations: this accepts the target specification only; no visual runtime, Unity compile, Android build or real-device behavior is implemented or accepted.
- Acceptance: COUNTERCHECKED

## WF-EV-007
- Related: WFG-RUDI-WORLD-001 / WFG-CR-008 / WFN-RUDI-3D-001
- Date: 2026-09-05
- Target: DOM-bound living Rudi public-landing implementation in `Bernds-tech/WellFit-now`
- Type: merged implementation + exact-head CI/review countercheck
- Reference: WellFit-now PR #401 exact head `54186ec16a617549acbaa0437b0b81ab36ee2abb`; squash merge `9ae4f278a90d17d612f0399c40babd32c344e02b`
- Result: one active `LivingRudiWorld` controller binds Rudi to real DOM surfaces, starts on the `F` letter anchor, deliberately omits viewport clamping so he leaves the screen with his surface, delays catch-up until scroll-settle plus full offscreen departure, uses visible grounded walk/climb routes for catch-up and autonomous surface transitions, flattens imported root translation so DOM geometry owns locomotion, clears stale CTA attention on scroll, and contains WebGL/GLTF failures behind a static DOM-bound fallback. The old parallel viewport/chapter controller was deleted. Reduced-motion visitors use the static fallback and sub-desktop visitors do not mount the 3D world. Manual asset workflows were also hardened against default-branch materialization, stale fixed artifact IDs, unvalidated bot heads and loss of partial paid Meshy outputs.
- Exact-head checks: Build #1285 success; Container Build #270 success; Database Package Tests #262 success; Beta 1 Emulator Tests #241 success; Project Memory Guard #114 success; Project Memory Quality #121 success; Project Memory Status #129 success. Current review findings covering active-controller Strict Effects, timer races, reduced-motion behavior, model-ready entrance timing, workflow safety and Buddy-care alt text were corrected/resolved; remaining old `LivingRudi3D` threads are superseded by deletion of that controller.
- Limitations: repository CI and code review do not prove perceptual foot contact, climb realism, occlusion quality, exact public ChatGPT Site synchronization or owner/device visual acceptance. The separately hosted `wellfit-bewegt` Site is not proven to contain merge `9ae4f278...`; Site version 105 belongs to the earlier renderer generation.
- Acceptance: IMPLEMENTED_NOT_VERIFIED
