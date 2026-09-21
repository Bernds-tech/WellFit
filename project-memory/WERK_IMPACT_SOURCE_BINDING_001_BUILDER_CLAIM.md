# WERK Impact Source Binding — Builder Claim

- Task: `WERK-IMPACT-001`
- Risk: R3
- Status: `IMPLEMENTED_STAGING_AWAITING_INDEPENDENT_COUNTERCHECK`
- Branch: `werk-v49-preview-host`
- Exact functional head: `ceea9a8bce350529114258049a93ba1057dacbeb`
- Scope: close `CTR-WERK-IMPACT-SOURCE-BINDING-001` Builder-side by binding measurement-plan creation to the existing canonical Impact Bridge/reform/artifact/version source chain.

## Implementation
- Added `ideenwerk-backend/sql/043_werk_impact_authoritative_source_binding.sql`.
- Added service-role-only `public.werk_impact_validate_source_binding(...)` as a compiled fail-closed view of `werk-data/ideenwerk-impact-bridge.json`; no second registry table or calculator was created.
- `public.werk_record_impact_measurement_plan(...)` now validates map/reform/artifact/source-version before persistence or replay acceptance.
- Current canonical source token: `impact-bridge=2026-09-21-v1;reforms=2026-09-06-v5;data-contract-registry=2026-09-07-v17`.
- Rejection classes: `WERK_IMPACT_SOURCE_MAP_UNKNOWN`, `WERK_IMPACT_SOURCE_REFORM_MISMATCH`, `WERK_IMPACT_SOURCE_ARTIFACT_MISMATCH`, `WERK_IMPACT_SOURCE_VERSION_STALE_OR_UNKNOWN`.
- CI parity guard requires every current canonical map/reform/artifact to exist in the compiled validator, so canonical registry drift fails closed until deliberately reconciled.

## Exact-head CI
- WERK Impact Measurement Check #6: SUCCESS on `ceea9a8bce350529114258049a93ba1057dacbeb`.
- WERK Data Contract Registry Check #63: SUCCESS on `ceea9a8bce350529114258049a93ba1057dacbeb`.
- Covered: canonical registry/runtime parity, migration application/idempotency, unknown map, reform mismatch, artifact mismatch, stale source token, valid current tuple persistence/replay, reviewer boundary, observation guards, arithmetic deviation/no-causality semantics, review-only hypotheses and append-only denial.

## Reversible Staging Evidence
- WERK Österreich Staging migration: `20260921062817 werk_impact_authoritative_source_binding`.
- Direct validator check: valid tuple `IMPACT-SV-EMPLOYEE / SV-01 / werk-data/employee-sv-funding-bridge-results.json / current source token` returned `current_authoritative_registry_tuple`; unknown map, reform mismatch, artifact mismatch and stale source token failed closed.
- Full plan-RPC rollback smoke: a temporary active `impact_reviewer` created inside one transaction successfully recorded a valid current-tuple measurement plan through `public.werk_record_impact_measurement_plan(...)`; the same RPC rejected an unknown map and stale source token; the entire transaction was rolled back.
- Zero baseline after rollback verification: measurement plans 0; implementation events 0; observations 0; reviews 0.
- Fresh Security Advisor after migration: no new WARN; unchanged separate WARN `pg_net extension_in_public`; RLS-without-policy findings remain INFO on deliberately RPC/direct-grant-bounded tables.

## Safety / Scope Boundary
- No Production action.
- No paid/external AI provider or secret activation.
- No formula, fiscal effect or political weighting changed.
- No real reform implementation or observed causal policy effect is claimed.
- Existing Impact Bridge, Expert Input and bounded provider-disabled AI synthesis were not rebuilt.
- Downstream `WERK-IMPACT-FEEDBACK-001` remains blocked until independent Supervisor countercheck.

## Required Independent Countercheck
Supervisor must independently verify exact-head CI, live migration/function behavior, fail-closed negative classes, zero-baseline and post-schema security state, then reconcile `CTR-WERK-IMPACT-SOURCE-BINDING-001`, Evidence Freshness and Finishline state as appropriate. Builder does not self-accept or self-resolve the contradiction.
