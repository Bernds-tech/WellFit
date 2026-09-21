# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-CURRENT-CLAIMS-COUNTERCHECK`
- Status: `AWAITING_INDEPENDENT_COUNTERCHECKS`
- Risk: `R3`
- Gates: `ai_synthesis`, `impact_measurement`
- Title: Aktuelle AI-Synthese- und Wirkungsmessungs-Claims unabhängig gegenprüfen

## Why no new autonomous feature is selected
Two finishline-relevant slices are materially implemented on WERK Staging and are now fully registered in the Builder-owned canonical shared registers:

1. `WERK-AI-SYNTH-001` — bounded source-bound multi-variant synthesis contract/provider adapter/status/UI integration. The external model provider remains deliberately disabled, so no live AI-generated political variants are claimed.
2. `WERK-IMPACT-001` — source-bound forecast/implementation/KPI/observation/review contract with strict separation between arithmetic deviation and causal attribution.

The Builder-side reconciliation obligation is complete: both tasks now exist in `TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md` and `DEPENDENCIES.md`. Both locks remain ACTIVE because independent Supervisor counterchecks are still missing. Starting another feature before these claims are reconciled would violate the closed-loop priority rules and create avoidable WIP.

## AI synthesis evidence awaiting countercheck
- Functional evidence head: `982fa7301bf13b2e2cf40be14e1f588874e77e4f`.
- `WERK AI Synthesis Check #3`: SUCCESS.
- `WERK Data Contract Registry Check #61`: SUCCESS.
- `IDEENWERK Backend Check #176` on predecessor functional head `4d3f63df43db446cd24c3c98304b1282acf61d9c`: SUCCESS.
- Staging migrations: `20260921042608 ideenwerk_ai_synthesis` and `20260921042728 ai_synthesis_trigger_privileges`.
- RLS/direct-access checks: fail-closed as intended; synthesis table remains zero-row.
- Fresh runtime recheck on 2026-09-21: WERK Österreich Staging remains `ACTIVE_HEALTHY`; migrations 040/041 remain present; current schema has advanced only through the expected impact migration 042.
- Fresh Security Advisor: no AI-synthesis-specific WARN; only the already-known `pg_net extension_in_public` WARN persists.
- Provider: `SYNTHESIS_PROVIDER=disabled`; no fallback policy generator and no live AI variant claimed.
- Builder claim: `project-memory/WERK_AI_SYNTH_001_BUILDER_CLAIM.md`.
- Separate dependency: `WERK-DEP-AI-PROVIDER-001` remains `BLOCKED` until endpoint/provider, secret handling, cost and target-bound verification are explicitly available. This does not block counterchecking the bounded staging contract.

## Impact measurement evidence awaiting countercheck
- Functional evidence head: `f11a53ab257d7a55fc19d15ee4a8bc4f019d5b0f`.
- `WERK Impact Measurement Check #1`: SUCCESS.
- `WERK Data Contract Registry Check #62`: SUCCESS.
- Staging migration: `20260921043357 werk_impact_measurement`.
- RLS/direct-access checks: fail-closed as intended.
- Fresh zero baseline: `ideenwerk_ai_syntheses=0`, `werk_impact_measurement_plans=0`, `werk_impact_observations=0`, `werk_impact_reviews=0`.
- Fresh Security Advisor: no impact-measurement-specific WARN.
- Fresh Performance Advisor: five INFO-level unindexed foreign keys on the new impact tables. This is not a correctness/security failure and does not block bounded Staging countercheck, but it remains visible under `WERK-LOOP-IMPACT-001` for later scale/production hardening.
- Semantics: baseline/forecast, implementation evidence, observed KPI, arithmetic deviation, attribution hypothesis and improvement hypothesis remain explicitly separated; no causal policy effect is auto-derived.
- Builder claim: `project-memory/WERK_IMPACT_001_BUILDER_CLAIM.md`.
- Downstream dependency: `WERK-DEP-IMPACT-FEEDBACK-001` remains ACTIVE because review hypotheses are not yet consumed by AI synthesis.

## Current stop condition
The next safe action is the independent Supervisor countercheck of both current claims. The Builder must not write `WERK_SUPERVISOR_STATE`, must not self-mark Evidence Freshness current, and must not advance `WERK_FINISHLINE_STATE`. Until countercheck/closeout, both active locks stay in place and no new functional feature is started.

## Known unrelated hardening item
The hosted Supabase `pg_net extension_in_public` WARN remains the already-known nonblocking Staging / production-hardening issue. It did not regress during either feature slice and does not justify inventing new work.
