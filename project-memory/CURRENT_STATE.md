# WellFit Current State

Last reconciled: 2026-08-20

## Project role
This repository owns the **graphical WellFit domain**: landing page, visual system, UI/UX, screens, design assets and product presentation.

- `Bernds-tech/WellFit-now` owns the technical product implementation: web/backend, auth, data, APIs, mission/economy/server authority and technical mobile application logic outside the Buddy domain.
- `Bernds-tech/WellFit-Buddy` owns the Buddy domain: Buddy behavior, Buddy presentation/animation and Buddy-specific AR/camera interaction.
- Cross-repository UI or Buddy work must use an explicit contract/change/task ID; repository location must not silently redefine responsibility.

## Current physical-code reality
- Most existing product UI/landing implementation still physically lives in `WellFit-now`.
- PR #2 (`agent/import-wellfit-landingpage`) is the current candidate visual import into this graphical repository, but it is still an old draft, is currently not mergeable, and has no current exact-head GitHub Actions evidence.
- PR #1 is an obsolete/incorrect product-direction branch (flavor/size/subscription product preview) and must not be treated as current WellFit product truth.

## Current direction
- Establish one canonical visual baseline instead of parallel landing/design variants.
- Keep graphics aligned with actual technical capability in WellFit-now and actual Buddy capability in WellFit-Buddy.
- Reconcile PR #2 against current `main`, current technical contracts and current visual direction before accepting or replacing it.

## Do not repeat by default
- Do not rebuild technical backend/mobile product logic here.
- Do not recreate Buddy runtime/AR behavior here.
- Do not introduce a parallel visual system without classifying existing visual branches/assets first.
- Do not merge PR #1.

Before changing product visuals, inspect current `main`, active visual branches/PRs, `WELLFIT_MASTER_STATE.json`, the relevant WellFit-now capability state and the relevant WellFit-Buddy capability state.