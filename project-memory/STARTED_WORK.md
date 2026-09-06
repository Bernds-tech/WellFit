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
- Status: VERIFIED
- Risk: R2
- Scope: GAP-LAB-01 subgates, verified regional/occupation evidence and labour data contract integrity on werk-v49-preview-host only.
- Starting evidence: b64294d; expanded labour check 33996097649 and policy check 33996225256 succeeded. Sites v53 is a separate older publication.
- Lock: LOCK-WERK-LAB-002
- Updated: 2026-09-06 UTC; publication blocker resolved after owner continuation approval.
- Evidence: remote 00bed9975f07435920fd02414a071467532f73a6; all 13 triggered workflows succeeded. See WERK_LABOUR_CI_RECEIPT.json and WERK_LABOUR_HANDOFF.md.
- Next: WERK-LAB-002 publication/verification is complete. Substantive matching gates remain open; no additional approval is pending for this completed change set.

## WERK-LAB-003
- Started: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Scope: close missing regional stock with official workbook and acquire occupation/education supply without inventing a joint distribution.
- Base: 8f6799f; WERK-LAB-002 is verified and closed.
- Lock: LOCK-WERK-LAB-003
- Local result: 3072 occupation/state pairs, nine complete regional AL/OS stock sources, 21 negative cases and all dependent local checks passed.
- Closed: 2026-09-06. Published implementation ece6767e5a4d4362f43c07a0ae7033b509de585a; all 13 CI workflows succeeded. See WERK_LABOUR_003_CI_RECEIPT.json.

## WERK-LAB-004
- Started: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Base: 22d67e9; LAB-003 verified.
- Lock: LOCK-WERK-LAB-004
- Scope: same-period education and working-time constraints with source reconciliation; qualification-by-occupation remains unproven.
- Local result: 189 education / 67 time-type rows, July residual explained but unallocated; 33 negative cases and dependent contracts pass. All 13 CI workflows passed at bc7152d31dc598738bd0f12a02e3bebc830f974d; WERK_LABOUR_004_CI_RECEIPT.json.

## WERK-LAB-005
- Started: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Base: cc67ee2; LAB-004 published and verified.
- Lock: LOCK-WERK-LAB-005
- Scope: source-backed working-time wishes and care constraints, preserving distinct populations/periods and blocked employment/fiscal effects.
- Local evidence: three pinned ODS sources; 48 wish, 39 reason, 20 childcare rows; 45 negative cases and dependent contracts pass. All 13 CI workflows passed at 5dbe5eedd1c3347e44cdce68ffb2725f78562fca; WERK_LABOUR_005_CI_RECEIPT.json.

## WERK-CALC-001
- Started: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-CALC-001
- Lock: LOCK-WERK-CALC-001
- Scope: konsolidierte Rechenstrecke mit 1/5/10-Jahren, Kosten, Gegenprüfung und CI.
- Closed: 2026-09-06. Implementation d876d9f91c1edadd505edff018e7377500dab0b3, three triggered CI workflows successful; WERK_CALCULATIONS_CI_RECEIPT.json.

## WERK-SV-001
- Status: VERIFIED
- Risk: R2
- Started: 2026-09-06
- Change: WERK-CR-SV-001
- Lock: LOCK-WERK-SV-001
- Scope: post-debt employee contribution reform and financial scenarios; WERK branch only.

- Verified: 2096e1cf402ad36968a3d57ffc74c7efc39eba83; all four triggered CI workflows succeeded. WERK_SV_CI_RECEIPT.json.

## WERK-SV-002
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-002
- Lock: LOCK-WERK-SV-002
- Scope: 15.5bn first stage, program and deterministic calculations.

- Verified: 7fc44e6d024bdfc5932f501224094a8d52f482cb; all four triggered workflows successful. WERK_SV_002_CI_RECEIPT.json.

## WERK-SV-003
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-003
- Lock: LOCK-WERK-SV-003
- Scope: coupled debt/interest/employee-relief calculation and revised program.

- Verified: 5ddea9fd186ea50fd2cde6438767f873acd5a20f; all four triggered workflows successful. WERK_SV_003_CI_RECEIPT.json.
