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

## WERK-LAB-002
- Started: 2026-09-05 UTC
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R2
- Scope: GAP-LAB-01 subgates, verified regional/occupation evidence and labour data contract integrity on werk-v49-preview-host only.
- Starting evidence: b64294d; expanded labour check 33996097649 and policy check 33996225256 succeeded. Sites v53 is a separate older publication.
- Lock: LOCK-WERK-LAB-002
- Next: obtain explicit publication approval after auto-review blocked the push, then confirm exact remote implementation CI. Local contracts/source reconciliation and ten negative checks passed at 869423f. See WERK_LABOUR_HANDOFF.md.
