# Started Work Register

Canonical register for work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## WFG-AVATAR-ATTN-001
- Started: 2026-08-26
- Updated: 2026-08-26
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R2
- Scope: owner-requested pointer/focus attention behavior for Rudi and other WellFit web mascots/avatars.
- Branch/PR: WellFit master record `codex/avatar-attention-master-20260826` / PR pending; physical implementation `Bernds-tech/WellFit-now:codex/avatar-attention-20260826` / PR pending.
- Cross-repo lock: `XLOCK-WF-AVATAR-ATTN-20260826`.
- Dependencies: `WF-XDEP-004`, current graphical ownership drift, later `WF-MIG-001` convergence; no native Buddy runtime dependency is required for this web-only visual behavior.
- Completed so far: WellFit-now contains a global client attention layer that auto-detects existing Buddy/Rudi/avatar images, follows fine-pointer input, prioritizes interactive element centers such as login/register CTAs, adds a subtle pointer-down pulse and keyboard-focus attention, and disables motion for reduced-motion/coarse-pointer clients.
- Still open: exact implementation PR CI/build/lint evidence, browser/preview countercheck, separate Sites-v71 synchronization, final visual acceptance and postflight reconciliation.
- Evidence so far: WellFit-now branch commits `15347fa7e451976afe8f59400ac9978394608046` and `5c88cb9f9f8421ed6fa7ed2647ea4edd46329855` plus local task/memory commits on the same branch.
- Exact next step: open both PRs, run current CI/diff checks, fix any branch failures, then obtain runnable preview/browser evidence before any visual acceptance claim.
- Owner action needed: none for implementation; owner visual acceptance remains separate after preview evidence.

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

## WFG-MOBILE-UX-001
- Started: 2026-08-26
- Closed: 2026-08-26
- Status: COUNTERCHECKED
- Risk: R3
- Scope: canonical one-screen camera/AR mobile UX contract and cross-repository responsibility mapping; no runtime implementation.
- Branch/PR: `codex/wf-mobile-one-screen-ar-shell-20260826` / PR #22.
- Work lock: `LOCK-WFG-MOBILE-UX-001` released.
- Cross-repo lock: `XLOCK-WF-MOBILE-SHELL-001` released.
- Result: owner target, no-dashboard constraint, overlay navigation state, repository responsibilities and future exact-device integration acceptance are bound.
- Limitations: no visual runtime, Unity compile, Android build or device behavior is claimed.
- Evidence: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md`, WF-EV-006 and green Guard/Quality on PR #22.
- Next step: implement separately in WellFit-now and WellFit-Buddy after their repository prerequisites; keep WF-LOOP-004 open until exact E2E acceptance.

## WFG-MASTER-MIG-002-RECON
- Started: 2026-08-26
- Closed: 2026-08-26
- Status: COUNTERCHECKED
- Risk: R3
- Scope: reconcile V9 master claims and the WF-MIG-002 decision to the exact merged WellFit-Buddy baseline.
- Branch/PR: `codex/wf-mig-002-master-reconcile-20260826` / PR #20.
- Cross-repo lock: `XLOCK-WF-MIG-002-20260826` released.
- Result: stale Unity-project claims corrected; `MIGRATE_NOW` bounded to fresh destination initialization and incremental Buddy-domain ports while source/server authority remain preserved.
- Evidence: WF-EV-005, merged Buddy PRs #18/#19 and green Quality/Status checks on PR #20 before final closeout.
- Next step: merge after final green Guard/review, then begin the separately locked Unity destination task.