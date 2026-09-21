# Started Work Register

Canonical register for work that has started but is not yet fully completed.

## Rules
- Add an entry as soon as substantive work begins.
- Every active `IN_PROGRESS`, `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` or `RECONCILIATION_REQUIRED` task must appear here until closed or superseded.
- Assign `Risk: R1|R2|R3|R4` before implementation continues.
- Never delete history; close with status, date, result, evidence and next step.
- Cross-link Task ID, Change Request, PR/branch, dependencies, work lock and execution receipt.

## Active work

## WERK-IDEENWERK-PRIVACY-001
- Started: 2026-09-20 Europe/Vienna
- Closed: 2026-09-20
- Status: VERIFIED_STAGING
- Risk: R2
- Branch: `werk-v49-preview-host`
- Scope: Status-Token-protected citizen data export and auditable correction, deletion, restriction and cluster-appeal requests on the existing IDEENWERK status-token path.
- Result: implemented and independently evidenced through the existing receipts/CI/staging verification; deletion remains a review request, never an automatic hard delete.
- Evidence: `WERK_IDEENWERK_PRIVACY_001_RECEIPT.json`, later privacy-resolution/clarification receipts and current protected API contract.
- Follow-up: no rebuild. Reopen only on new contradictory evidence or a documented downstream integration dependency.

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

## WERK-IMPACT-FEEDBACK-001
- Started: 2026-09-21 10:18 Europe/Vienna
- Updated: 2026-09-21 14:19 Europe/Vienna
- Status: IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK
- Risk: R3
- Branch: `werk-v49-preview-host`
- Scope: bounded current-source impact-review feedback into the existing AI synthesis source snapshot/provider context; retain provenance, uncertainties and epistemic labels while preventing causal/political promotion.
- Upstream consumed: `WERK-IMPACT-001` is independently `COUNTERCHECKED_STAGING`; receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json`.
- Result: migration 044 `ideenwerk_impact_feedback`, feedback contract and provider/runner source-ref extension for `impact_review` are implemented on exact functional head `6d95b394d0869fb91562f6a84a13502469ef7869`; WERK Impact Feedback Check #1, WERK AI Synthesis Check #5, WERK Data Contract Registry Check #64, WERK Frontend Check #194 and IDEENWERK Backend Check #185 succeeded.
- Staging evidence: migration `20260921084055 ideenwerk_impact_feedback` is active; current-source review inclusion, non-current reference rejection, stale-registry fail-closed behavior, ACL boundaries, rollback and zero synthetic baseline are recorded in `project-memory/werk-builder-claims/WERK_IMPACT_FEEDBACK_2026-09-21T084933Z.json`.
- Provider boundary: external provider remains disabled; this task does not activate secrets, paid calls, live political generation or Production.
- Work lock: `LOCK-WERK-IMPACT-FEEDBACK-001` remains ACTIVE pending independent countercheck.
- Open loop/dependency: `WERK-LOOP-IMPACT-FEEDBACK-001` is `OPEN_AWAITING_INDEPENDENT_COUNTERCHECK`; `WERK-DEP-IMPACT-FEEDBACK-001` is `IMPLEMENTED_AWAITING_COUNTERCHECK`.
- Exact next step: independent Supervisor counterchecks the functional head, five green workflows and Staging evidence; only after that may lock/task/loop/dependency closeout occur. Do not rebuild or start another functional slice first.

## Closed / superseded work

### WERK-IMPACT-001 — counterchecked source-bound impact measurement
- Started: 2026-09-21 06:33 Europe/Vienna
- Closed: 2026-09-21 10:18 Europe/Vienna
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Branch: `werk-v49-preview-host`
- Scope: authoritative source-bound Soll/Ist measurement and review-only feedback contract separating forecast, implementation evidence, observation, arithmetic deviation and causal attribution hypothesis.
- Result: migrations 042/043 are independently counterchecked on Staging; map/reform/artifact/source-version tuples fail closed before persistence/replay; forecast/observation/arithmetic deviation/attribution/review semantics remain separated and append-only.
- Exact evidence: functional head `ceea9a8bce350529114258049a93ba1057dacbeb`; WERK Impact Measurement Check #6 and WERK Data Contract Registry Check #63 succeeded; live migration `20260921062817 werk_impact_authoritative_source_binding`; positive current tuple plus unknown-map/reform/artifact/stale-source negative paths; zero impact rows.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json`.
- Work lock: `LOCK-WERK-IMPACT-001` released in Builder closeout.
- Boundary: no real-world effect or causal attribution is claimed; no formula/political/provider change; Production/ACCEPTED is not implied.
- Next: do not rebuild. Consumed as upstream for `WERK-IMPACT-FEEDBACK-001`.

