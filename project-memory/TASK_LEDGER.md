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
- Falsification question: an existing accepted exact-version one-screen mobile implementation, or evidence that ordinary overlay navigation must recreate the AR scene, would require this contract to be reconciled.
- Next step: merge after fresh Status/review, then hand off separate implementation slices to WellFit-now and WellFit-Buddy after their prerequisites.

## WFG-AVATAR-ATTN-001
- Date: 2026-08-26
- Status: SUPERSEDED
- Risk: R2
- Goal: initial whole-image pointer/focus attention for Rudi and other web mascots/avatars.
- Action: coordinated WellFit-now PR #387 and recorded the bridge in WellFit PR #23.
- Result: technical whole-image code merged, but owner live validation on 2026-08-28 showed no visible movement on the actual ChatGPT Site and no accepted independent head articulation. Closeout PR #388 was closed unmerged as superseded.
- Evidence: merged WellFit PR #25, WFG-CR-007, CTR-WFG-006, owner live validation 2026-08-28.
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

## WERK-LAB-002
- Date: 2026-09-05 UTC
- Status: VERIFIED
- Risk: R2
- Scope: WERK labour data/validation on werk-v49-preview-host only.
- Result: nine GAP-LAB-01 subgates, 452 source-reconciled occupation-region rows, regional missing-value repair and ten negative-path checks. No estimated reform effect.
- Recovery: revert bounded WERK commit; unrelated WellFit/Sites/runtime work unchanged.
- Updated: 2026-09-06 UTC; publication blocker resolved after owner continuation approval.
- Evidence: remote 00bed9975f07435920fd02414a071467532f73a6; all 13 triggered workflows succeeded. See WERK_LABOUR_CI_RECEIPT.json and WERK_LABOUR_HANDOFF.md.
- Next: WERK-LAB-002 publication/verification is complete. Substantive matching gates remain open; no additional approval is pending for this completed change set.

## WERK-LAB-003
- Date: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Result: 3072 monthly occupation/state pairs and complete source-backed regional AL/OS stocks; 21 fault-injection cases and dependent local contracts pass.
- Evidence: WERK_LABOUR_HANDOFF.md and WERK_LABOUR_003_CI_RECEIPT.json; all 13 CI workflows passed at ece6767e5a4d4362f43c07a0ae7033b509de585a.
- Recovery: revert bounded LAB-003 change set.

## WERK-LAB-004
- Date: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Result: source-backed regional education and vacancy time; July 869 explained as XX, unallocated; joint matching and feasible hours blocked.
- Evidence: WERK_LABOUR_HANDOFF.md; source imports, 33 negative cases and dependent contracts pass locally. All 13 CI workflows passed at bc7152d31dc598738bd0f12a02e3bebc830f974d; WERK_LABOUR_004_CI_RECEIPT.json.
- Recovery: revert bounded LAB-004 changes on existing WERK branch.

## WERK-LAB-005
- Date: 2026-09-06
- Status: VERIFIED
- Risk: R2
- Result: survey working-time wishes/availability and parttime reasons, childcare opening categories; displayed precision and uncertainty preserved, feasibility effects blocked.
- Evidence: WERK_LABOUR_HANDOFF.md; source re-extraction and 45 negative cases plus dependent contracts passed. All 13 CI workflows passed at 5dbe5eedd1c3347e44cdce68ffb2725f78562fca; WERK_LABOUR_005_CI_RECEIPT.json.
- Recovery: revert bounded LAB-005 changes on existing WERK branch.

## WERK-CALC-001
- Status: VERIFIED
- Change: WERK-CR-CALC-001
- Risk: R2
- Branch: werk-v49-preview-host
- Evidence: WERK_CALCULATIONS_HANDOFF.md; reproducible report and 42 countercheck cases.
- Remote evidence: d876d9f91c1edadd505edff018e7377500dab0b3, Fiscal/Registry/Frontend success; WERK_CALCULATIONS_CI_RECEIPT.json.

