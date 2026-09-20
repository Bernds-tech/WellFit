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

## WERK autonomous continuation — 2026-09-20 · no-login privacy rights
- Selected action: `WERK-IDEENWERK-PRIVACY-001`
- Status: `VERIFIED_STAGING`
- Risk: `R2`.
- Result: the existing hashed status-token boundary now protects private data export and create/list flows for correction, deletion, restriction and cluster-appeal requests. The existing V71 protected status view exposes these rights without a new page. Deletion is an auditable review request only and never performs automatic hard deletion. Migration `022_privacy_citizen_access` is active in WERK Österreich Staging and `werk-ideenwerk-api` is active at Edge version 4. Frontend Check #136 and IDEENWERK Backend Check #99 succeeded. Real HTTPS staging checks proved export, wrong-token denial, correction intake and replay deduplication. A PII-fixture regression was found and fixed: numeric run timestamps inside the synthetic citizen text could look like phone numbers; the PII-neutral fixture now progresses to `precheck` with audited `STANDARD / standard_review`. Synthetic records were cleaned back to the zero-data staging baseline. See `WERK_IDEENWERK_PRIVACY_001_RECEIPT.json`.
- Safety retained: no production release, paid action, irreversible external change, political score or automatic acceptance/rejection was introduced.

## WERK autonomous continuation — 2026-09-20 · privacy resolution + citizen transparency
- Selected action: `WERK-IDEENWERK-PRIVACY-RESOLUTION-TRANSPARENCY-001`
- Status: `VERIFIED_STAGING`
- Risk: `R2`.
- Result: migration `023_privacy_operator_resolution` provides the bounded, role-guarded and reason-coded operator workflow `received -> reviewing -> resolved/rejected` without destructive execution. Migration `024_privacy_resolution_transparency` now returns `review_started_at`, `resolved_at` and the recorded decision reason through the existing protected citizen status/list/export contracts, while operator identity remains private. The reversible staging contract test passed and staging returned to the zero-data baseline. IDEENWERK Backend Check #105 succeeded on functional head `473c5f02541b737c61bad80116b901c8060fa5d1`, including migration/idempotency, operator/privacy guardrails, the new citizen-transparency guardrail, backup/restore, clustering diagnostic and 1,000-item queue integration. See `WERK_IDEENWERK_PRIVACY_RESOLUTION_TRANSPARENCY_001_RECEIPT.json`.
- Regression handled: the first CI integration exposed two staging-vs-portable-CI assumptions (staging-only runtime metadata and pgcrypto schema placement). Both were corrected; no production or destructive data action was performed.
- Safety retained: no hard delete, anonymisation, restriction execution, operator identity disclosure, production release, paid action or political decision was introduced.

## WERK autonomous continuation — next slice
- Selected action: `WERK-IDEENWERK-PRIVACY-LIFECYCLE-UI-001`
- Status: `EXECUTABLE`
- Risk: `R1-R2`.
- Why next: the backend now records and exposes the full privacy-review lifecycle, but the existing V71 protected IDEENWERK status panel still renders only the raw request state plus creation time/reason. The next smallest functional improvement is to make the already-available lifecycle understandable to the citizen in the existing surface.
- Exact next work: update only the existing `werk-assets/site-ideenwerk-v2.js` request rendering to localize `received`, `reviewing`, `resolved` and `rejected`, show `review_started_at`/`resolved_at` where present, keep the status-token boundary unchanged, avoid operator identity, bump the existing loader cache key, and run the current frontend gate plus relevant backend contract checks.
- Acceptance: no parallel page; no new political inference; raw operator identity remains absent; lifecycle labels and timestamps render from the existing protected API; syntax/frontend checks pass; staging API remains clean; no production deploy.
- Architecture note: do not expose `ideenwerk_operator_transition_privacy_request` through the current public `werk-ideenwerk-api` boundary until a separate authenticated operator trust boundary is defined. The current service-role-only DB guardrail remains the safe boundary.
