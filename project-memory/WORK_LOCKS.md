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
- Holder: ChatGPT session 2026-09-05
- Branch/PR: `codex/rudi-living-world-coordination-20260905` / WellFit coordination PR pending; physical implementation in WellFit-now PR #401
- Acquired: 2026-09-05 Europe/Vienna
- Scope: graphical authority and coordination for DOM-bound Rudi Landingpage behavior: physical footing, letter/surface traversal, scroll-with-surface, visible climb routes, front/back layering and exact public-Site visual acceptance. No backend/auth/reward/economy/location/camera/native runtime authority.
- Resume from: WellFit-now PR #401 exact head `0240d7542d5451ab052743b605275a5cae895f7a` is fully green in Build/Container/Database/Beta Emulator/Project Memory. Continue deterministic route hardening and memory reconciliation; public Site synchronization remains separate.

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