## WERK-SV-001
- Status: VERIFIED
- Change: WERK-CR-SV-001
- Risk: R2
- Evidence: WERK_SV_HANDOFF.md; WERK_SV_CI_RECEIPT.json.
- Verified: 2096e1cf402ad36968a3d57ffc74c7efc39eba83; all four triggered CI workflows succeeded. WERK_SV_CI_RECEIPT.json.

## WERK-SV-002
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-002
- Result: 15.5bn annual gross contribution relief first stage after debt freedom; distribution and indexation open; no automatic full abolition.
- Evidence: WERK_SV_HANDOFF.md; WERK_SV_002_CI_RECEIPT.json.
- Verified: 7fc44e6d024bdfc5932f501224094a8d52f482cb; all four triggered workflows successful. WERK_SV_002_CI_RECEIPT.json.

## WERK-SV-003
- Status: VERIFIED
- Change: WERK-CR-SV-003
- Risk: R2
- Result: progressive 50% goal, realized-interest financing and coupled debt paths; actual target financing open.
- Evidence: WERK_SV_HANDOFF.md; WERK_SV_003_CI_RECEIPT.json.
- Verified: 5ddea9fd186ea50fd2cde6438767f873acd5a20f; all four triggered workflows successful. WERK_SV_003_CI_RECEIPT.json.

## WERK-SV-004
- Status: VERIFIED
- Task: add bounded final annual assessment to employee SV-01 calculation; preserve funding and household gates.
- WERK-SV-004 local: five workflow bodies passed, 36 annual-assessment + 55 SV + 42 general counterchecks. All four triggered remote workflows succeeded at 190e1940446205c4532ecef62c6d6f038a79cd01; WERK_SV_004_CI_RECEIPT.json.

## WERK-SV-005
- Status: VERIFIED
- Task: nominal-growth stress and durable financing check for progressive employee relief.
- WERK-SV-005: five relevant local workflow bodies passed; 28 growth, 55 SV, 36 assessment and 42 general counterchecks. All four triggered remote workflows succeeded at 21fbedb180f45823cbfeeb44fd326dfb4b7fdd09; WERK_SV_005_CI_RECEIPT.json.

## WERK-SV-006
- Status: VERIFIED
- Task: reconcile official employee contribution financing by payer and system, retain unproven reform-scope gates.
- WERK-SV-006 verified at 25188b55f422ae204de2a495ae53d11338291607; all three triggered remote workflows succeeded; five relevant local workflow bodies passed. WERK_SV_006_CI_RECEIPT.json.

## WERK-SV-007
- Status: VERIFIED
- Task: calculate ALV threshold net losses, recovery gross and 50%-cut effects with source-backed 2026 rules.
- Verified at af98ba7d35af415f8c0a297c0cb3d5a98fa8f93a; all three triggered CI workflows succeeded; five local workflow bodies passed. WERK_SV_007_CI_RECEIPT.json.

## WERK-SV-008
- Status: VERIFIED
- R2; unadopted ALV transition candidates and separate provisional 2027 cohort references; source and independent counterchecks required.
- WERK-SV-008 local: all five relevant workflow bodies passed, independent interpolation and 360,072 cent increments passed; all three exact-commit remote workflows succeeded at 0c4c6626ed476271b9276d664c1d57b8ab1bd7a3; WERK_SV_008_CI_RECEIPT.json.

## WERK-SV-009
- Status: VERIFIED
- R2; retrieve official contribution distributions, distinguish observation units and years, calculate only supported population bounds.
- WERK-SV-009: five relevant local workflow bodies passed; source and numerical counterchecks passed. All three exact-commit remote workflows succeeded at 1bc0bbc5423bd839e84e24cf2f8e0f0fbfcdce46; WERK_SV_009_CI_RECEIPT.json.

## WERK-SV-010
- Status: VERIFIED
- Risk: R2
- Change: WERK-CR-SV-010
- Scope: interval-based ALV bounds and exact affine sums, with administrative scope gates.
- Local: five relevant workflow bodies passed; independent interpolation over 3,600,018 cent payments, 114 interval extrema/sums, 18 aggregate reconciliations, 27 invalid inputs and 8 corruptions. All three triggered remote workflows succeeded at 6a663ffc573dcdb6b175e84c17bfc0d42f848ba3; WERK_SV_010_CI_RECEIPT.json.

