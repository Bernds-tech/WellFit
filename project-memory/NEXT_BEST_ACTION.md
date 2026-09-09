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
Current continuation: WERK_SUBSIDY_HANDOFF.md. Official 15,802-record subsidy CSV normalized; 2025 annual/monthly and 24 UG2024 controls reconciled. 1,035 account/classes and20 review priorities added. Program/legal/cofinancing/outcome attribution remains open; no extra financing. All five final local workflow bodies passed; final missing-annual-class guard passed importer and negative checks. Exact-commit remote CI pending.