### WERK-AI-SYNTH-001 — bounded staging synthesis contract counterchecked
- Started: 2026-09-21 06:26 Europe/Vienna
- Closed: 2026-09-21 07:44 Europe/Vienna
- Status: COUNTERCHECKED_STAGING_BOUNDED_PROVIDER_DISABLED
- Risk: R3
- Branch: `werk-v49-preview-host`
- Scope: bounded source-bound multi-variant AI synthesis contract/provider adapter/status/V71 integration; no political ranking, automatic decision or manufactured fiscal effect.
- Result: migrations 040/041 are live; exact functional head `982fa7301bf13b2e2cf40be14e1f588874e77e4f` passed WERK AI Synthesis Check #3 and Data Contract Registry #61; Backend Check #176 passed on predecessor `4d3f63df43db446cd24c3c98304b1282acf61d9c`; RLS/ACL/source-snapshot/stale-revalidation/provenance/anti-ranking/anti-decision/anti-new-fiscal-effect boundaries were independently counterchecked; synthesis table is zero-row.
- Provider boundary: external provider remains disabled. No live AI-generated political variants, credential or paid provider is active; `WERK-DEP-AI-PROVIDER-001` remains BLOCKED.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T054427Z.json`.
- Work lock: `LOCK-WERK-AI-SYNTH-001` released; `WERK-LOOP-AI-SYNTH-001` closed for this bounded Staging scope.
- Boundary: overall `ai_synthesis` is not ACCEPTED/Production because target-bound provider generation remains unverified.
- Next: do not rebuild. A later provider activation is separately governed and requires target-bound verification.

### WERK-IDEENWERK-IMPACT-BRIDGE-001 — counterchecked staging bridge
- Started: 2026-09-20 22:31 UTC
- Closed: 2026-09-21 01:19 Europe/Vienna
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Branch: `werk-v49-preview-host`
- Scope: version-bound citizen/precheck → existing WERK reform/calculation reference bridge; no new fiscal calculation or political recommendation.
- Result: canonical registry + migration 037 + protected status/privacy export + V71 status reuse are independently counterchecked on Staging; stale source/registry versions fail closed and no-match remains explicitly non-complete.
- Exact evidence: functional evidence head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`; WERK Impact Bridge Check #3 and WERK Frontend Check #177 succeeded; Staging migration `20260920223436 ideenwerk_impact_bridge`; zero synthetic baseline restored.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T225510Z.json`.
- Work lock: `LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001` released in the same closeout.
- Boundary: no new fiscal effect, saving, cost, forecast, political score or automatic decision was created; production acceptance is not implied.
- Next: consumed by the counterchecked expert process; do not rebuild unless new contradictory evidence or an explicit downstream extension requires it.

