# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active/stale locks

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
## LOCK-WERK-LAB-002
- Task: WERK-LAB-002
- Status: RELEASED
- Holder: Codex current WERK continuation
- Acquired: 2026-09-05 UTC
- Scope: labour JSON, labour validation/workflow, dependent WERK registers and WERK project memory only.
- Branch: werk-v49-preview-host
- Released: 2026-09-05 UTC after local verification and commit 869423f.
- Receipt: WERK_LABOUR_HANDOFF.md; publication blocked by automatic approval review; no remote update or deployment occurred.

### WERK-LAB-002 publication continuation — 2026-09-06
- Status: RELEASED
- Holder: Codex WERK continuation 2026-09-06
- Scope: publication receipt and WERK-specific memory reconciliation only.
- Previous lock reconciled: local implementation preserved; owner answered the concrete publication request with “Weiter”.
- Remote implementation: 00bed9975f07435920fd02414a071467532f73a6; all 13 triggered checks succeeded.
- Released: 2026-09-06 after exact-commit CI verification and preparation of the publication receipt.

## LOCK-WERK-LAB-003
- Task: WERK-LAB-003
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-06
- Scope: same-period regional labour source reconciliation, occupation supply acquisition and dependent data contracts; existing WERK branch only.
- Released: 2026-09-06 after publication and exact-commit success of all 13 workflows; receipt WERK_LABOUR_003_CI_RECEIPT.json.

## LOCK-WERK-LAB-004
- Task: WERK-LAB-004
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-06
- Scope: qualification and working-time evidence for August, no invented joint distribution; existing WERK branch.
- Released: 2026-09-06 after exact-implementation success of all 13 workflows and preparation of WERK_LABOUR_004_CI_RECEIPT.json.

## LOCK-WERK-LAB-005
- Task: WERK-LAB-005
- Status: ACTIVE
- Risk: R2
- Holder: Codex WERK continuation 2026-09-06
- Scope: working-time wishes/care evidence and dependent WERK data contracts on existing branch.
