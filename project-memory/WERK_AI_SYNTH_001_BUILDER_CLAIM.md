# WERK-AI-SYNTH-001 — Builder Claim

Stand: 21.09.2026

## Scope
Bounded source-bound KI-Synthese-Infrastruktur für IDEENWERK: mehrere Varianten, Provenienz, Unsicherheit, stale/fail-closed Verhalten und Bürgertransparenz. Keine politische Rangfolge, kein automatisches Annehmen/Ablehnen, kein Expertenveto und keine neu erfundene fiskalische Wirkungszahl.

## Functional evidence
- Functional evidence head: `982fa7301bf13b2e2cf40be14e1f588874e77e4f`.
- `WERK AI Synthesis Check #3`: SUCCESS.
- `IDEENWERK Backend Check #176` on predecessor functional head `4d3f63df43db446cd24c3c98304b1282acf61d9c`: SUCCESS.
- `WERK Data Contract Registry Check #61`: SUCCESS.
- First AI CI run exposed only an invalid test-fixture idempotency key. The fixture was corrected; no production guard, threshold or safety rule was weakened.

## Implemented
- `ideenwerk-backend/sql/040_ideenwerk_ai_synthesis.sql`
  - append-only synthesis records;
  - 2–5 variants;
  - current Impact Bridge + citizen-visible Expert Input required;
  - source snapshot hash/version binding;
  - current/stale projection;
  - protected status/privacy export projection;
  - service-role-only write path.
- `ideenwerk-backend/sql/041_ai_synthesis_trigger_privileges.sql`
  - removes direct PUBLIC/anon/authenticated execution of the append-only trigger function after Security Advisor found the initial ACL exposure.
- `ideenwerk-backend/src/lib/synthesis-provider.js`
  - external JSON adapter, default `disabled`, no policy fallback generator.
- `ideenwerk-backend/scripts/run-ai-synthesis.mjs`
  - consumes only current source-bound citizen/Impact/Expert context.
- `werk-assets/site-ideenwerk-synthesis.js`
  - reuses the existing V71 protected status surface; stale variants are not shown as current.
- `werk-data/ideenwerk-ai-synthesis.json`
  - machine-readable contract and staging evidence.

## Staging evidence
- Project: `WERK Österreich Staging` (`jwomaoxefgnhsgiebaqy`).
- Applied migration: `20260921042608 ideenwerk_ai_synthesis`.
- Applied ACL hardening: `041_ai_synthesis_trigger_privileges`.
- Verified table/functions exist; RLS enabled.
- `anon` and `authenticated`: no table SELECT and no synthesis-record RPC execution.
- Append-only trigger function: no PUBLIC/anon/authenticated direct EXECUTE after hardening.
- `ideenwerk_ai_syntheses`: zero rows after deployment; no synthetic residue.
- Security Advisor after hardening: no AI-synthesis-specific WARN. Existing `pg_net extension_in_public` warning is pre-existing and remains separate production hardening.

## Explicit limitation / blocker
`SYNTHESIS_PROVIDER` remains `disabled`. No real external model endpoint, credential or paid provider was activated. Therefore this claim does **not** say that WERK is already generating live political solution variants. The staging contract/provider adapter is ready and fail-closed; actual provider activation requires a known approved endpoint/secret/cost boundary and then target-bound runtime evidence.

## Builder status
`IMPLEMENTED_STAGING_CONTRACT_PROVIDER_DISABLED_AWAITING_COUNTERCHECK`

The Builder does not mark this task `COUNTERCHECKED`, `ACCEPTED` or `PRODUCTION_CONFIRMED`. Independent Supervisor validation remains required. Because the remaining AI step is externally/provider-bound, the next safe repository/staging action is `WERK-IMPACT-001` according to the existing catalog prerequisite `impact_bridge`.
