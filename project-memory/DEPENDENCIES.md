# WellFit Dependencies

Track implementation ordering and cross-repository dependencies here.

## WF-DEP-001
- From: WellFit graphical/landing/UI tasks
- Requires: explicit repository ownership
- Type: cross-project governance
- Status: ACTIVE
- Updated: 2026-08-20
- Rule: `Bernds-tech/WellFit` owns graphics/UI/landing/product presentation. `Bernds-tech/WellFit-now` owns technical product implementation, including technical mobile application logic outside the Buddy domain. `Bernds-tech/WellFit-Buddy` owns Buddy behavior/presentation/animation and Buddy-specific AR/camera interaction. Bridge work must carry a cross-project ID.

## WF-DEP-002
- From: WFG-VIS-001
- Requires: current implemented capability from WellFit-now and current Buddy capability from WellFit-Buddy
- Type: capability/claim alignment
- Status: BLOCKED
- Updated: 2026-08-20
- Rule: graphical screens/landing claims cannot be ACCEPTED until they match current implemented capability and any unsupported/roadmap behavior is clearly marked.

## WF-DEP-003
- From: WFG-VIS-001
- Requires: canonical visual-baseline decision across PR #2, current main and any still-relevant visual assets in WellFit-now
- Type: migration/convergence
- Status: ACTIVE
- Updated: 2026-08-20
- Rule: classify KEEP/REPLACE/MIGRATE_LATER/OBSOLETE before moving or recreating visual code.

States: `ACTIVE`, `SATISFIED`, `BLOCKED`, `SUPERSEDED`.
## WERK-SV-006
- SV-01 financing needs actual ALV employee receipts after reduced DN rates; ESSOSS assumes equal split. PV/KV contributions require legal-scope bridge.
- Twelve static reference cases do not replace debt/SV growth paths; existing inputs unchanged.

## WERK-SV-007
- Work-incentive diagnostic consumes existing2026 payroll+annualassessment unchanged. Future use depends on REV-ALV-DN transition, other tax/benefit updates and exact contribution populations.

## WERK-SV-008
- ÖGK Newsletter 8/August 2026 supplies provisional 2027 thresholds and separate existing/new employment rates; recheck official promulgation before using as final rules.
- Pure ALV transition population costing requires monthly ordinary/special contribution bases and durations, not broad annual gross bands. Extra income tax requires explicit ALV replacement transfers; interest cannot be spent twice.

## WERK-SV-009
- DVSV2025 handbook chapter1 tables1.12–1.20 describe2024 normalized annual person incomes including specials, not payment-period frequencies.
- Conditional bounds use eligible separate assessed payment bases in1500–3500EUR, not number of persons or bank transfers. Special payments in the same assessment period must be combined according to the reference rule.

## WERK-SV-010 — 2026-09-08
- National ALV costing depends on legal assessment counts rather than raw tariff blocks/persons; same versus different rate/charged bases and legal/actual employee payer require separate groups. Exact affine sums need unrounded cent sums; otherwise interval uncertainty remains. No source adapter for real data has been accepted.

## WERK-SV-011
- Employee relief funding now has a source-linked primary/interest/surplus bridge; old conditional models remain unchanged. Debt reduction additionally depends on deficit-debt adjustments and source rounding.
- Full removal of current-year interest is an extreme accounting comparison, never a forecast of debt freedom in2026–2031.

## WERK-SUB-001 — 2026-09-09
Accounts require program and EU/RRF/cofinancing mapping before national savings. Source account absence cannot establish program closure. Older Taskforce2026 10.1bn is a March2026 reference; exact bridge to AugustCSV 9.730198bn remains open.


## WERK-DEP-IDEENWERK-IMPACT-001
- From: IDEENWERK citizen precheck / problem cluster.
- Requires: verified competence/legal path, existing-measure path, reform identifiers and existing WERK calculation/data artifacts.
- Type: cross-component integration.
- Status: SATISFIED
- Updated: 2026-09-21 05:17 Europe/Vienna.
- Rule: reuse existing WERK calculation/reform artifacts; expose model/reform IDs, provenance and open gates without converting conditional calculations into verified effects.
- Counterchecked result: exact tested functional head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`; WERK Impact Bridge Check #3 and WERK Frontend Check #177 succeeded; live Staging migration `20260920223436 ideenwerk_impact_bridge`; version/source mismatch paths fail closed; direct bridge access remains service-role-only; zero synthetic baseline restored.
- Independent evidence: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T225510Z.json`; WERK_SUPERVISOR_STATE records `COUNTERCHECKED_STAGING`.
- Boundary: satisfaction proves the bounded Staging reference bridge only; it does not create or verify new fiscal effects and does not imply production acceptance.
- Downstream: consumed by `WERK-EXPERT-001` and by the independently counterchecked bounded source-snapshot path of `WERK-AI-SYNTH-001`; do not reopen or rebuild unless a concrete downstream extension or contradictory evidence requires it.

