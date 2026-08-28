# Started Work Register

Canonical register for work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## WFG-AVATAR-PUPPET-001
- Started: 2026-08-28
- Updated: 2026-08-28
- Status: IN_PROGRESS
- Risk: R2
- Scope: corrective visual target for visibly articulated Rudi/Buddy/avatar head/body pointer and CTA attention after owner live validation invalidated the whole-image approach.
- Branch/PR: WellFit coordination `codex/avatar-puppet-coordination-20260828` / PR pending; physical implementation `Bernds-tech/WellFit-now:codex/avatar-puppet-attention-20260828` / PR #389.
- Cross-repo lock: `XLOCK-WF-AVATAR-PUPPET-20260828`.
- Dependencies: `WF-XDEP-004`, current physical UI ownership drift and later actual ChatGPT Site source synchronization; no native Buddy runtime dependency for this web-only presentation behavior.
- Completed so far: live failure recorded by merged PR #25; old cross-repo attention lock superseded; new articulated cross-lock acquired; WellFit-now corrective Puppet branch/PR #389 created.
- Still open: exact PR #389 build/container/DB checks, runnable visual proof of independent head/body motion, final per-asset pivot tuning, then deliberate port/synchronization to the actual ChatGPT Site source and separate publication/visual acceptance.
- Exact next step: countercheck PR #389 technical gates and runnable landing preview; do not claim the public ChatGPT Site changed from GitHub code alone.
- Owner action needed: no implementation input; public Site replacement/publication remains a separate explicit visual release decision after preview.

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

## Closed / superseded work

## WFG-AVATAR-ATTN-001
- Started: 2026-08-26
- Superseded: 2026-08-28
- Status: SUPERSEDED
- Risk: R2
- Scope: initial whole-image pointer/focus attention behavior for Rudi and other WellFit web mascots/avatars.
- Branch/PR: WellFit merged PR #23; physical implementation WellFit-now merged PR #387; attempted closeout PR #388 closed unmerged.
- Result: technical whole-image transform code exists but owner live validation on the actual ChatGPT Site showed no visible movement and independent head articulation was not provided.
- Evidence: merged PR #25, WFG-CR-007, CTR-WFG-006, owner live validation 2026-08-28.
- Do not repeat: do not equate whole-image rotation with head tracking and do not infer public Site acceptance from GitHub CI.

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