## WERK-SV-011
- Status: VERIFIED
- Risk: R2
- Scope: interest-financing and deficit-debt reconciliation.
- Local: five relevant workflow bodies passed; latest source-year clarification rechecked through funding contract and counterchecks. All three triggered remote workflows succeeded at 6ee07830cbb79bf4060847953c5a24077ef98cdc; WERK_SV_011_CI_RECEIPT.json.

## WERK-TAX-001
- Status: VERIFIED
- Change: WERK-CR-TAX-001
- Scope: additional enforcement cash and costs; verified financing remains zero.
- Exact implementation abcc4a3c577d52dcc0532f1ecbc05ad833479077: all four triggered workflows succeeded; WERK_TAX_001_CI_RECEIPT.json.

## WERK-SUB-001
- Status: VERIFIED
- Risk: R2
- Scope: account-level source normalization and subsidy review bridge. No verified extra funding.
- Exact implementation 0d47fa44c378438bc2c760df954756d73ff900c0: all 13 triggered workflows succeeded; WERK_SUB_001_CI_RECEIPT.json.

## WERK-AUTONOMY-LOOP-001
- Date: 2026-09-20
- Status: VERIFIED_CODE
- Risk: R1
- Goal: turn autonomous builder + independent supervisor into one closed documented WERK execution loop without creating a competing task system.
- Action: added `project-memory/WERK_AUTONOMY_PROTOCOL.md` and `werk-data/werk-autonomy-contract.json`; builder/supervisor schedules now reconcile existing Project Memory, verified receipts, dependencies, locks, open loops and next action before proceeding.
- Reconciliation result: stale WERK privacy Started Work/lock closed; outdated existing-measure next action superseded; first connection-sweep gap recorded as `WERK-DEP-IDEENWERK-IMPACT-001` / `WERK-LOOP-IMPACT-BRIDGE-001`.
- Next step: builder implements the derived citizen/cluster → existing reform/calculation impact bridge; supervisor independently counterchecks the claim and feeds the next cycle.
- Do not repeat: do not create a second WERK TODO/roadmap ledger; extend the existing Project Memory registers.

## WERK-GOV-001
- Date: 2026-09-20
- Status: COUNTERCHECKED
- Risk: R3
- Goal: Reconcile the WERK-specific autonomous control plane so WERK is not steered by historical WellFit selectors or ambiguous evidence ownership.
- Starting finding: independent WERK Supervisor recorded `CTR-WERK-GOV-001` after the first closed-loop audit.
- Scope: WERK-specific Finishline, Next-Best-Actions, Supervisor State, Evidence TTL/Freshness, Owner Actions, automation roles, system graph and shared selector routing only.
- Result: shared `NEXT_BEST_ACTION.md` is WERK-first; historical WellFit selector content is explicitly non-authoritative for WERK; WERK-GOV-001 is registered; evidence-freshness/finishline/supervisor write authority is explicit in `WERK_AUTOMATION_ROLES.json` schema v2 and `werk-autonomy-contract.json` v4.
- Countercheck evidence: WERK Frontend Check #174 succeeded on exact functional governance head `242893c2fcc322424d7b6fb4cc97a0e87ea90a6e`; current pre-audit head `0b4ced1086a0b6b46ea16e9f12bc3e3d38997aca` is one audit-only supervisor-state commit ahead. Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T201023Z.json`.
- Next step: consume this completion by treating `WERK-IDEENWERK-IMPACT-BRIDGE-001` as the functional next action, subject to higher-priority active security findings such as `CTR-WERK-SEC-PGNET-ACL-001`.
- Do not repeat: do not create a second WERK task system or allow WellFit finishline/owner files to steer WERK.