### WERK-EXPERT-001 — counterchecked staging expert/affected-party evidence process
- Started: 2026-09-21 03:15 Europe/Vienna
- Closed: 2026-09-21 05:17 Europe/Vienna
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Branch: `werk-v49-preview-host`
- Scope: source-bound append-only expert/affected-party input with contributor role, relationship disclosure, optional separately sourced counterposition, citizen-safe projection, privacy export, aggregate content-free transparency and reuse of existing IDEENWERK/V71 surfaces.
- Result: independently counterchecked on Staging; write path remains service-role plus active `impact_reviewer`, direct anon/authenticated expert access fails closed, append-only guard is active, citizen projections exclude operator/idempotency/hash internals, and zero synthetic baseline is restored.
- Exact evidence: functional head `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`; WERK Expert Input Check #4, WERK Data Contract Registry Check #59 and WERK Frontend Check #182 succeeded; Staging migrations `20260921012806 ideenwerk_expert_input` and `20260921013039 expert_input_operator_index`.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T023924Z.json`.
- Work lock: `LOCK-WERK-EXPERT-001` released in the same Builder closeout.
- Boundary: no expert veto, political ranking/score, review-depth override, citizen-text mutation, automatic acceptance/rejection, manufactured fiscal effect, production deployment or live-browser visual acceptance is implied.
- Next: do not rebuild. `WERK-AI-SYNTH-001` is the next functional integration only after authoritative Finishline/Freshness/selector reconciliation consumes this countercheck.

### WERK-SEC-PGNET-001 — counterchecked staging boundary
- Status: COUNTERCHECKED_STAGING_BOUNDARY
- Closed from active work: 2026-09-20 22:13 UTC.
- Independent evidence: supervisor receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T221347Z.json`; live migration `20260920203116 pg_net_data_api_guard`; Backend Check #161 attempt 2 success; staging healthy/zero synthetic baseline.
- Residual production hardening remains in `WERK-LOOP-SEC-PGNET-001`; it is not active builder work for ordinary Staging feature continuation.

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
- Result: owner target, no-dashboard constraint, overlay navigation state, repository responsibilities and future exact integration gate are bound.
- Limitations: no visual runtime, Unity compile, Android build or device behavior is claimed.
- Evidence: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md`, WFG-CR-005, WFG-DEC-004 and WF-CONTRACT-MOBILE-SHELL-001.
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
- Evidence: remote 00bed9975f07435920fd02414a071467532f73a6; all 13 triggered workflows succeeded. See WERK_LABOUR_003_CI_RECEIPT.json and WERK_LABOUR_HANDOFF.md.
- Next: WERK-LAB-002 publication/verification is complete. Substantive matching gates remain open; no additional approval is pending for this completed change set.

## WERK-LAB-003
- Started: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Scope: close missing regional stock with official workbook and acquire occupation/education supply without inventing a joint distribution.
- Base: 8f6799f; LAB-002 verified and closed.
- Lock: LOCK-WERK-LAB-003
- Local result: 3072 occupation/state pairs, nine complete regional AL/OS stock sources, 21 negative cases and all dependent contracts passed.
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

## WERK-SV-004
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-004
- Lock: LOCK-WERK-SV-004
- Base: 97d2835439006bd157ef17d9e41b3fefc9cd8d4c
- Scope: standard employee annual assessment, source audit, dependent calculations and CI.

- WERK-SV-004 local: five workflow bodies passed, 36 annual-assessment + 55 SV + 42 general counterchecks. All four triggered remote workflows succeeded at 190e1940446205c4532ecef62c6d6f038a79cd01; WERK_SV_004_CI_RECEIPT.json.

## WERK-SV-005
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-005
- Lock: LOCK-WERK-SV-005
- Base: 35a71c20db0afcb00a9bb703f7f671cf7d3f05e4
- Scope: contribution-growth and debt-financing durability stress.

- WERK-SV-005: five relevant local workflow bodies passed; 28 growth, 55 SV, 36 assessment and 42 general counterchecks. All four triggered remote workflows succeeded at 21fbedb180f45823cbfeeb44fd326dfb4b7fdd09; WERK_SV_005_CI_RECEIPT.json.

## WERK-SV-006
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-006
- Lock: LOCK-WERK-SV-006
- Base: 340850e192d5434de18d28f2bbd1533cad3fbe2f
- Scope: official contribution-source reconciliation, calculations and contract.

- WERK-SV-006 verified at 25188b55f422ae204de2a495ae53d11338291607; all three triggered remote workflows succeeded; five relevant local workflow bodies passed. WERK_SV_006_CI_RECEIPT.json.

