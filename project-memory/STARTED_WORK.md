# Started Work Register

Canonical register for work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## WFG-RUDI-WORLD-001
- Started: 2026-09-05
- Updated: 2026-09-05
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R2
- Scope: graphical authority and cross-repository coordination for Rudi Rastlos as a physically grounded resident of the public Landingpage: DOM-bound footing, letter/surface climbing, surface-relative scrolling, front/back layering and visible catch-up routes. No backend, auth, mission/reward, economy, location/camera or native Buddy authority changes.
- Branch/PR: WellFit coordination `codex/rudi-living-world-coordination-20260905`; physical implementation `Bernds-tech/WellFit-now` PR #401 on `codex/rudi-3d-living-avatar-20260905`.
- Work lock: `LOCK-WFG-RUDI-WORLD-001`.
- Cross-repo lock: `XLOCK-WF-RUDI-WORLD-20260905`.
- Dependencies: current physical UI ownership drift under `WF-MIG-001`, graphical/Buddy presentation boundary `WF-CONTRACT-BUDDY-001`, and exact public ChatGPT Site synchronization for visual acceptance.
- Completed so far: owner live direction superseded viewport-clamped behavior; the active WellFit-now controller binds Rudi to real DOM surfaces through `getBoundingClientRect()`, uses the `F` in `WellFit` as initial climb/podium, allows Rudi to leave the viewport with the bound element, chooses a new visible surface only after the old surface is completely offscreen and scroll has settled, renders a visible route guide for catch-up climbing, keeps CTA gaze separate from locomotion, and exposes a machine-identifiable `data-rudi-world="dom-surface-bound"` mode. Exact WellFit-now head `0240d7542d5451ab052743b605275a5cae895f7a` passed Build #1260, Container #245, Database #237, Beta Emulator #216 and all Project Memory gates.
- Still open: no direct visual acceptance on the exact public `wellfit-bewegt` Site for the DOM-bound version; the public Site source is a separate editable/publishable surface and is not changed by the GitHub PR. Additional route/geometry invariants can still be hardened before synchronization.
- Exact next step: make the physical route rules more deterministic and machine-testable, update stale WellFit-now memory/PR wording, then synchronize the exact verified source to the public Site when that editable Site context is available and perform owner/device visual acceptance.
- Owner action needed: none for repository hardening. Direct Site visual acceptance remains required after exact Site synchronization.

## WFG-AVATAR-PUPPET-001
- Started: 2026-08-28
- Updated: 2026-08-29
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R2
- Scope: corrective visual target for visibly articulated Rudi/Buddy/avatar head/body pointer and CTA attention after owner live validation invalidated the whole-image approach.
- Branch/PR: WellFit coordination `codex/avatar-puppet-coordination-20260828`; physical implementation merged through `Bernds-tech/WellFit-now` PR #390.
- Cross-repo lock: `XLOCK-WF-AVATAR-PUPPET-20260828` released after technical merge; Site visual loop remains open.
- Dependencies: `WF-XDEP-004`, current physical UI ownership drift and actual ChatGPT Site source synchronization; no native Buddy runtime dependency for this web-only presentation behavior.
- Completed so far: live failure recorded by merged WellFit PR #25; old whole-image attention path superseded; articulated head/body Puppet renderer implemented in WellFit-now; exact head `f2b2bdb89655bea3398687a35540704b091672d7` passed Build #1198, Container Build #183, Database Package Tests #175 and Project Memory Guard/Quality/Status; PR #390 merged to WellFit-now main as `d374e4db4777406d93a8aad72adc10ab47db216f`.
- Still open: the actual public ChatGPT Site `wellfit-bewegt` is a separate Sites source and still lacks this Puppet behavior. It must be opened via ChatGPT Sites/Edit so the Site is referenced in the composer, then the verified renderer/pivots must be ported, previewed on that exact Site and deliberately published.
- Exact next step: load the editable ChatGPT Site source; do not perform another GitHub-only substitute and do not claim the public Site changed from the WellFit-now merge.
- Owner action needed: only the product UI handoff that loads the Site into an editable composer; after that the implementation can be applied without new product decisions.

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