## WERK-SEC-PGNET-001
- Date: 2026-09-20
- Status: COUNTERCHECKED_STAGING_BOUNDARY
- Risk: R3
- Goal: Harden the WERK Staging Data-API request boundary around hosted Supabase `pg_net` without unsafe extension surgery.
- Result: Migration `036_pg_net_data_api_guard` is live on WERK Österreich Staging as `20260920203116 pg_net_data_api_guard`. The enforceable Hosted-Supabase boundary is independently counterchecked: `anon`/`authenticated` are `NOLOGIN`, no WERK-owned public wrapper exposes `net.http_*`, and `pgrst.db_pre_request=public.werk_api_security_guard` blocks Data-API requests that try to select the `net` profile while normal `public` requests continue to work.
- Evidence: functional head `4d79bf4a2de6f94ec09fc56a8ef87af5cd580c66`; IDEENWERK Backend Check #161 attempt 2 succeeded including the unchanged 1,000-item queue benchmark; supervisor receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T221347Z.json`; staging remained `ACTIVE_HEALTHY`, Edge version 7, synthetic citizen/review/privacy/cluster tables returned to zero baseline.
- Boundary: This closes only the bounded staging Data-API request-boundary scope. Hosted Supabase still restores direct `net` schema/routine grants and Security Advisor still reports `extension_in_public`; those are tracked separately under `WERK-LOOP-SEC-PGNET-001` and still block production hardening acceptance.
- Next step: proceed to `WERK-IDEENWERK-IMPACT-BRIDGE-001`; reopen this task only on new adverse evidence or a separately scoped production-hardening dependency.
- Do not repeat: no direct outbound `net.http_*` security test and no move/drop/reinstall of the managed extension merely to silence the advisor.

## WERK-IDEENWERK-IMPACT-BRIDGE-001
- Date: 2026-09-20
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Goal: connect IDEENWERK citizen problems to existing WERK reform/calculation artifacts through a deterministic version-bound reference bridge without duplicating calculations.
- Result: five canonical mapping families reference only existing reform/data-contract/gate IDs; migration 037 runs at precheck; protected status/export expose current provenance; stale versions fail closed; no-match remains explicitly non-complete; V71 reuses the existing status surface. Independent Supervisor countercheck confirmed the bounded Staging path.
- CI: exact functional evidence head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`; WERK Impact Bridge Check #3 and WERK Frontend Check #177 succeeded.
- Staging: migration `20260920223436 ideenwerk_impact_bridge`; runtime contract `037_ideenwerk_impact_bridge`; direct bridge access remains service-role-only; stale version/source mismatch returns `revalidation_required`; 14 relevant synthetic citizen/review/privacy/impact tables were restored to zero baseline.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T225510Z.json`.
- Boundary: no new effect, saving, cost, forecast, political score, recommendation or automatic acceptance/rejection was introduced; Production/overall ACCEPTED is not implied.
- Dependency/loop/lock: `WERK-DEP-IDEENWERK-IMPACT-001` is `SATISFIED`; `WERK-LOOP-IMPACT-BRIDGE-001` is `CLOSED_COUNTERCHECKED_STAGING`; `LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001` is `RELEASED`; Started Work is closed.
- Next: do not rebuild. Impact Bridge closeout is fully consumed and it is a satisfied input to `WERK-EXPERT-001` and later AI synthesis.

