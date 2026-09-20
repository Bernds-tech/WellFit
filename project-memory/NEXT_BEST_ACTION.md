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

## WERK autonomous continuation — 2026-09-20 · review-path transparency
- Selected action: `WERK-IDEENWERK-REVIEW-PATH-TRANSPARENCY`
- Status: `VERIFIED_STAGING`
- Risk: `R2`.
- Result: protected citizen status now returns the latest audited FAST/STANDARD/DEEP procedural review path; public transparency returns aggregate review-depth metrics with small-sample bucket suppression; the existing V71 IDEENWERK surfaces render both without a parallel page. Migration `021_review_path_transparency` is active in WERK Österreich Staging; Edge function `werk-ideenwerk-api` is active at version 3. Backend Check #97 and Frontend Checks #131/#132 succeeded. Synthetic verification was cleaned to the zero-data staging baseline. See `WERK_IDEENWERK_REVIEW_PATH_TRANSPARENCY_001_RECEIPT.json`.
- Safety retained: review depth is procedural only; no political merit score, automatic acceptance/rejection or new political inference was introduced.

## WERK autonomous continuation — next slice
- Selected action: `WERK-IDEENWERK-PRIVACY-RIGHTS-001`
- Status: `EXECUTABLE`
- Risk: `R2` because it extends the existing status-token boundary and records reversible requests; it must not perform irreversible deletion automatically.
- Why next: the published no-login privacy contract promises export, correction, deletion, restriction and cluster-appeal rights, and the database already has `privacy_requests`, but the real staging Edge API still lacks the protected privacy export/request/list routes. This is now a larger functional citizen gap than adding another concept layer.
- Exact next work: reuse the existing hashed status-token authorization; implement token-protected private export plus create/list privacy requests using the existing `privacy_requests` table and audit log; keep deletion/restriction as reviewable requests rather than automatic destructive actions; expose the request status inside the existing IDEENWERK citizen-status surface; add E2E assertions and clean synthetic data back to baseline.
- Acceptance: correct token can export only its own submission data and create/list only its own privacy requests; invalid/missing token is denied; request types are strictly bounded to the existing contract; every request is auditable; no raw token is persisted; no request automatically deletes data; CI and reversible staging verification pass; no production deploy.
- Safety: no new login, identity profile or public personal-data exposure; no irreversible privacy action without the existing review path and explicit later operator/legal handling.
