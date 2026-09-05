# WellFit Current State

Last reconciled: 2026-09-06
- Selected local action: `WF-VISUAL-CANONICAL-INVENTORY`

## Project role
This repository owns the **graphical WellFit domain**: landing page, visual system, UI/UX, screens, design assets and product presentation.

- `Bernds-tech/WellFit-now` owns the technical product implementation: web/backend, auth, data, APIs, mission/economy/server authority and technical mobile application logic outside the Buddy domain.
- `Bernds-tech/WellFit-Buddy` owns the Buddy domain: Buddy behavior, Buddy presentation/animation and Buddy-specific AR/camera interaction.
- Cross-repository UI or Buddy work must use an explicit contract/change/task ID; repository location must not silently redefine responsibility.

## Current physical-code reality
- Most current product UI/landing implementation still physically lives in `WellFit-now`; this ownership drift remains governed by `WF-MIG-001`.
- WellFit `main` is currently `d0d5d6ae42f2e5dccb9387c31ecc36f798329eb9` and remains remotely unprotected; branch+PR discipline therefore remains mandatory by policy.
- PR #2 (`agent/import-wellfit-landingpage`) remains a historical graphical candidate, not the canonical accepted baseline. Its old exact-head evidence is stale and it must not be treated as authoritative over newer live/public work.
- PR #28 (`codex/public-info-audit-20260905`) remains a documentation-only audit of the visible public information pages; it does not implement the Rudi runtime.
- Owner-directed graphical task `WFG-RUDI-WORLD-001` remains active for public-Site synchronization/visual acceptance. Its physical web implementation is merged in WellFit-now main as `9ae4f278a90d17d612f0399c40babd32c344e02b` through PR #401.
- WellFit PR #29 merged the graphical coordination baseline as `bedfcdcbc0c5864ba4d9fc2deeb5b67dcb7cf033`.
- WellFit PR #30 merged `project-memory/RUDI_SITE_SYNC_MANIFEST.json` as `c7f5e70a49faed5dab1ab88ecd6e75385736aaeb`; PR #31 then finalized the Site-specific handoff on current main `d0d5d6ae42f2e5dccb9387c31ecc36f798329eb9`.

## Active Rudi graphical direction
- Owner direction 2026-09-05: Rudi Rastlos is a physical resident of the Landingpage, not a viewport-following mascot. He may climb and stand on letters, words, cards, images, lines and other actual page surfaces; when the page scrolls, he moves with the exact bound element and may completely leave the viewport. He must not hover, fly, visibly teleport or air-climb.
- Graphical authority remains `WFG-RUDI-WORLD-001` / `WFG-CR-008`. The cross-repo implementation lock `XLOCK-WF-RUDI-WORLD-20260905` is released because the WellFit-now bridge is merged; remaining work is graphical Site synchronization/visual acceptance only.
- Merged implementation: WellFit-now main `9ae4f278a90d17d612f0399c40babd32c344e02b`, produced from PR #401 exact head `54186ec16a617549acbaa0437b0b81ab36ee2abb`.
- The immutable Site-transfer contract is `project-memory/RUDI_SITE_SYNC_MANIFEST.json`; it pins the exact WellFit-now source files/blob SHAs, Rudi assets, dependencies, forbidden behaviors and ten fail-closed visual checks for the existing `wellfit-bewegt` Site.
- The `F` in `WellFit` (`hero-wellfit-4`) is the first climb/podium. Narrow explicit letters and thin lines/ledges remain valid physical surfaces; random tiny generic DOM fragments are excluded.
- Runtime footing, climb edges, full-offscreen detection, catch-up origins, visible route geometry, reachability and autonomous surface-to-surface journeys share one geometry authority: `app/components/landing/rudiWorldGeometry.mjs`.
- Rudi has no viewport clamp. If his bound surface scrolls away, he leaves the viewport with it. Catch-up begins only after the whole surface is offscreen and scrolling settles.
- Catch-up and autonomous relocation use a physically legible route: walk horizontally, follow a visible connector, climb vertically along the target edge, then walk onto the target surface. Imported root translation is flattened so the DOM route—not GLB root motion—owns physical position.
- CTA attention affects gaze/body response but does not pull him through empty space and is cleared on scroll.
- The previous parallel `LivingRudi3D.tsx` viewport/chapter controller is deleted. This prevents the old viewport-lag/chapter model from competing with the DOM world.
- Lifecycle/accessibility hardening is merged: Strict-Effects-safe animation restart, shared cancellable motion timer, model-ready initial climb timing, no 3D mount below desktop, static fallback for reduced motion, no eager GLTF preloads, Canvas pointer pass-through and static fallback on Canvas/GLTF errors.
- Manual Meshy support is also hardened: no default-branch materialization, selectable source run IDs, generated-tree Rudi/lint/type/build checks before bot push and preservation of partial paid living-action artifacts.
- `npm run rudi:validate` includes deterministic geometry and source invariants for the physical-world contract.
- Exact PR #401 head `54186ec16a617549acbaa0437b0b81ab36ee2abb` passed Build #1285, Container #270, Database #262, Beta Emulator #241 and Project Memory Guard/Quality/Status before squash merge.
- Acceptance boundary: repository implementation and Site-transfer preparation are complete, but the separate public `wellfit-bewegt` ChatGPT Site is not proven synchronized to this DOM-bound version. Site version 105 belongs to the older renderer generation. Exact Site-source synchronization plus real-WebGL owner/device visual acceptance remain required.

## Current direction
- Immediate graphical priority remains `WFG-RUDI-WORLD-001`: synchronize the merged DOM-bound implementation into the actual editable `wellfit-bewegt` Site using `RUDI_SITE_SYNC_MANIFEST.json`, preview it, visually countercheck the physical contact/scroll/catch-up/layering behavior, then publish deliberately only if all required checks pass.
- Local background action remains `WF-VISUAL-CANONICAL-INVENTORY` and resumes after Rudi is visually accepted on the target public surface.
- Keep graphics aligned with actual technical capability in WellFit-now and actual Buddy capability in WellFit-Buddy.
- Do not create another parallel Landingpage or another independent Rudi implementation; use merged WellFit-now main as the source bridge until `WF-MIG-001` physically moves graphical ownership.

## Do not repeat by default
- Do not rebuild technical backend/mobile product logic here.
- Do not recreate native Buddy runtime/AR behavior here.
- Do not reintroduce viewport-clamped Rudi positioning or a mascot that stays onscreen when its bound page surface has scrolled away.
- Do not reintroduce the older viewport-lag/chapter controller as the target behavior.
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
