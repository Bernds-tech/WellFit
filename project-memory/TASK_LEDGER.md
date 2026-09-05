# WellFit Task Ledger

Keep history append-only; supersede rather than delete.

## WFG-MEM-001
- Date: 2026-08-19
- Status: DONE
- Goal: Introduce durable project-memory and duplicate-work prevention.
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
- Falsification question: an existing accepted exact-version one-screen implementation, or evidence that ordinary overlay navigation must recreate the AR scene, would require this contract to be reconciled.
- Next step: merge after fresh Status/review, then hand off separate implementation slices to WellFit-now and WellFit-Buddy after their prerequisites.

## WFG-AVATAR-ATTN-001
- Date: 2026-08-26
- Status: SUPERSEDED
- Risk: R2
- Goal: initial whole-image pointer/focus attention for Rudi and other web mascots/avatars.
- Action: coordinated WellFit-now PR #387 and recorded the bridge in WellFit PR #23.
- Result: technical whole-image code merged, but owner live validation on 2026-08-28 showed no visible movement on the actual ChatGPT Site and no accepted independent head articulation. Closeout PR #388 was closed unmerged as superseded.
- Evidence: merged PR #25, WFG-CR-007, CTR-WFG-006, owner live validation 2026-08-28.
- Negative/countercheck path: do not infer public Site completion from GitHub CI and do not accept whole-image rotation as head tracking.
- Rollback/recovery: preserved as historical evidence only; corrective work continues under WFG-AVATAR-PUPPET-001.
- Next step: use articulated corrective task only.

## WFG-AVATAR-PUPPET-001
- Date: 2026-08-28 to 2026-08-29
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R2
- Goal: visibly articulate Rudi/Buddy/avatar head and body toward pointer and priority controls, then port the verified behavior to the actual ChatGPT Site source without altering the public Site until deliberate visual release.
- Starting state: public Site live validation invalidated the previous whole-image approach; current physical web code remains in WellFit-now and the actual ChatGPT Site source is a separate editable surface.
- Action: coordinated the articulated Puppet implementation in WellFit-now with separate head/body layers from transparent PNGs, per-asset pivots, head-led attention, delayed torso lean, click nod, idle breathing, reduced-motion/coarse-pointer fallback, and explicit Landing-Hero Luma calibration.
- Result: exact implementation head `f2b2bdb89655bea3398687a35540704b091672d7` passed Build #1198, Container Build #183, Database Package Tests #175 and Project Memory Guard/Quality/Status; normal PR #390 merged to WellFit-now main as `d374e4db4777406d93a8aad72adc10ab47db216f`. The public ChatGPT Site remains unchanged and therefore this task is not visually verified/accepted.
- Evidence: merged WellFit PR #25; WFG-CR-007; CTR-WFG-006; WellFit-now PR #390 and merge `d374e4db4777406d93a8aad72adc10ab47db216f`.
- Negative/fail-closed path: no backend/auth/navigation semantics, mission/reward/economy authority, camera/location or Unity/native behavior changed; GitHub implementation is not itself a ChatGPT Site publish.
- Rollback/recovery: revert WellFit-now merge if the renderer proves visually defective; original PNG assets and public Site remain unchanged.
- Falsification question: a preview of the actual `wellfit-bewegt` Site that still shows no movement, seams/ghosting, wrong head crop or layout stacking regression requires further Site-specific tuning before publication.
- Next step: open the actual Site via ChatGPT Sites/Edit so it is referenced in the composer, port the verified renderer/pivots, review the exact preview, then deliberately publish the updated version.

## WFG-RUDI-WORLD-001
- Date: 2026-09-05
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R2
- Goal: make Rudi a physically grounded resident of the Landingpage rather than a viewport-following overlay: climb and stand on real page surfaces, scroll with the exact surface, leave the viewport with it and return only through a plausible visible route.
- Starting state: WellFit-now PR #401 contained a real rigged 3D Rudi but owner live review rejected the viewport-clamped/catch-up model because Rudi appeared detached from the page and could effectively float relative to content.
- Action: accepted WFG-CR-008 and consolidated the active runtime around DOM-surface authority. Individual `WellFit` letters expose anchors; `hero-wellfit-4` (the `F`) is the initial climb/podium; headings/cards/buttons/signs/lines expose surfaces; Rudi reads real DOM geometry each frame; no viewport clamp is applied; scroll catch-up waits until the current surface is fully offscreen and scroll has settled; catch-up and autonomous transitions use visible walk/climb routes. The parallel viewport/chapter controller was removed. Active runtime was hardened for Strict Effects, shared timer cancellation, model-ready entrance timing, reduced motion, mobile non-mount, Canvas pointer pass-through and GLTF fallback. Meshy materialization/generation workflows were also hardened.
- Result: WellFit-now PR #401 exact head `54186ec16a617549acbaa0437b0b81ab36ee2abb` passed Build #1285, Container #270, Database #262, Beta Emulator #241 and Project Memory Guard/Quality/Status, then squash-merged to WellFit-now main as `9ae4f278a90d17d612f0399c40babd32c344e02b`.
- Evidence: WF-EV-007, WFG-CR-008. `XLOCK-WF-RUDI-WORLD-20260905` is released after the runtime merge.
- Negative/fail-closed path: no backend/auth/data/mission/reward/economy/location/camera/native runtime changes; no claim that GitHub modifies the separate public ChatGPT Site; no acceptance from CI alone. Site version 105 is historical older-renderer evidence only.
- Rollback/recovery: revert WellFit-now merge `9ae4f278...` if the runtime proves defective; the public Site remains separately deployable and was not modified by this merge.
- Falsification question: any exact public-Site preview showing visible hovering, footing detached from the DOM element, Rudi remaining onscreen after his bound surface has left, unexplained teleportation, air-climbing, foreground/header occlusion, broken CTA interaction or failed reduced-motion fallback invalidates acceptance and requires Site/runtime tuning.
- Next step: synchronize merged WellFit-now main `9ae4f278a90d17d612f0399c40babd32c344e02b` into the exact editable `wellfit-bewegt` Site source, preview the real WebGL behavior and obtain owner/device visual acceptance before deliberate publication.
