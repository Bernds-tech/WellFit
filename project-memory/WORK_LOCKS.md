# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active/stale locks

## LOCK-WFG-MOBILE-UX-001
- Task: WFG-MOBILE-UX-001
- Status: ACTIVE
- Risk: R3
- Holder: Codex session 2026-08-26
- Branch/PR: `codex/wf-mobile-one-screen-ar-shell-20260826` / PR pending
- Acquired: 2026-08-26 Europe/Vienna
- Scope: canonical one-screen AR mobile UX contract and master registry reconciliation only; no visual runtime, backend or Unity controller implementation.
- Resume from: WellFit main plus owner decision of 2026-08-26.
- Recovery: revert/discard only this specification branch; runtime repositories remain unchanged.

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

No additional locks recorded.