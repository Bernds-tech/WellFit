# WellFit Task Ledger

Keep history append-only; supersede rather than delete.

## WFG-MEM-001
- Date: 2026-08-19
- Status: DONE
- Goal: Introduce durable project memory and duplicate-work prevention.
- Starting state: Visual/landing work existed without a dedicated micro-attempt/change-request ledger.
- Action: Added Project Memory Protocol v1, agent preflight and PR guard.
- Result: Operational execution memory established.
- Evidence: `AGENTS.md`, `project-memory/` and `.github/workflows/project-memory-guard.yml`.
- Next step: Extend this system rather than create a competing ledger.
- Do not repeat: Extend this system; do not create a competing ledger.

## WFG-MEM-005
- Date: 2026-08-19
- Status: ACCEPTED
- Risk: R3
- Goal: Complete V2-V5 Project Memory governance for the visual/UI repository.
- Action: Added open-loop/dependency/evidence/session-handoff controls, standing authorizations/status automation, mandatory preflight/countercheck execution policy, STARTED_WORK, WORK_LOCKS, EXECUTION_RECEIPTS, ASSUMPTIONS, CONTRADICTIONS and QUALITY_CONTROL with Risk R1-R4, completion quorum, evidence freshness, negative/fail-closed paths, scope-diff guard, rollback/recovery proof, falsification and milestone closeout.
- Result: V5 governance is merged to main.
- Evidence: merged Project Memory governance on main plus `project-memory/CHAT_RECONCILIATION_2026-08-19.md`.
- Next step: Use V5 automatically for future visual/UI work and keep unrelated/open visual PRs separate until their own evidence is green.
- Do not repeat: Do not infer product-feature completion merely because governance is installed.

## WFG-VIS-001
- Date: 2026-08-15 to 2026-08-20
- Status: RECONCILIATION_REQUIRED
- Risk: R2
- Goal: Establish the canonical WellFit graphical/landing/UI baseline in `Bernds-tech/WellFit` without duplicating technical or Buddy implementation.
- Starting state: PR #2 imported the existing WellFit landing/visual world, while PR #1 contains an unrelated flavor/size/subscription product concept; current product UI is still largely in WellFit-now.
- Action: PR #2 implemented a graphical candidate baseline with responsive landing, product worlds and visual-only auth previews.
- Result: substantive visual implementation exists. Fresh GitHub metadata on 2026-08-20 reports PR #2 as **draft and mergeable**, but it is based on an older main and has no current exact-head Actions evidence. It remains unaccepted.
- Evidence: PR #2 head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`; current GitHub PR metadata; zero Actions runs on that exact head; `WELLFIT_MASTER_STATE.json`.
- Negative/countercheck path: PR #1 is explicitly excluded as incorrect product scope; PR #2 must be checked against current technical/Buddy capability so graphics cannot promise unsupported behavior. `mergeable=true` is not acceptance evidence.
- Exact next step: inventory PR #2/current main/current WellFit-now visual sources; classify KEEP/REPLACE/MIGRATE_LATER/OBSOLETE; then rebase or rebuild only the selected graphical delta and run current CI/browser checks.
- Do not repeat: Do not start a third parallel landing implementation before this reconciliation is complete.

## WFG-RECON-20260820
- Date: 2026-08-20
- Status: VERIFIED
- Risk: R2
- Goal: Reconcile Project Memory against current PR/main/cross-repo state.
- Result: detected missing active-work records, stale PR #1, stale branch-protection enforcement, and over-broad Buddy/mobile ownership wording; registers were corrected. A later same-day countercheck corrected one stale PR #2 mergeability claim while preserving its unaccepted state.
- Evidence: current main/PR/branch metadata and current Project Memory files.
- Falsification question: What observation would prove this reconciliation wrong? A newer accepted visual baseline or current CI/owner acceptance bound to a different exact revision would supersede WFG-VIS-001 and must be recorded before further implementation.
- Next step: keep WFG-VIS-001 open until PR #2 is reconciled against current main and receives exact-head visual/CI evidence.

