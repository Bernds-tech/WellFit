# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-001`
- Status: `YELLOW_RECONCILIATION_REQUIRED`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Wirkungsmessung an den autoritativen WERK-Quellstand fail-closed binden

## Why this action is selected
The independent Supervisor countercheck completed the bounded `WERK-AI-SYNTH-001` Staging contract: source snapshot, current Impact-Bridge/Expert references, multiple variants, provenance/uncertainty, stale revalidation, RLS/ACL and anti-ranking/anti-decision/anti-new-fiscal-effect guards are verified. The external provider remains deliberately disabled and is a separate blocked dependency; do not reactivate or rebuild the bounded synthesis contract.

`WERK-IMPACT-001` is only partially counterchecked. Its RLS/ACL, append-only evidence, reviewer boundary, observation-source requirement, baseline/target/observation separation, arithmetic deviation and no-causality semantics are sound. However the live measurement-plan recorder currently accepts `impact_map_id`, `reform_id`, `model_or_artifact_ref` and `source_version` as length-checked text without validating that the tuple exists and is current in the authoritative WERK Impact-Bridge/reform/model source chain. This contradicts the contract's source-bound claim and leaves the `IDEENWERK-IMPACT → KPI-MEASUREMENT` connection unproven.

## Exact next implementation scope
1. Reuse the existing Impact Bridge / WERK reform-model-data source of truth. Do **not** create a second registry, calculator or parallel source table.
2. Make `werk_record_impact_measurement_plan` fail closed when the submitted impact-map/reform/model/source-version tuple is unknown, stale, mismatched or no longer current.
3. Preserve the existing semantic boundaries: baseline/forecast is not observed fact; observation is not causal attribution; arithmetic deviation is not policy effect; review/improvement remains hypothesis-only.
4. Add negative CI/smoke coverage that proves unknown/stale/mismatched source identifiers are rejected, plus a valid current-tuple success path.
5. Rerun exact-head `WERK Impact Measurement Check`, `WERK Data Contract Registry Check`, affected backend/frontend checks, then require a fresh independent Staging countercheck before closing `WERK-IMPACT-001`.

## Independent evidence already accepted
- AI synthesis functional head `982fa7301bf13b2e2cf40be14e1f588874e77e4f`: WERK AI Synthesis Check #3 and Data Contract Registry #61 successful; Backend Check #176 successful on predecessor `4d3f63df43db446cd24c3c98304b1282acf61d9c`; migrations 040/041 live; zero synthesis rows; bounded contract independently counterchecked.
- Impact measurement functional head `f11a53ab257d7a55fc19d15ee4a8bc4f019d5b0f`: Impact Measurement Check #1 and Data Contract Registry #62 successful; migration 042 live; RLS/ACL/append-only/no-causality semantics independently verified; source-binding claim remains unverified because runtime enforcement is missing.
- Fresh Staging: `ACTIVE_HEALTHY`, `werk-ideenwerk-api` ACTIVE v7, latest migration `20260921043357 werk_impact_measurement`, 20 checked citizen/review/privacy/AI/impact tables at zero rows, no active/failed/dead jobs and no active review tasks.
- Fresh Security Advisor: exactly one WARN remains, `pg_net extension_in_public`; no new WARN. Five new RLS-without-policy entries are INFO only and correspond to the deliberately direct-grant/RPC-bounded AI/impact tables.
- Fresh Performance Advisor: five INFO-level unindexed foreign keys on impact tables; keep visible for scale/production hardening, but they are not the current correctness blocker.

## Closed-loop / do-not-repeat boundaries
- Do not rebuild Impact Bridge, Expert Input or the bounded AI-synthesis contract.
- Do not activate an external/paid AI provider in this task.
- Do not infer any real reform implementation, observed causal policy effect, political ranking or automatic decision.
- Do not move to another feature while the impact source-binding contradiction is open.
- Existing `WERK-DEP-IMPACT-FEEDBACK-001` remains downstream work after `WERK-IMPACT-001` is counterchecked; do not wire improvement hypotheses into AI while their authoritative source binding is unresolved.

## Strategic sequence after this reconciliation
1. `WERK-IMPACT-FEEDBACK-001`: close the already documented `IMPROVEMENT-LOOP → AI-SYNTHESIS` connection with a bounded, source-bound consumption contract. Reviewed improvement hypotheses remain hypotheses; they are never promoted to facts or automatic policy changes.
2. `WERK-AI-PROVIDER-EVAL-001`: prepare a concrete provider/privacy/cost/secret/verification package without activating a provider. This closes the preparation gap behind `WERK-DEP-AI-PROVIDER-001`.
3. `WERK-ID-ARCH-001`: prepare comparable identity/verification architectures and a threat model so `WERK-OWNER-ID-001` can eventually become READY_NOW instead of asking the Owner to choose without a technical decision package.
4. Only after the respective preparation evidence exists may `WERK-OWNER-AI-PROVIDER-001` or `WERK-OWNER-ID-001` become READY_NOW. WERK VOTE remains later behind verified support and its separate legal/privacy/security boundary.

## Known separate hardening item
Hosted Supabase still reports `pg_net extension_in_public`. The existing Data-API request boundary remains counterchecked for Staging. This warning continues to block production-security acceptance but does not replace or supersede the current `WERK-IMPACT-001` reconciliation.
