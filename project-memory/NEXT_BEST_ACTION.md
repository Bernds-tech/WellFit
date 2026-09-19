# WellFit Next Best Action

- Selected action: `WF-VISUAL-CANONICAL-INVENTORY`
- Status: `EXECUTABLE`
- Risk: `R3`
- Title: Aktuelle Landing/UI-Quelle inventarisieren und ersten Migrationskandidaten festlegen

## Why this is next
The intended visual authority is this repository, but the actual product UI/landing code still lives primarily in `Bernds-tech/WellFit-now`. Moving code before identifying the canonical graphical version would create duplicates and future convergence debt.

## Exact work
1. Inventory current landing/UI paths in WellFit-now and the newer graphical design/reference work.
2. Classify each relevant surface as `KEEP`, `REPLACE`, `MIGRATE_LATER` or `OBSOLETE`.
3. Map each UI claim to current backend/native capability evidence.
4. Propose the first small migration unit in `CONVERGENCE_LEDGER.json`; do not move code yet.
5. Keep WellFit-now and WellFit-Buddy product ownership untouched until the migration entry is reviewed.

## Safety
No backend/native rewrite, no blind copy, no production deploy, and no assumption that a graphical concept equals implemented capability.

## WERK-TAX-001 continuation — 2026-09-08
ABB2025 source and outcome-stage reconciliation plus 27 conditional incremental enforcement break-even cases added. See WERK_TAX_HANDOFF.md and WERK_STEUERVOLLZUG_RECHNUNG.md. All five relevant local workflow bodies and all four triggered remote workflows passed at abcc4a3c577d52dcc0532f1ecbc05ad833479077; WERK_TAX_001_CI_RECEIPT.json. Next evidence: additional collected tax/finality/cost cohorts beyond government baseline, source headline and budget discrepancy reconciliation. No new verified financing.

## WERK-SUB-001 — 2026-09-09
Current continuation: WERK_SUBSIDY_HANDOFF.md. Official 15,802-record subsidy CSV normalized; 2025 annual/monthly and 24 UG2024 controls reconciled. 1,035 account/classes and20 review priorities added. Program/legal/cofinancing/outcome attribution remains open; no extra financing. All five final local workflow bodies passed; final missing-annual-class guard passed importer and negative checks. All 13 triggered remote workflows succeeded at 0d47fa44c378438bc2c760df954756d73ff900c0; WERK_SUB_001_CI_RECEIPT.json.

## WERK autonomous continuation — 2026-09-19
- Selected action: `WERK-IDEENWERK-E2E-STAGING-SMOKE`
- Status: `EXECUTABLE`
- Risk: `R2` because only synthetic staging data may be created and must be cleaned up after verification.
- Why next: the existing website now reads real staging transparency metrics and public clusters. The next missing proof is the full citizen path from public no-login submission through one-time status token, private status lookup and the staging DB worker transitions.
- Exact next work: create one clearly synthetic IDEENWERK submission through the public Edge API, verify idempotency and Bearer status isolation, observe the `018_staging_db_worker` queue/status transitions and audit events, verify no dead/orphan jobs, then remove the synthetic test rows with the repository cleanup procedure. Do not use real citizen content.
- Acceptance: public API path works from the configured staging origin; private status cannot be read without the correct token; worker advances the synthetic submission without violating status-machine gates; cleanup returns staging to its prior zero-test-data baseline; relevant CI remains green.
- Safety: no production deploy, no real citizen data, no product-policy decision, no paid action.
