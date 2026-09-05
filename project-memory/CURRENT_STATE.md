# WellFit Current State

Last reconciled: 2026-09-05

## Project role
This repository owns the **graphical WellFit domain**: landing page, visual system, UI/UX, screens, design assets and product presentation.

- `Bernds-tech/WellFit-now` owns the technical product implementation: web/backend, auth, data, APIs, mission/economy/server authority and technical mobile application logic outside the Buddy domain.
- `Bernds-tech/WellFit-Buddy` owns the Buddy domain: Buddy behavior, Buddy presentation/animation and Buddy-specific AR/camera interaction.
- Cross-repository UI or Buddy work must use an explicit contract/change/task ID; repository location must not silently redefine responsibility.

## Current physical-code reality
- Most current product UI/landing implementation still physically lives in `WellFit-now`; this ownership drift remains governed by `WF-MIG-001`.
- WellFit `main` is currently `649a3b647dd6162f402663f2d84b8ca201f45400` and remains remotely unprotected; branch+PR discipline therefore remains mandatory by policy.
- PR #2 (`agent/import-wellfit-landingpage`) remains a historical graphical candidate, not the canonical accepted baseline. Its old exact-head evidence is stale and it must not be treated as authoritative over newer live/public work.
- PR #28 (`codex/public-info-audit-20260905`) is a current documentation-only audit of the visible public information pages; it changes only `project-memory/PUBLIC_INFO_AUDIT_2026-09-05.md` and does not itself implement fixes.
- A newer owner-directed graphical bridge is active as `WFG-RUDI-WORLD-001`: physical implementation is in WellFit-now PR #401 on `codex/rudi-3d-living-avatar-20260905` because that is where the current landing runtime physically resides.

## Active Rudi graphical direction
- Owner direction 2026-09-05: Rudi Rastlos is a physical resident of the Landingpage, not a viewport-following mascot. He may climb and stand on letters, words, cards, images, lines and other actual page surfaces; when the page scrolls, he moves with the exact bound element and may completely leave the viewport. He must not hover, fly, visibly teleport or air-climb.
- Current implementation authority: WellFit graphical task `WFG-RUDI-WORLD-001` / change `WFG-CR-008`; physical bridge `WFN-RUDI-3D-001`; cross-repo lock `XLOCK-WF-RUDI-WORLD-20260905`.
- Current exact implementation: WellFit-now PR #401 head `0240d7542d5451ab052743b605275a5cae895f7a`. The controller uses real DOM geometry (`getBoundingClientRect()`), `hero-wellfit-4` (`F`) as the initial climb/podium, no viewport clamp, scroll-settle + complete-offscreen catch-up, visible route guidance and machine validation through `npm run rudi:validate`.
- Exact-head CI is green: Build #1260, Container #245, Database #237, Beta Emulator #216 and Project Memory Guard/Quality/Status.
- Acceptance boundary: this is repository implementation evidence only. The public `wellfit-bewegt` ChatGPT Site is a separate editable/deployable source and has not been proven synchronized to this exact DOM-bound version; direct browser/device visual acceptance remains required.

## Current direction
- Local background action remains `WF-VISUAL-CANONICAL-INVENTORY`, but the explicit owner-directed active visual task `WFG-RUDI-WORLD-001` takes execution priority until the Rudi Landingpage behavior is physically coherent and visually accepted.
- Keep graphics aligned with actual technical capability in WellFit-now and actual Buddy capability in WellFit-Buddy.
- Do not create another parallel Landingpage or another independent Rudi implementation; continue the registered bridge and later reconcile it into `WF-MIG-001` graphical convergence.

## Do not repeat by default
- Do not rebuild technical backend/mobile product logic here.
- Do not recreate native Buddy runtime/AR behavior here.
- Do not reintroduce viewport-clamped Rudi positioning or a mascot that stays onscreen when its bound page surface has scrolled away.
- Do not equate GitHub green CI with public ChatGPT Site publication or owner visual acceptance.
- Do not restart the superseded whole-image pointer-attention path.
- Do not introduce a parallel visual system without classifying existing visual branches/assets first.
- Do not merge PR #1.

Before changing product visuals, inspect current `main`, active visual branches/PRs, `WELLFIT_MASTER_STATE.json`, the relevant WellFit-now capability state and the relevant WellFit-Buddy capability state.

## Accepted mobile target (not runtime evidence)
- Owner decision 2026-08-26: the phone game uses one persistent full-screen camera/AR world with only a small WellFit logo and opposite three-line menu as permanent navigation chrome.
- Buddy care, daily/weekly missions, adventures/challenges, arenas, mayor/checkpoints and essential settings open as overlays; deeper configuration remains PC-first.
- Canonical specification: `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md` / `WF-CONTRACT-MOBILE-SHELL-001`.
- Evidence boundary: this is accepted target UX, not proof of graphical implementation, Unity compilation, Android build or real-device behavior.
