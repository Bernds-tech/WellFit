# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active/stale locks

## LOCK-WFG-RUDI-WORLD-001
- Task: WFG-RUDI-WORLD-001
- Status: ACTIVE
- Risk: R2
- Holder: ChatGPT session 2026-09-05/06
- Branch/PR: repository preparation completed through WellFit PR #30; no further repository implementation branch is required for the next Site-specific step. Physical implementation merged through WellFit-now PR #401; coordination baseline merged through WellFit PR #29.
- Acquired: 2026-09-05 Europe/Vienna
- Updated: 2026-09-06 Europe/Vienna
- Scope: graphical Site synchronization and visual acceptance for DOM-bound Rudi Landingpage behavior: exact-source manifest, physical footing, letter/surface traversal, scroll-with-surface, visible climb routes, front/back layering and exact public-Site acceptance. No backend/auth/reward/economy/location/camera/native runtime authority.
- Runtime source: WellFit-now main `9ae4f278a90d17d612f0399c40babd32c344e02b`, squash-merged from PR #401 exact head `54186ec16a617549acbaa0437b0b81ab36ee2abb` after Build #1285, Container #270, Database #262, Beta Emulator #241 and Project Memory Guard/Quality/Status all passed.
- Sync contract: WellFit main `c7f5e70a49faed5dab1ab88ecd6e75385736aaeb` contains `project-memory/RUDI_SITE_SYNC_MANIFEST.json`, merged through PR #30 after Guard/Quality/Status all passed. It pins the exact source files/blob SHAs, asset root, dependency versions, forbidden behaviors and ten required Site visual checks.
- Resume from: the exact editable `wellfit-bewegt` ChatGPT Site source. Apply the pinned sync manifest, preview in real WebGL and accept only if all required checks pass. Do not restart the deleted viewport-bound controller.

## LOCK-WFG-VIS-001
- Task: WFG-VIS-001
- Status: STALE
- Holder: legacy branch/agent ownership; exact session no longer authoritative
- Branch/PR: `agent/import-wellfit-landingpage` / PR #2
- Acquired: work existed by 2026-08-15
- Updated: 2026-08-20
- Scope: graphical/landing/UI candidate baseline only
- Resume from: reconcile PR #2 against current main and cross-repo capability before modifying visual product code
- Released: not released; stale until deliberately resumed or superseded

## Released/superseded locks

## LOCK-WFG-MOBILE-UX-001
- Task: WFG-MOBILE-UX-001
- Status: RELEASED
- Risk: R3
- Holder: Codex session 2026-08-26
- Branch/PR: `codex/wf-mobile-one-screen-ar-shell-20260826` / PR #22
- Acquired: 2026-08-26 Europe/Vienna
- Released: 2026-08-26 after bounded diff and green Guard/Quality countercheck.
- Scope: canonical one-screen AR mobile UX contract and master registry reconciliation only; no visual runtime, backend or Unity controller implementation.
- Result: specification and coordination records created; runtime gates remain open.
- Recovery: revert PR #22; runtime repositories remain unchanged.

No additional locks recorded.
