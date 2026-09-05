# WellFit Current State

Last reconciled: 2026-09-05
- Selected local action: `WF-VISUAL-CANONICAL-INVENTORY`

## Project role
This repository owns the **graphical WellFit domain**: landing page, visual system, UI/UX, screens, design assets and product presentation.

- `Bernds-tech/WellFit-now` owns the technical product implementation: web/backend, auth, data, APIs, mission/economy/server authority and technical mobile application logic outside the Buddy domain.
- `Bernds-tech/WellFit-Buddy` owns the Buddy domain: Buddy behavior, Buddy presentation/animation and Buddy-specific AR/camera interaction.
- Cross-repository UI or Buddy work must use an explicit contract/change/task ID; repository location must not silently redefine responsibility.

## Current physical-code reality
- Most current product UI/landing implementation still physically lives in `WellFit-now`; this ownership drift remains governed by `WF-MIG-001`.
- WellFit `main` is currently `649a3b647dd6162f402663f2d84b8ca201f45400` and remains remotely unprotected; branch+PR discipline therefore remains mandatory by policy.
- PR #2 (`agent/import-wellfit-landingpage`) remains a historical graphical candidate, not the canonical accepted baseline. Its old exact-head evidence is stale and it must not be treated as authoritative over newer live/public work.
- PR #28 (`codex/public-info-audit-20260905`) is a documentation-only audit of the visible public information pages; it does not implement the Rudi runtime.
- Owner-directed graphical task `WFG-RUDI-WORLD-001` is active. Physical implementation is in WellFit-now PR #401 because the current landing runtime still lives there.

## Active Rudi graphical direction
- Owner direction 2026-09-05: Rudi Rastlos is a physical resident of the Landingpage, not a viewport-following mascot. He may climb and stand on letters, words, cards, images, lines and other actual page surfaces; when the page scrolls, he moves with the exact bound element and may completely leave the viewport. He must not hover, fly, visibly teleport or air-climb.
- Current implementation authority: WellFit graphical task `WFG-RUDI-WORLD-001` / change `WFG-CR-008`; physical bridge `WFN-RUDI-3D-001`; cross-repo lock `XLOCK-WF-RUDI-WORLD-20260905`.
- Verified runtime baseline: WellFit-now PR #401 implementation head `e19d15f3bbe51740d53d954dcb7777623d8cf3e6`. Later PR commits are Project-Memory reconciliation only and do not change the runtime behavior.
- The `F` in `WellFit` (`hero-wellfit-4`) is the first climb/podium. Narrow explicit letters and thin lines/ledges remain valid physical surfaces; random tiny generic DOM fragments are excluded.
- Runtime footing, climb edges, full-offscreen detection, catch-up origins, visible route geometry, reachability and autonomous surface-to-surface journeys share one geometry authority: `app/components/landing/rudiWorldGeometry.mjs`.
- Rudi has no viewport clamp. If his bound surface scrolls away, he leaves the viewport with it. Catch-up begins only after the whole surface is offscreen and scrolling settles.
- Catch-up and autonomous relocation use a physically legible route: walk horizontally, follow a visible connector, climb vertically along the target edge, then walk onto the target surface. CTA attention affects gaze/body response but does not pull him through empty space.
- `npm run rudi:validate` now includes deterministic geometry tests for scroll-follow, narrow letters, thin ledges, full-offscreen thresholds, catch-up direction, route-guide geometry, surface-to-surface journey sampling, walk/climb mode, reachability and journey duration.
- Runtime baseline `e19d15f3bbe51740d53d954dcb7777623d8cf3e6` passed Build #1275, Container #260, Database #252, Beta Emulator #231 and Project Memory Guard/Quality/Status. The current PR #401 head is undergoing fresh exact-head checks because Project Memory itself is part of the merge evidence.
- Acceptance boundary: repository CI proves implementation/invariants only. The separate public `wellfit-bewegt` ChatGPT Site is not claimed synchronized to this exact DOM-bound version; exact Site source synchronization plus real-WebGL owner/device visual acceptance remain required.

## Current direction
- Local background action remains `WF-VISUAL-CANONICAL-INVENTORY`, but the explicit owner-directed active visual task `WFG-RUDI-WORLD-001` takes execution priority until the Rudi Landingpage behavior is physically coherent and visually accepted.
- Keep graphics aligned with actual technical capability in WellFit-now and actual Buddy capability in WellFit-Buddy.
- Do not create another parallel Landingpage or another independent Rudi implementation; continue this registered bridge and later reconcile it into `WF-MIG-001` graphical convergence.

## Do not repeat by default
- Do not rebuild technical backend/mobile product logic here.
- Do not recreate native Buddy runtime/AR behavior here.
- Do not reintroduce viewport-clamped Rudi positioning or a mascot that stays onscreen when its bound page surface has scrolled away.
- Do not reintroduce the older viewport-lag/catch-up model as the target behavior.
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