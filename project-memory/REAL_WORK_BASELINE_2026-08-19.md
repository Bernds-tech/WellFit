# WellFit Real Work Baseline — 2026-08-19

## Evidence-based current truth

- This repository is the intended authority for WellFit visual/landing/UI work and the V9 program master.
- Current `main` contains Project Memory/governance and scripts, but no migrated product runtime/landing implementation.
- The actual public landing and large parts of current UI remain physically implemented in `Bernds-tech/WellFit-now`.
- A recent proven landing change in WellFit-now is PR #362, which brightened the landing hero/stage without changing auth, Firebase, missions, economy, Unity or AR.
- Therefore visual ownership is **defined but not yet physically migrated**.

## Real visual work already present in the wider WellFit program

- Public landing and entry experience.
- Dashboard and settings visual shells.
- Mission surfaces including daily, weekly, adventure, challenge, competitions, favorites and history.
- Buddy, mobile-web and AR fallback presentation.
- Help/FAQ/legal surfaces.
- A brighter Buddy-oriented landing hero composition exists in WellFit-now history.

## Current gaps

1. Establish which current visual/landing files in WellFit-now remain canonical after the newer graphical redesign work.
2. Decide the first safe migration unit into this repository; do not copy the entire app blindly.
3. Keep UI claims aligned with implemented backend/native capabilities.
4. Preserve the option to later converge all three repositories again; any interim migration must be reversible and recorded in `CONVERGENCE_LEDGER.json`.

## Do not assume

- Do not claim this repo currently serves the live/working WellFit UI.
- Do not claim visual acceptance merely because WellFit-now has code.
- Do not rebuild backend/native features here.
- Do not duplicate landing/UI implementation before source/destination ownership is explicitly reconciled.

## Next safe visual work

Inventory the current canonical landing/UI paths in WellFit-now versus the newer graphical design, classify each as KEEP / REPLACE / MIGRATE LATER / OBSOLETE, and create the first reviewed convergence/migration candidate without moving product code yet.