## WERK-EXPERT-001
- Date: 2026-09-21
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Goal: integrate source-bound, auditable expert/affected-party input into existing IDEENWERK without expert veto, political scoring or parallel platform logic.
- Result: append-only expert evidence contract, contributor role, relationship disclosure, source/reference binding, optional separately sourced counterposition, citizen-safe status/privacy projections, aggregate content-free transparency and V71 rendering are implemented and independently counterchecked on Staging.
- CI: functional head `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`; WERK Expert Input Check #4, WERK Data Contract Registry Check #59 and WERK Frontend Check #182 succeeded.
- Staging: migrations `20260921012806 ideenwerk_expert_input` and `20260921013039 expert_input_operator_index`; project ACTIVE_HEALTHY; Edge version 7 unchanged; direct anon/authenticated expert access fails closed; service-role active-impact-reviewer write path is enforced; append-only guard active; zero synthetic baseline restored.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T023924Z.json`.
- Boundary: no expert veto, political merit score/ranking, review-depth override, citizen-text mutation, automatic acceptance/rejection, manufactured fiscal/impact effect, production deploy or live-browser visual acceptance is implied. Aggregate expert transparency remains service-role-only.
- Dependency/loop/lock: `WERK-DEP-EXPERT-AI-001` is `SATISFIED`; `WERK-LOOP-EXPERT-001` is `CLOSED_COUNTERCHECKED_STAGING`; `LOCK-WERK-EXPERT-001` is `RELEASED`; Started Work is closed.
- Next: do not rebuild. `WERK-AI-SYNTH-001` is the next functional catalog action only after Finishline Navigator/Evidence Reaper/Supervisor consume their authoritative expert closeout records.

## WERK-AI-SYNTH-001
- Date: 2026-09-21
- Status: COUNTERCHECKED_STAGING_BOUNDED_PROVIDER_DISABLED
- Risk: R3
- Goal: connect current citizen context, counterchecked Impact Bridge references and counterchecked Expert Input into bounded multi-variant synthesis with provenance and uncertainty, without political ranking or automatic decision.
- Result: source-bound synthesis schema, provider adapter, runner and protected status/V71 projection are implemented on Staging and independently counterchecked for the bounded provider-disabled scope.
- Functional evidence: exact head `982fa7301bf13b2e2cf40be14e1f588874e77e4f`; WERK AI Synthesis Check #3 and WERK Data Contract Registry Check #61 succeeded; IDEENWERK Backend Check #176 succeeded on predecessor functional head `4d3f63df43db446cd24c3c98304b1282acf61d9c`.
- Independent evidence: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T054427Z.json`; live migrations 040/041; RLS/ACL/source-snapshot/stale-revalidation/provenance/anti-ranking/anti-decision/anti-new-fiscal-effect boundaries confirmed; zero synthesis rows.
- Provider boundary: external provider remains deliberately disabled. `WERK-DEP-AI-PROVIDER-001` stays BLOCKED until endpoint/provider, secret handling, privacy/cost boundary and target-bound verification exist.
- Loop/lock: `WERK-LOOP-AI-SYNTH-001` is closed for the bounded Staging scope; `LOCK-WERK-AI-SYNTH-001` is released.
- Boundary: no live AI-generated political variants, paid provider, automatic accept/reject, political ranking, new fiscal effect, overall ACCEPTED or Production claim.
- Next: do not rebuild the bounded contract. A later provider activation is separately governed and must be independently target-verified.

