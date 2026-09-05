# Project Memory Protocol v9

Operational memory for the WellFit visual/landing/UI repository and the authoritative WellFit program-level orchestration memory.

## Mandatory preflight
1. Read `AGENTS.md`, `CURRENT_STATE.md`, `PROJECT_FINISHLINE.md`, `FINISHLINE_STATE.json`, `NEXT_BEST_ACTION.md`, `AUTO_HANDOFF.md`, `OWNER_ACTION_INBOX.md`, `SESSION_HANDOFF.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
2. For cross-repository work also read `PROJECT_COORDINATION.json`, `WELLFIT_MASTER_STATE.json`, `CROSS_REPO_DEPENDENCIES.json`, `CONTRACT_REGISTRY.json`, `INTEGRATION_GATES.json`, `CROSS_REPO_LOCKS.md`, `CONVERGENCE_PLAN.json`, `CONVERGENCE_LEDGER.json` and `WELLFIT_MASTER_NEXT_ACTION.md`.
3. Search `FAILED_ATTEMPTS.md`, `DO_NOT_ASSUME.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md` and `CHANGE_REQUESTS.md` before repeating or extending prior work.
4. Reconcile live GitHub branch tips, main/PR/CI state and current WellFit-now/WellFit-Buddy capability evidence when the UI makes technical claims. Mutable refs such as `main` are live evidence and must be queried during preflight; do not persist a branch tip in tracked memory as a static claim that it is "current". Persist immutable merge/exact-head/evidence SHAs only as historical facts.
5. Validate evidence freshness via `EVIDENCE_TTL.json` and tracked truth drift via `DRIFT_BASELINE.json`.
6. If an owner-only action is deferred, keep it visible in `OWNER_ACTION_INBOX.md` and continue only with safe unrelated work.

## V4 — Execution continuity
`STARTED_WORK.md`, `WORK_LOCKS.md`, `EXECUTION_RECEIPTS.md` and `RECONCILIATION.md` preserve unfinished work across chats/sessions. A stale lock is not free until reconciled.

## V5 — Quality and countercheck
`QUALITY_CONTROL.md`, `COUNTERCHECK_POLICY.md`, `ASSUMPTIONS.md` and `CONTRADICTIONS.md` enforce R1–R4 risk, evidence quorum, regression checks, rollback/recovery where applicable and the falsification question.

## V6 — Finishline and external acceptance
`PROJECT_FINISHLINE.md`, `FINISHLINE_STATE.json` and `EXTERNAL_ACCEPTANCE.md` separate implementation from acceptance.

## V7 — Freshness, drift, milestones and governance
`EVIDENCE_TTL.json`, `DRIFT_BASELINE.json`, `BRANCH_PROTECTION_CONTRACT.json` and `milestones/` prevent stale success and preserve accepted snapshots.

## V8 — Cross-chat, impact, owner inbox, auto-handoff and convergence
`MEMORY_V8_CONTROLS.json`, `OWNER_ACTION_INBOX.md`, `NEXT_BEST_ACTION.md`, `AUTO_HANDOFF.md` and `CONVERGENCE_PLAN.json` provide local cross-chat resilience and planned-but-unscheduled convergence.

## V9 — Multi-repository orchestration
`WELLFIT_MASTER_STATE.json` is the single program-level coordination authority while the repositories remain separate. `CROSS_REPO_DEPENDENCIES.json`, `CONTRACT_REGISTRY.json`, `INTEGRATION_GATES.json`, `CROSS_REPO_LOCKS.md`, `CONVERGENCE_LEDGER.json` and `WELLFIT_MASTER_NEXT_ACTION.md` coordinate cross-repo work. Local repositories remain authoritative for their own domain truth; V9 must not create a second competing local truth.

## V9 rules
- Green local repositories do not imply a green integration gate.
- Any cross-repo API/event/shared state needs a stable `WF-CONTRACT-*` ID.
- Any blocking dependency needs a stable `WF-XDEP-*` ID.
- Any substantive cross-repo implementation needs an `XLOCK-*`.
- Contract changes require consumer impact review.
- Convergence may be big-bang or incremental; no target repository, date or strategy is assumed.
- Every concrete migration uses `WF-MIG-*` with source, destination, scope, dependencies, evidence and rollback.
- Mutable Git refs are never durable state identifiers. Store immutable revision evidence; query mutable refs live.

## Status and acceptance
Use `TODO`, `IN_PROGRESS`, `BLOCKED`, `PARTIAL`, `IMPLEMENTED`, `IMPLEMENTED_NOT_VERIFIED`, `VERIFIED`, `COUNTERCHECKED`, `ACCEPTED`, `PRODUCTION_CONFIRMED`, `NEEDS_REVALIDATION`, `RECONCILIATION_REQUIRED`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`.

## Postflight
After meaningful work, reconcile local memory plus all affected V9 master dependencies/contracts/integration gates/locks/convergence entries. Milestone acceptance requires an append-only snapshot.

Never store secrets, tokens, credentials or private user data here.
