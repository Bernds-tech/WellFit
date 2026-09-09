# WellFit Current State

Last reconciled: 2026-08-20

## Project role
This repository owns the **graphical WellFit domain**: landing page, visual system, UI/UX, screens, design assets and product presentation.

- `Bernds-tech/WellFit-now` owns the technical product implementation: web/backend, auth, data, APIs, mission/economy/server authority and technical mobile application logic outside the Buddy domain.
- `Bernds-tech/WellFit-Buddy` owns the Buddy domain: Buddy behavior, Buddy presentation/animation and Buddy-specific AR/camera interaction.
- Cross-repository UI or Buddy work must use an explicit contract/change/task ID; repository location must not silently redefine responsibility.

## Current physical-code reality
- Most existing product UI/landing implementation still physically lives in `WellFit-now`.
- PR #2 (`agent/import-wellfit-landingpage`) is the current candidate visual import into this graphical repository. Fresh GitHub metadata on 2026-08-20 reports it as **draft and mergeable**, but it is based on an older `main` and has **no GitHub Actions runs on exact head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`**. Mergeability alone is not acceptance.
- PR #1 is an obsolete/incorrect product-direction branch (flavor/size/subscription product preview) and must not be treated as current WellFit product truth.

## Current direction
- Selected local action: `WF-VISUAL-CANONICAL-INVENTORY`
- Establish one canonical visual baseline instead of parallel landing/design variants.
- Keep graphics aligned with actual technical capability in WellFit-now and actual Buddy capability in WellFit-Buddy.
- Reconcile PR #2 against current `main`, current technical contracts and current visual direction before accepting or replacing it.

## Do not repeat by default
- Do not rebuild technical backend/mobile product logic here.
- Do not recreate Buddy runtime/AR behavior here.
- Do not introduce a parallel visual system without classifying existing visual branches/assets first.
- Do not merge PR #1.
- Do not treat GitHub `mergeable=true` as visual/CI acceptance.

Before changing product visuals, inspect current `main`, active visual branches/PRs, `WELLFIT_MASTER_STATE.json`, the relevant WellFit-now capability state and the relevant WellFit-Buddy capability state.

## Accepted mobile target (not runtime evidence)
- Owner decision 2026-08-26: the phone game uses one persistent full-screen camera/AR world with only a small WellFit logo and opposite three-line menu as permanent navigation chrome.
- Buddy care, daily/weekly missions, adventures/challenges, arenas, mayor/checkpoints and essential settings open as overlays; deeper configuration remains PC-first.
- Canonical specification: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md` / `WF-CONTRACT-MOBILE-SHELL-001`.
- Evidence boundary: this is accepted target UX, not proof of graphical implementation, Unity compilation, Android build or real-device behavior.

## WERK-SV-008 — 2026-09-08
Continuous ALV candidates calculated: 36 net variants/288 comparisons and 15 provisional 2027 cohort contribution variants/75 comparisons. Report WERK_SV_STETIGE_BEITRAEGE.md. National costs, implementation and financing remain open. See WERK_SV_HANDOFF.md; technical verification does not adopt the candidate.

## WERK-SV-009 — 2026-09-08
DVSV2024 distribution imported: 9 sheets/129 rows/1161 quartile cells. 18 conditional cost bounds and18 equal-annual-income non-identification examples. WERK_SV_VERTEILUNG_KOSTENGRENZEN.md; national cost not identified.

## WERK-SV-010 — 2026-09-08
72 conditional ALV interval cases,9 cent partitions and18 aggregate examples. Exact sums usable only within affine segments; legal assessment/base/payer gates and draft administrative input specification added. WERK_SV_INTERVALLKOSTEN.md. WERK-only factual addition; no WellFit role or acceptance change.

## WERK-SV-011 — 2026-09-08
42 official debt-flow values and336 conditional primary/interest/relief funding bridges added. WERK_SV_FINANZIERUNGSBRUECKE.md. No change to WellFit role/acceptance or existing WERK engine inputs.

## WERK-TAX-001 continuation — 2026-09-08
ABB2025 source and outcome-stage reconciliation plus 27 conditional incremental enforcement break-even cases added. See WERK_TAX_HANDOFF.md and WERK_STEUERVOLLZUG_RECHNUNG.md. All five relevant local workflow bodies and all four triggered remote workflows passed at abcc4a3c577d52dcc0532f1ecbc05ad833479077; WERK_TAX_001_CI_RECEIPT.json. Next evidence: additional collected tax/finality/cost cohorts beyond government baseline, source headline and budget discrepancy reconciliation. No new verified financing.

## WERK-SUB-001 — 2026-09-09
Current continuation: WERK_SUBSIDY_HANDOFF.md. Official 15,802-record subsidy CSV normalized; 2025 annual/monthly and 24 UG2024 controls reconciled. 1,035 account/classes and20 review priorities added. Program/legal/cofinancing/outcome attribution remains open; no extra financing. All five final local workflow bodies passed; final missing-annual-class guard passed importer and negative checks. Exact-commit remote CI pending.
