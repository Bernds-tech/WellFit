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