## WERK-SV-007
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-007
- Lock: LOCK-WERK-SV-007
- Scope: existing payroll/annual-assessment threshold calculations and fiscal contract.

- Verified at af98ba7d35af415f8c0a297c0cb3d5a98fa8f93a; all three triggered CI workflows succeeded; five local workflow bodies passed. WERK_SV_007_CI_RECEIPT.json.

## WERK-SV-008
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-008
- Lock: LOCK-WERK-SV-008
- Base: 52bf305f1193143a7cb38ffc27155393e62429df
- Scope: continuous ALV candidate calculations, provisional 2027 cohort references and fiscal integration.

- WERK-SV-008 local: all five relevant workflow bodies passed, independent interpolation and 360,072 cent increments passed; all three exact-commit remote workflows succeeded at 0c4c6626ed476271b9276d664c1d57b8ab1bd7a3; WERK_SV_008_CI_RECEIPT.json.

## WERK-SV-009
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-009
- Lock: LOCK-WERK-SV-009
- Base: d633a99dd22788715ea4f587235ed8e1d85d4bae
- Scope: official contribution distribution evidence and bounded population costing.

- WERK-SV-009: five relevant local workflow bodies passed; source and numerical counterchecks passed. All three exact-commit remote workflows succeeded at 1bc0bbc5423bd839e84e24cf2f8e0f0fbfcdce46; WERK_SV_009_CI_RECEIPT.json.

## WERK-SV-010
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-010
- Lock: LOCK-WERK-SV-010
- Base: 301346d28388deb194629c1f8c58ed5562eb0962
- Scope: interval/count/sum costing, administrative input specification and fiscal integration.
- Falsifier: a legal threshold inside a band invalidates mean-only costing, or statutory rate-assessment base differs from the charged base. Check boundaries and reject incompatible units/scope.

- Local: five relevant workflow bodies passed; independent interpolation over 3,600,018 cent payments, 114 interval extrema/sums, 18 aggregate reconciliations, 27 invalid inputs and 8 corruptions. All three triggered remote workflows succeeded at 6a663ffc573dcdb6b175e84c17bfc0d42f848ba3; WERK_SV_010_CI_RECEIPT.json.

## WERK-SV-011
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-011
- Lock: LOCK-WERK-SV-011
- Base: 4d2205024b1d147392553cfc3b5acb0b52e706fe
- Scope: six-year interest/primary-balance funding bridge and official deficit-debt adjustments.
- Falsifier: treating all interest as free while primary deficit persists, adding relief costs twice, or equating Maastricht surplus and debt reduction despite debt adjustments. Independent identities and invalid-input checks required.
- Local: five relevant workflow bodies passed; latest source-year clarification rechecked through funding contract and counterchecks. All three triggered remote workflows succeeded at 6ee07830cbb79bf4060847953c5a24077ef98cdc; WERK_SV_011_CI_RECEIPT.json.

## WERK-TAX-001
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-TAX-001
- Lock: LOCK-WERK-TAX-001
- Base: a7f8708b7955af5b485be0b2640e590d98d6bf28
- Scope: official ABB outcome/cash/cost reconciliation and incremental break-even.
- Falsifier: summed requests/assessments/fines falsely treated as cash, average office yield extrapolated to marginal reform, or existing government receipts credited twice. Check original, independent hand arithmetic and negative cases required.

- Exact implementation abcc4a3c577d52dcc0532f1ecbc05ad833479077: all four triggered workflows succeeded; WERK_TAX_001_CI_RECEIPT.json.

## WERK-SUB-001
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SUB-001
- Base: 4443331cfa0a20c5ec25d8f68193e3415babb9dd
- Lock: LOCK-WERK-SUB-001
- Falsifier: annual plus monthly values double counted, administration mixed into funding, missing account interpreted as discontinued program, or baseline reductions credited to WERK. Source reconciliation and negative checks required.

- Exact implementation 0d47fa44c378438bc2c760df954756d73ff900c0: all 13 triggered workflows succeeded; WERK_SUB_001_CI_RECEIPT.json.
