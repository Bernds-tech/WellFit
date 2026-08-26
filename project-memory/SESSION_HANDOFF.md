# WellFit Session Handoff

Update this at the end of substantial work or whenever pausing at a non-obvious state.

## Current handoff
- Updated: 2026-08-26 Europe/Vienna
- Active focus: owner-approved one-screen mobile AR target is specified by `WFG-MOBILE-UX-001` / `WF-CONTRACT-MOBILE-SHELL-001` on PR #22; runtime remains unimplemented. Existing `WFG-VIS-001` canonical visual-baseline reconciliation remains separately open.
- Start here: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md`, `WELLFIT_MASTER_STATE.json`, `CONTRACT_REGISTRY.json`, `CROSS_REPO_DEPENDENCIES.json`, `INTEGRATION_GATES.json`, `CURRENT_STATE.md`, `STARTED_WORK.md`, `OPEN_LOOPS.md`, `WORK_LOCKS.md`.
- Product target: one persistent full-screen camera/AR world; small WellFit logo upper-left and three-line menu upper-right; Buddy care, missions, arenas, mayor/checkpoints and essential settings open as overlays; deeper configuration remains PC-first.
- Repository boundary: WellFit owns visuals; WellFit-now owns general technical mobile shell, data and server authority; WellFit-Buddy owns Buddy behavior/presentation and Buddy-specific AR/camera continuity.
- Exact completed result: PR #22 specifies the UX and registers WF-XDEP-007/WF-INT-006 without runtime mutation or capability claims.
- First unproven step: after contract merge, create the WellFit-now general shell implementation task and, only after `WFB-UNITY-EDITOR-RESOLVE-001`, the Buddy AR continuity/placeholder slice.
- Runtime blockers: WellFit-Buddy still lacks Unity editor package resolution/clean compile, Android build and device evidence; WF-INT-006 is TODO.
- Current visual truth: PR #2 remains a candidate only and must be reconciled before it becomes the canonical graphical implementation.
- Governance blocker: GitHub `main` is not remotely protected; continue branch+PR discipline until the owner resumes the deferred ruleset action.
- Falsification question: an existing accepted exact-version one-screen implementation or evidence that overlay navigation cannot preserve the active AR scene would require immediate reconciliation.

Future handoffs must record updated time, active IDs, exact last verified result, first unproven step, blockers/open loops, failed-attempt references, evidence/PR/commit references and any user input still required.
