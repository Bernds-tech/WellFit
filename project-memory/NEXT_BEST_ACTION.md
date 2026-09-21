# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-001`
- Catalog entry: `NBA-WERK-IMPACT-MEASUREMENT`
- Status: `EXECUTABLE`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Soll/Ist-Wirkungsmessung und Rückkopplung bauen

## Why this is now the next safe executable action
`WERK-AI-SYNTH-001` has materially advanced, but its remaining step is no longer ordinary repository/staging implementation. The bounded source-binding/storage/status/UI/provider-adapter contract is implemented and deployed on WERK Staging, while the real synthesis provider remains deliberately disabled. Enabling an external provider without a known approved endpoint/secret/cost boundary would violate fail-closed and protected-action rules. The independent Supervisor must also countercheck the staged contract before a higher AI-synthesis state is claimed.

`WERK-IMPACT-001` is the next safe catalog action whose prerequisite (`impact_bridge`) is already `COUNTERCHECKED_STAGING`. It can therefore proceed without pretending the external AI provider is active.

## AI synthesis lane retained, not closed
- Functional evidence head: `982fa7301bf13b2e2cf40be14e1f588874e77e4f`.
- `WERK AI Synthesis Check #3`: success.
- `IDEENWERK Backend Check #176` on the immediately preceding functional head: success.
- `WERK Data Contract Registry Check #61`: success.
- Staging migrations: `20260921042608 ideenwerk_ai_synthesis` plus ACL hardening `041_ai_synthesis_trigger_privileges`.
- Staging schema/RLS/anon-auth privilege checks: passed; synthesis table remains zero-row.
- Fresh Security Advisor after ACL hardening: no AI-synthesis-specific WARN remains. The pre-existing hosted `pg_net extension_in_public` WARN remains a separate production-hardening item.
- Provider state: `SYNTHESIS_PROVIDER=disabled`; no fallback policy generator; no live AI variant is claimed.
- Required before AI-synthesis closeout: independent Supervisor countercheck plus an explicitly approved/configured provider boundary if real generation is to be activated.

## Exact bounded work for WERK-IMPACT-001
1. Reuse existing reform/model IDs and the counterchecked Impact Bridge; do not create parallel impact calculations.
2. Version-bind forecast/baseline, implementation event, KPI definition, observed value, measurement period and source provenance.
3. Keep forecast, observed fact, attribution hypothesis and uncertainty strictly separated.
4. Produce deviation diagnostics and improvement proposals only; never auto-adopt a political change.
5. Add stale/source-version invalidation and negative/fail-closed tests.
6. Reuse existing IDEENWERK/API/V71 surfaces where citizen transparency is appropriate; no parallel platform.
7. Reversible Staging verification, zero-fixture cleanup, then Builder claim for independent Supervisor countercheck.

## Do not rebuild
Impact Bridge, Expert Input, AI synthesis storage/provider-adapter contract, competence review, Existing-Measure review, Privacy, Clarification, public clusters and FAST/STANDARD/DEEP remain existing inputs. Do not duplicate them.

## Acceptance boundary
The Builder may implement and verify reversible staging work, then emit an evidence-bound claim. It must not write Supervisor State/Evidence Freshness, must not raise Finishline State itself, and must not infer `ACCEPTED` or `PRODUCTION_CONFIRMED` from code or staging alone.