## WFG-MASTER-MIG-002-RECON
- Date: 2026-08-26
- Status: COUNTERCHECKED
- Risk: R3
- Goal: reconcile the V9 program master to the exact merged WF-MIG-002 source baseline and select the bounded next migration step.
- Starting state: master memory overstated the WellFit-now directory as a real Unity project and still described WellFit-Buddy as governance-only.
- Action: aligned repository physical state, dependencies, Buddy contract evidence, integration gates, convergence plan/ledger and master next action to the exact source and merged Buddy evidence.
- Result: `WF-MIG-002` is `IN_PROGRESS` with decision `MIGRATE_NOW` limited to a fresh version-pinned destination and incremental reviewed Buddy-domain ports.
- Evidence: WellFit-Buddy PR #18, PR #19, main `48405aad8489c03d68f58526867eb14bb4458823`, exact WellFit-now source commit `447093decd783b33a6e724170dbe4667e899348b` and WF-EV-005.
- Negative/fail-closed path: no wholesale copy, source deletion, server-authority transfer, build claim or device claim.
- Rollback/recovery: preserve WellFit-now source unchanged; revert the bounded destination or this master PR if any acceptance gate fails.
- Falsification question: a complete compile-ready Unity project at the exact source commit, or a destination runtime/build/device acceptance already present on a different exact revision, would invalidate this state and require immediate reconciliation.
- Next step: fresh Project Memory CI/review, merge, then acquire a Buddy-local R3 implementation lock for the genuine Unity 6.3 LTS destination.


## WFG-MOBILE-UX-001
- Date: 2026-08-26
- Status: COUNTERCHECKED
- Risk: R3
- Goal: bind the owner-approved one-screen mobile AR shell as the canonical cross-repository UX contract without claiming an implemented runtime.
- Starting state: mobile routes and Buddy/backend foundations exist, but no accepted cross-repository one-screen AR shell contract or exact implementation exists.
- Action: added the canonical UX specification and registered its graphical, technical/server and Buddy-domain responsibilities.
- Result: the target UX, ownership split, dependency and exact future integration gate are bound without changing runtime code or claiming implementation.
- Evidence: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md`, WFG-CR-005, WFG-DEC-004 and WF-CONTRACT-MOBILE-SHELL-001.
- Negative/fail-closed path: no client reward/mission authority, no fabricated Unity compile/build/device claim, no permanent dashboard/bottom navigation and no AR reset on ordinary menu navigation.
- Rollback/recovery: revert this specification branch; existing runtime repositories remain unchanged.
- Countercheck: Project Memory Guard and Quality passed on PR #22; the diff contains specification/governance only and preserves the Unity editor/server-authority gates.
- Falsification question: an existing accepted exact-version one-screen mobile implementation, or evidence that ordinary overlay navigation must recreate the AR scene, would require this contract to be reconciled.
- Next step: merge after fresh Status/review, then hand off separate implementation slices to WellFit-now and WellFit-Buddy after their prerequisites.

## WFG-AVATAR-ATTN-001
- Date: 2026-08-26
- Status: COUNTERCHECKED
- Risk: R2
- Goal: make Rudi and other WellFit web mascots/avatars attentively follow the pointer and look toward hovered/focused controls such as login/register while preserving graphical and technical authority boundaries.
- Starting state: current qualifying mascot/avatar images were static; current web UI physically resides in WellFit-now; public Sites-v71 is a separate visual candidate checkout.
- Action: WellFit-now PR #387 added the global web `AvatarAttentionSystem`; WellFit PR #23 recorded the graphical task, cross-repo lock, open loop and evidence boundary.
- Result: WellFit-now PR #387 final head `3a6bdfb43e1f613614301eb5f9952071ecf79202` passed Build #1194, Container Build #179, DB #171 and Project Memory checks and merged as `f687d2ba7c7bc46450301b9c92dbc0845feffa5f`; WellFit PR #23 final head `964537c92cee439f99e3605e339e10923294f6f4` passed Guard/Quality/Status and merged as `e760ac6c2394770eed698c95139765fa5479d5da`.
- Evidence: WellFit-now PR #387; WellFit PR #23; `RECEIPT-WFN-AVATAR-ATTN-20260826`; `RECEIPT-WFG-AVATAR-ATTN-20260826`.
- Negative/fail-closed path: no backend/auth/navigation semantics, mission/reward/economy authority, camera/location or Unity/native behavior changed; motion is disabled for coarse pointers/reduced-motion clients.
- Rollback/recovery: revert merged PRs #387 and #23; no data/state migration exists.
- Falsification question: a transform-composition visual regression, a missed qualifying avatar, or a different canonical/Sites source requires reconciliation before visual acceptance.
- Next step: keep `WF-LOOP-005` open for runnable graphical preview/browser evidence and deliberate Sites-v71 synchronization; the implementation/cross-repo lock is released.
