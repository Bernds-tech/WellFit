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
- Branch/PR: repository preparation/coordination completed through WellFit PR #34; physical implementation/hardening through WellFit-now PRs #401/#402; technical memory closeout through WellFit-now PR #403.
- Acquired: 2026-09-05 Europe/Vienna
- Updated: 2026-09-06 Europe/Vienna
- Scope: graphical Site synchronization and visual acceptance for DOM-bound Rudi Landingpage behavior: exact-source manifest, physical footing, letter/surface traversal, scroll-with-surface, visible climb routes, front/back layering, reduced-motion/static behavior and exact public-Site acceptance. No backend/auth/reward/economy/location/camera/native runtime authority.
- Runtime source: hardened WellFit-now merge `b07d39938aeab4e32eddac7d19b8e15e22afacb7`, with technical closeout PR #403 merged as `40af0c25725e4bec096db690da808ad669691f2e`. The WellFit-now technical Rudi lock is released; do not start another technical Rudi implementation from this graphical lock.
- Sync contract: WellFit PR #34 merge `0f80f1a8d6a31f368743ea04c47353c37a9e91f2` advanced `project-memory/RUDI_SITE_SYNC_MANIFEST.json` to hardened source `b07d399...`, updated source blobs and fail-closed fallback/loading invariants while retaining ten required Site visual checks.
- Resume from: the exact editable `wellfit-bewegt` ChatGPT Site source. Apply the current manifest, preview in real WebGL and accept/publish only if all required checks pass. Do not restart the deleted viewport-bound controller, Site-v105 behavior or old props scenes.

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
