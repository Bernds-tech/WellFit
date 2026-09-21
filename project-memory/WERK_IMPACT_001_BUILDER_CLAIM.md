# WERK-IMPACT-001 — Builder Claim

Stand: 21.09.2026

## Scope
Bounded Soll/Ist-Wirkungsmessung und Rückkopplung auf bestehenden WERK-Reform-/Impact-/Rechenreferenzen. Forecast/Baseline, reale Umsetzungsevidence, beobachteter KPI-Wert, arithmetische Abweichung, Attribution-Hypothese und Verbesserungshypothese bleiben strikt getrennt.

## Functional evidence
- Functional head: `f11a53ab257d7a55fc19d15ee4a8bc4f019d5b0f`.
- `WERK Impact Measurement Check #1`: SUCCESS.
- Contract guard, portable migrations, migration idempotency and DB negative-path smoke passed.
- Tested fail-closed paths include non-reviewer writes, missing plan, invalid observation period, append-only update/delete denial and observation/review boundaries.

## Implemented
- `werk-data/ideenwerk-impact-measurement.json`
  - machine-readable measurement/feedback contract.
- `ideenwerk-backend/sql/042_werk_impact_measurement.sql`
  - measurement plans bound to existing `impact_map_id`, `reform_id`, model/artifact ref and source version;
  - append-only implementation events with source binding;
  - append-only KPI observations with source/data version;
  - review-only deviation/attribution/alternative-explanation/improvement hypotheses;
  - snapshot with explicit states before implementation, before observation and after observation;
  - arithmetic deviation never labelled as causal effect.
- `ideenwerk-backend/scripts/impact-measurement-contract.mjs`
  - contract/source-ID/policy guard.
- `ideenwerk-backend/scripts/impact-measurement-smoke.mjs`
  - role, source, idempotency, state transition, arithmetic and append-only negative paths.
- `.github/workflows/werk-impact-measurement-check.yml`
  - dedicated CI gate.

## Staging evidence
- Project: `WERK Österreich Staging` (`jwomaoxefgnhsgiebaqy`).
- Applied migration: `20260921043357 werk_impact_measurement`.
- Tables present: `werk_impact_measurement_plans`, `werk_impact_implementation_events`, `werk_impact_observations`, `werk_impact_reviews`.
- Snapshot RPC present: `werk_impact_measurement_snapshot(text)`.
- RLS enabled; direct anon/authenticated table access and anon observation-RPC execution fail closed.
- Zero baseline after deploy: plans=0, observations=0, reviews=0.
- Runtime marker: `042_werk_impact_measurement`.
- Fresh Security Advisor: no new impact-measurement WARN. Existing `pg_net extension_in_public` remains the separate known production-hardening item.

## Semantic boundary
This work does **not** claim that any WERK reform has already been implemented in the real world, does **not** claim an observed policy effect, and does **not** infer causality from a KPI movement. A review can record hypotheses and possible improvements only. No automatic political change, ranking, acceptance or rejection is performed.

## Builder status
`IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK`

The Builder does not mark this task `COUNTERCHECKED`, `ACCEPTED` or `PRODUCTION_CONFIRMED`. Independent Supervisor validation remains required. No further autonomous feature is selected until the current AI-synthesis and impact-measurement claims have been reconciled; the AI provider remains deliberately disabled pending an approved endpoint/secret/cost boundary.

## Governance reconciliation note
The functional code, staging, system graph and Next-Best-Action are updated in this run. The large historical shared registers (`TASK_LEDGER.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `DEPENDENCIES.md`) still require bounded canonical insertion for these two new claims before closeout. This note is not a second TODO system; it preserves the exact reconciliation obligation so the next control/build pass cannot lose it. No lock or task may be considered released solely because this claim file exists.
