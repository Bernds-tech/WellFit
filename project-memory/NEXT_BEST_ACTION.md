# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-CURRENT-CLAIMS-COUNTERCHECK`
- Status: `AWAITING_INDEPENDENT_COUNTERCHECKS`
- Risk: `R3`
- Gates: `ai_synthesis`, `impact_measurement`
- Title: Aktuelle AI-Synthese- und Wirkungsmessungs-Claims unabhängig gegenprüfen

## Why no new autonomous feature is selected
Two finishline-relevant slices were materially implemented on WERK Staging in the current builder cycle:

1. `WERK-AI-SYNTH-001` — bounded source-bound multi-variant synthesis contract/provider adapter/status/UI integration. The external model provider remains deliberately disabled, so no live AI-generated political variants are claimed.
2. `WERK-IMPACT-001` — source-bound forecast/implementation/KPI/observation/review contract with strict separation between arithmetic deviation and causal attribution.

Both now require the independent Supervisor before any higher state is claimed. Starting another feature before these claims are reconciled would violate the closed-loop priority rules and create avoidable WIP.

## AI synthesis evidence awaiting countercheck
- Functional evidence head: `982fa7301bf13b2e2cf40be14e1f588874e77e4f`.
- `WERK AI Synthesis Check #3`: SUCCESS.
- `IDEENWERK Backend Check #176` on the immediate predecessor functional head: SUCCESS.
- `WERK Data Contract Registry Check #61`: SUCCESS.
- Staging migrations: `20260921042608 ideenwerk_ai_synthesis` and `20260921042728 ai_synthesis_trigger_privileges`.
- RLS/direct-access checks: fail-closed as intended; synthesis table remains zero-row.
- Fresh Security Advisor: no AI-synthesis-specific WARN after ACL hardening.
- Provider: `SYNTHESIS_PROVIDER=disabled`; no fallback policy generator and no live AI variant claimed.
- Builder claim: `project-memory/WERK_AI_SYNTH_001_BUILDER_CLAIM.md`.
- Remaining external boundary: a real provider requires an explicitly approved endpoint/secret/cost boundary plus target-bound verification.

## Impact measurement evidence awaiting countercheck
- Functional evidence head: `f11a53ab257d7a55fc19d15ee4a8bc4f019d5b0f`.
- `WERK Impact Measurement Check #1`: SUCCESS.
- Staging migration: `20260921043357 werk_impact_measurement`.
- RLS/direct-access checks: fail-closed as intended.
- Zero baseline after deploy: plans=0, observations=0, reviews=0.
- Fresh Security Advisor: no new impact-measurement WARN.
- Semantics: baseline/forecast, implementation evidence, observed KPI, arithmetic deviation, attribution hypothesis and improvement hypothesis remain explicitly separated; no causal policy effect is auto-derived.
- Builder claim: `project-memory/WERK_IMPACT_001_BUILDER_CLAIM.md`.

## Mandatory reconciliation before closeout
The system graph and these Builder claims are current. The large shared historical registers still need bounded insertion/reconciliation for the two new claims: `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md` and `DEPENDENCIES.md`. Until those writes and the independent counterchecks are complete, neither task is considered closed or released.

## Known unrelated hardening item
The hosted Supabase `pg_net extension_in_public` WARN remains the already-known production-hardening issue. It did not regress during either feature slice and does not justify inventing a new staging feature.

## Stop rule
Do not begin a new functional feature merely to keep the builder busy. Reconcile the current claims and wait for independent countercheck. After that, derive the next action again from `WERK_NEXT_BEST_ACTIONS.json`, current dependencies, finishline state and owner readiness.