## WERK-IMPACT-001
- Date: 2026-09-21
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Goal: source-bind forecast/baseline, real implementation evidence, KPI observations, arithmetic deviation, attribution hypotheses and review-only improvement hypotheses without inferring causality automatically.
- Result: migration 043 compiles the existing canonical `werk-data/ideenwerk-impact-bridge.json` into a fail-closed runtime validator; `werk_record_impact_measurement_plan` rejects unknown impact maps, map/reform mismatches, map/artifact mismatches and stale/unknown canonical source-version tokens before persistence or replay acceptance. No second registry or calculator was created.
- Functional evidence: exact head `ceea9a8bce350529114258049a93ba1057dacbeb`; WERK Impact Measurement Check #6 SUCCESS; WERK Data Contract Registry Check #63 SUCCESS.
- Staging evidence: migration `20260921062817 werk_impact_authoritative_source_binding`; valid current binding plus four negative source-binding classes verified; impact tables remained zero-row.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json`; `CTR-WERK-IMPACT-SOURCE-BINDING-001` resolved for bounded Staging scope.
- Boundary: baseline/forecast is not observed fact; observation is not causal attribution; arithmetic deviation is not policy effect; improvement remains review-only hypothesis. No production acceptance implied.
- Loop/lock/dependency: `WERK-LOOP-IMPACT-001` is closed; `LOCK-WERK-IMPACT-001` released; upstream prerequisite for `WERK-IMPACT-FEEDBACK-001` satisfied.
- Next: do not rebuild. Consume through the bounded feedback integration.

## WERK-IMPACT-FEEDBACK-001
- Date: 2026-09-21
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Goal: connect counterchecked impact-review/improvement hypotheses back into the existing AI synthesis context while retaining current source binding, provenance, uncertainty and non-causal/non-political semantics.
- Prior implementation: migration 044 and functional head `6d95b394d0869fb91562f6a84a13502469ef7869` established the bounded feedback edge, but independent Supervisor receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T181600Z.json` found `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001`: the old read path globally limited candidates before submission map/reform relevance, so >50 newer unrelated reviews could hide an older relevant review.
- Builder correction: migration 045 `ideenwerk_impact_feedback_selection_hardening` moves current submission map/reform relevance into the SQL candidate query before the bounded `LIMIT 12`. It preserves authoritative source-binding revalidation, provenance/uncertainty gates, service-role-only execution and hypothesis-only semantics. No parallel feedback store/calculator was created.
- Exact functional head: `7e4291717563e5fe51cb84c7d239d7920a7d937e`. The product/migration delta first landed at `95e4e921d45149045ddd825e89f7e8da8e5b41f3`; the only subsequent change to reach the exact functional head was stabilization of the >50-review regression harness.
- CI: WERK Impact Feedback Check #3 SUCCESS, WERK AI Synthesis Check #7 SUCCESS and IDEENWERK Backend Check #187 SUCCESS on exact head `7e4291717563e5fe51cb84c7d239d7920a7d937e`. WERK Data Contract Registry Check #65 succeeded on `95e4e921d45149045ddd825e89f7e8da8e5b41f3`, which contains the identical migration/product delta. The first newly added Impact Feedback run #2 failed only in the initial regression harness after migrations/current-stale checks had passed; the harness was corrected without changing product logic and #3 is green.
- Staging: migration `20260921182939 ideenwerk_impact_feedback_selection_hardening` is active on WERK Österreich Staging. A rollback-only live regression with one relevant review plus 51 newer unrelated reviews proved that the relevant review remains selected, unrelated reviews do not leak, the output remains bounded to 12, and stale Impact Bridge registry state returns `revalidation_required` with zero review refs. Rollback cleanup restored the synthetic submission/review counts to zero.
- ACL/security: `anon` EXECUTE=false, `authenticated` EXECUTE=false, `service_role` EXECUTE=true for `ideenwerk_ai_feedback_context(uuid)`; the deployed function contains no old `LIMIT 50`, retains `LIMIT 12`, and contains current map/reform relevance binding. Fresh Security Advisor evidence introduced no new WARN; the pre-existing `pg_net extension_in_public` WARN remains separate production hardening, and service-role-only RLS INFO findings remain unchanged.
- Provider boundary: external provider remains disabled; no live model call, secret, paid action, Production action, political ranking, automatic policy change or causal promotion was introduced.
- Dependency/loop/lock: `WERK-DEP-IMPACT-FEEDBACK-001` remains `IMPLEMENTED_AWAITING_COUNTERCHECK`; `WERK-LOOP-IMPACT-FEEDBACK-001` remains `OPEN_AWAITING_INDEPENDENT_COUNTERCHECK`; `LOCK-WERK-IMPACT-FEEDBACK-001` remains ACTIVE until independent confirmation of the corrected head/evidence.
- Separate open finding: `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` remains YELLOW and out of scope for this selection correction. It is tracked as its own open loop and must be resolved before any reliance on stale measurement snapshots as current.
- Exact next step: independent Supervisor counterchecks `7e4291717563e5fe51cb84c7d239d7920a7d937e`, Impact Feedback #3 / AI Synthesis #7 / Backend #187, migration 045, >50 relevance-before-limit regression, ACL, stale fail-closed behavior and zero cleanup. Only then may this task/loop/lock/dependency close. No new feature slice should bypass the separate snapshot-freshness YELLOW.
- Do not repeat: do not restore a global pre-relevance candidate limit, rebuild the feedback edge, create a parallel store/calculator, promote review hypotheses to facts/causal effects, rank political variants, auto-change policy, or activate the provider.