## WERK-DEP-EXPERT-AI-001
- From: `WERK-AI-SYNTH-001`.
- Requires: `WERK-DEP-IDEENWERK-IMPACT-001` SATISFIED plus independently counterchecked `WERK-EXPERT-001` expert/affected-party evidence contract.
- Type: cross-component knowledge/provenance integration.
- Status: SATISFIED
- Updated: 2026-09-21 07:44 Europe/Vienna.
- Counterchecked evidence: expert process functional head `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`; WERK Expert Input Check #4, WERK Data Contract Registry Check #59 and WERK Frontend Check #182 succeeded; Staging migrations `20260921012806 ideenwerk_expert_input` and `20260921013039 expert_input_operator_index` are live; independent expert receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T023924Z.json` records `COUNTERCHECKED_STAGING`.
- Downstream consumption countercheck: bounded AI synthesis functional head `982fa7301bf13b2e2cf40be14e1f588874e77e4f` consumes current citizen-visible expert refs plus current Impact Bridge refs into the source snapshot; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T054427Z.json` records `COUNTERCHECKED_STAGING_BOUNDED_PROVIDER_DISABLED`.
- Boundary: satisfaction proves the expert evidence source and bounded AI consumption contract; it does not activate a provider, create live AI variants, make expert input a political decision, or imply ACCEPTED/Production status.
- Downstream: do not reopen merely because provider activation is separately blocked under `WERK-DEP-AI-PROVIDER-001`.

## WERK-DEP-AI-PROVIDER-001
- From: live external generation for `WERK-AI-SYNTH-001`.
- Requires: an approved model endpoint/provider, credential/secret handling, explicit cost boundary and target-bound runtime verification; any privacy/data-transfer requirements must also be satisfied before activation.
- Type: external/provider/runtime boundary.
- Status: BLOCKED
- Updated: 2026-09-21 07:44 Europe/Vienna.
- Current state: the source-bound synthesis contract is independently counterchecked for its bounded provider-disabled Staging scope, but `SYNTHESIS_PROVIDER=disabled`; no live AI-generated political variants exist.
- Rule: do not activate a paid/external provider or insert secrets as part of ordinary Builder staging work. A concrete provider/privacy/cost proposal and target-bound verification are required before changing this dependency.
- Unblocks: actual target-bound AI variant generation and later end-to-end synthesis/runtime evidence.

## WERK-DEP-IMPACT-FEEDBACK-001
- From: `IMPROVEMENT-LOOP` → `AI-SYNTHESIS` feedback edge.
- Requires: independently counterchecked `WERK-IMPACT-001`; current submission map/reform relevance applied before the bounded feedback selection window; authoritative source-binding revalidation; uncertainty/provenance; and—only for real model regeneration—an approved active AI provider boundary.
- Type: cross-component feedback integration.
- Status: SATISFIED
- Updated: 2026-09-21 20:35 Europe/Vienna.
- Builder evidence: exact functional head `7e4291717563e5fe51cb84c7d239d7920a7d937e`; migration 045 active on Staging; >50 newer unrelated-review regression proves the relevant review is not displaced; stale source state fails closed; exact-head Impact Feedback #3 / AI Synthesis #7 / Backend #187 are green.
- Independent gate: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T181600Z.json` raised the selection YELLOW on the prior implementation; only a new independent countercheck may satisfy this dependency after the correction.
- Provider boundary: external provider remains disabled and is not required to verify the contract-only feedback edge.
- Does not satisfy: separate `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`; current-state measurement snapshot freshness remains an independent YELLOW.
- Unblocks: closeout of the bounded feedback edge only after independent countercheck; no Production or live political-generation claim.

- Independent satisfaction: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T200500Z.json`.

## WERK-DEP-IMPACT-SNAPSHOT-FRESHNESS-001
- From: current-state reads of `public.werk_impact_measurement_snapshot(text)` / KPI measurement projection.
- Requires: existing authoritative Impact Bridge validator from migration 043, persisted map/reform/artifact/source-version tuple, fail-closed read-side revalidation and preserved historical evidence.
- Type: source-freshness/current-reliance correctness.
- Status: SATISFIED
- Updated: 2026-09-21 21:24 Europe/Vienna.
- Builder evidence: exact functional head `3f1f5ee9b7325f958b33bfb05a2a7414ce2ec14f`; migration 046 active on Staging; Impact Measurement #8 and Data Contract Registry #66 green; current tuple returns current authoritative binding, stale persisted tuple returns `revalidation_required`; ACL unchanged; zero impact rows after rollback.
- Independent gate: only Supervisor may satisfy this dependency and close/supersede `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` after independent countercheck.
- Boundary: does not alter measurement formulas, write-side source binding, historical evidence, causal attribution, feedback selection, AI provider or Production.
- Unblocks: safe reliance on measurement snapshots as current input only after independent countercheck.

- Independent satisfaction: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T200500Z.json`.


## WERK-DEP-VERIFIED-SUPPORT-CORE-001
- From: future `WERK-ID-001` activation.
- Requires: independently COUNTERCHECKED `WERK-ID-ARCH-001` plus provider-neutral internal verified-support core.
- Type: identity/support technical foundation.
- Status: IMPLEMENTED_AWAITING_SUPERVISOR
- Updated: 2026-09-21
- Builder evidence: exact head `da75785b8d7d312f8beefbb2c37ed59abd52a4ff`, Verified Support Core #4 + Backend #194 green, migration 047 live, ACL/RLS/negative/replay/privacy probe passed, zero cleanup.
- Boundary: does not satisfy owner-selected identity provider, legal/privacy approval, public endpoint/counting, WERK VOTE or Production.
- Unblocks after independent countercheck: Owner Action Manager may evaluate `WERK-OWNER-ID-001` readiness; no activation is automatic.
