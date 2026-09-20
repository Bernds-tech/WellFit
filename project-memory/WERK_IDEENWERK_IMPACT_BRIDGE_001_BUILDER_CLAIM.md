# WERK IDEENWERK Impact Bridge 001 — Builder Claim

Status: `IMPLEMENTED_NOT_VERIFIED`  
Risk: `R3`  
Functional product head: `f5a38a74caf4daf896124b2f606942d1653e2316`  
Exact final tested evidence head: `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`  
Staging migration: `20260920223436 ideenwerk_impact_bridge`

## Claim

The Builder implemented the previously missing connection `citizen idea/precheck -> existing WERK reform and calculation/data-contract artifacts` without creating a parallel calculator. The canonical registry contains only existing reform IDs, data-contract IDs, gate references and artifact provenance. Runtime migration 037 maps bounded high-specificity problem signals to those references, never computes a new fiscal effect and never makes a political acceptance/rejection or recommendation.

## Code evidence

- `werk-data/ideenwerk-impact-bridge.json` version `2026-09-21-v1`, source-bound to `reforms.json` `2026-09-06-v5` and Data Contract Registry `2026-09-07-v17`.
- `ideenwerk-backend/sql/037_ideenwerk_impact_bridge.sql`: RLS-protected check table, precheck trigger, audit trail, protected status/export overlay and stale-version fail-closed behavior.
- `ideenwerk-backend/scripts/impact-bridge-contract.mjs`: verifies canonical reform/data-contract/artifact IDs and exact SQL runtime-map parity.
- `ideenwerk-backend/scripts/impact-bridge-smoke.mjs`: denies anon/authenticated direct access, proves SV candidate mapping, proves no new amount/effect field, forces stale-version revalidation and proves non-complete no-match behavior.
- `werk-assets/site-ideenwerk-v2.js`: reuses the existing V71 protected status surface; no parallel page.
- `werk-data/ideenwerk-api-contract.json` v17 documents the field only after the Staging runtime was proven live.
- `werk-data/ideenwerk-impact-bridge.json` binds the proven Staging migration, stale negative-path result and restored zero baseline as Builder evidence, explicitly pending independent Supervisor countercheck.

## CI evidence

- WERK Impact Bridge Check #2 on exact functional head `f5a38a74caf4daf896124b2f606942d1653e2316`: **SUCCESS**. Portable migration, idempotency, canonical registry parity and DB stale/negative smoke passed.
- WERK Frontend Check #176 on exact functional head `f5a38a74caf4daf896124b2f606942d1653e2316`: **SUCCESS**, including V71 structural/policy and JS/JSON checks.
- After all temporary reconciliation helpers were removed and Staging evidence was bound into the canonical registry, exact final evidence head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be` passed **WERK Frontend Check #177** and **WERK Impact Bridge Check #3**. The latter passed portable migration, migration idempotency, canonical registry parity and DB mapping/stale-negative guardrails.
- This Builder claim file is documentation only and therefore may sit on a later documentation commit; `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be` is the exact tested repository state to countercheck.

## Reversible Staging evidence

WERK Österreich Staging migration `20260920223436 ideenwerk_impact_bridge` applied successfully. A synthetic employee-SV submission transitioned to `precheck` and produced exactly `IMPACT-SV-EMPLOYEE -> SV-01 -> FISCAL-DATA -> WERK-SV-010/WERK-SV-011`. The token-protected private status returned the same current bridge. `anon` and `authenticated` had no direct table SELECT. After forcing a stale registry version on the synthetic row, the current contract returned `revalidation_required` with an empty mapping array rather than stale references. Synthetic submission, structured proposal, review task, audit events, bridge check and status-access rows were then removed; all returned to the zero-data Staging baseline.

## Explicit non-claims

- No new cost, saving, revenue, fiscal effect or forecast was calculated.
- A candidate mapping is not a political score, recommendation, acceptance or rejection.
- `no_known_mapping` does not prove that no relevant WERK artifact exists.
- This is Staging implementation evidence, not production acceptance.
- The `impact_bridge` Finishline gate remains unchanged until independent Supervisor countercheck.

## Required next actor

WERK Supervisor: independently countercheck exact tested head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`, its green Frontend #177 / Impact Bridge #3 evidence and the Staging evidence above, then either record `COUNTERCHECKED`/receipt and release the dependency/lock or record a concrete contradiction/open follow-up.