- Independent closeout receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T200500Z.json`.
- Closeout: bounded Staging scope independently confirmed; do not rebuild unless a documented reopen trigger occurs.

## WERK-IMPACT-SNAPSHOT-FRESHNESS-001
- Date: 2026-09-21
- Status: COUNTERCHECKED_STAGING
- Risk: R3
- Goal: close Supervisor YELLOW `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` by making the existing impact measurement snapshot revalidate its persisted map/reform/artifact/source-version tuple before any current-state reliance.
- Builder correction: migration 046 `werk_impact_snapshot_freshness` replaces only the existing read RPC. Current authoritative tuples continue to return the prior measurement state plus `current_reliance=true`; stale/unknown authoritative source tuples return `state=revalidation_required`, `current_reliance=false`, preserve the stored append-only evidence as historical, and withhold current observation/review projection.
- Exact functional head: `3f1f5ee9b7325f958b33bfb05a2a7414ce2ec14f`.
- CI: WERK Impact Measurement Check #8 SUCCESS on exact functional head; WERK Data Contract Registry Check #66 SUCCESS on the same head. Contract guard, migration idempotency, existing measurement smoke and dedicated current/stale snapshot-freshness smoke all passed.
- Staging: migration `20260921192342 werk_impact_snapshot_freshness` is live on WERK Österreich Staging. Rollback-only runtime probe proved a current source tuple remains readable and an intentionally stale persisted tuple fails closed to `revalidation_required`. Post-probe counts: plans=0, implementation events=0, observations=0, reviews=0.
- ACL/security: snapshot EXECUTE remains anon=false, authenticated=false, service_role=true. Fresh Security Advisor introduced no new WARN; only the pre-existing `pg_net extension_in_public` production-hardening WARN remains.
- Calculation-integrity boundary: no baseline, target, KPI, deviation, fiscal, reform, debt, attribution or causal formula changed. No historical row is rewritten/deleted. No political ranking, automatic decision, provider activation, paid call or Production action.
- Loop/lock/dependency: `WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001`, `LOCK-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` and `WERK-DEP-IMPACT-SNAPSHOT-FRESHNESS-001` remain open pending independent Supervisor countercheck.
- Exact next step: Supervisor independently validates `3f1f5ee9b7325f958b33bfb05a2a7414ce2ec14f`, migration 046, Impact Measurement #8 / Data Contract Registry #66, current/stale fail-closed semantics, ACL and zero cleanup; only then may the finding/loop/lock/dependency close.
- Do not repeat: do not rebuild impact measurement, create a parallel source registry, rewrite historical measurement evidence, infer causality, or treat Builder evidence as independent acceptance.

- Independent closeout receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T200500Z.json`.
- Closeout: bounded Staging scope independently confirmed; do not rebuild unless a documented reopen trigger occurs.


## WERK-AI-PROVIDER-EVAL-001
- Date: 2026-09-21
- Status: COUNTERCHECKED
- Risk: R3
- Goal: prepare a neutral, source-backed provider/privacy/cost package for later real AI synthesis without selecting or activating a provider.
- Implementation: `werk-data/ideenwerk-ai-provider-evaluation.json`, validation script and dedicated CI workflow; intentionally kept outside the policy Data Contract Registry because it is a technical activation contract, not an Austrian data-baseline closure contract.
- Functional head: `abb9e280601ba4322c8920b1670c066192d535b2`.
- Scope: OpenAI API Direct and Azure Foundry EU DataZone are documented as non-selected technical candidates; exact retention/processing/cost activation facts must be revalidated at activation time. Server-only secrets, PII minimization, cost formula/cap boundary, fail-closed behavior and target-bound synthetic verification are explicit.
- Boundary: no provider selection, no secret, no paid call, no real citizen/expert data sent externally, no political model preference.
- Exact next step: current-head CI + independent countercheck. Only then may `WERK-OWNER-AI-PROVIDER-001` become READY_NOW.


- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T202000Z.json`.

## WERK-ID-ARCH-001
- Date: 2026-09-21
- Status: COUNTERCHECKED
- Risk: R4
- Goal: prepare comparable identity architectures for 1 person = 1 verified support without activating identity or conflating support with a secret/official vote.
- Implementation: `werk-data/verified-support-identity-architecture.json`, validation script and dedicated CI workflow; integrated through the WERK system graph rather than the policy Data Contract Registry.
- Functional head: `abb9e280601ba4322c8920b1670c066192d535b2`.
- Scope: provider-neutral core separates identity verification from support, stores scoped HMAC pseudonyms rather than raw identity in support records, defines recovery/rotation/threat model, and documents ID Austria Service Provider plus EUDI Wallet as non-selected candidates with official sources.
- Boundary: no identity provider selected, no bPK use assumed, no real identity, no support counting, no WERK VOTE, no Production.
- Exact next step: current-head CI + independent countercheck. Only then may `WERK-OWNER-ID-001` become READY_NOW.

- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T202000Z.json`.


## WERK-VOTE-ARCH-001
- Date: 2026-09-21
- Status: COUNTERCHECKED
- Risk: R4
- Goal: define a future WERK ballot security architecture without activating voting or choosing political voting rules.
- Result: two non-selected cryptographic architecture classes, eligibility/ballot separation, threat model, immutable election-config boundary and explicit open governance decisions are contract-bound.
- Evidence: `werk-data/werk-vote-security-architecture.json`; WERK Vote Architecture Check #1 success; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T203000Z.json`.
- Boundary: no official election claim, no live ballot, no selected scheme/quorum/threshold/franchise/binding/revote rule.


## WERK-PARLIAMENTARY-TRACE-001
- Date: 2026-09-21
- Status: COUNTERCHECKED
- Risk: R3
- Goal: define the evidence-bound trace from a future WERK citizen-decision artifact through lawful/formal handling, implementation evidence and impact measurement.
- Result: state machine, evidence fields and descriptive outcome codes are contract-bound without political scoring or motive inference.
- Evidence: `werk-data/parliamentary-path-contract.json`; WERK Parliamentary Trace Check #2 success; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T203000Z.json`.
- Boundary: no live parliamentary integration and no claim that a WERK platform decision itself is enacted law.


## WERK-ID-CORE-001
- Date: 2026-09-21
- Status: IMPLEMENTED_STAGING_AWAITING_SUPERVISOR
- Risk: R4
- Goal: establish a provider-neutral, data-minimised internal core for future 1 person = 1 verified support without activating identity, public counting or voting.
- Architecture prerequisite: `WERK-ID-ARCH-001` is independently COUNTERCHECKED.
- Implementation: migration 047 reuses `public.supports`, adds a private verification-receipt store, scoped pseudonym binding, idempotency and service-role-only internal RPCs.
- Exact functional head: `da75785b8d7d312f8beefbb2c37ed59abd52a4ff`.
- Exact-head CI: WERK Verified Support Core Check #4 SUCCESS; IDEENWERK Backend Check #194 SUCCESS.
- Staging: `verified_support_core` applied; runtime marker `047_verified_support_core_disabled`.
- Runtime probe: synthetic receipt/support succeeded once; exact replay deduplicated; scope mismatch failed closed; audit payload omitted scope pseudonym/provider assertion hash; cleanup returned identity receipts/supports/audits to zero.
- Security boundary: RLS enabled; anon/authenticated receipt SELECT=false and RPC EXECUTE=false; service_role access only.
- Activation remains blocked: no identity provider, no real identity, no public endpoint, no counting, no vote, no Production.
- Exact next step: independent Supervisor countercheck. Only after that may the Owner Action Manager decide whether `WERK-OWNER-ID-001` is READY_NOW.
- Builder claim: `project-memory/werk-builder-claims/WERK_VERIFIED_SUPPORT_CORE_2026-09-21T2034Z.json`.
