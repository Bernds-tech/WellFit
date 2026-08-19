# Project Memory Protocol v8

Operational memory for the WellFit visual/landing/UI repository.

## Mandatory preflight
1. Read `AGENTS.md`, `CURRENT_STATE.md`, `PROJECT_FINISHLINE.md`, `FINISHLINE_STATE.json`, `NEXT_BEST_ACTION.md`, `AUTO_HANDOFF.md`, `OWNER_ACTION_INBOX.md`, `SESSION_HANDOFF.md`, `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
2. Read `CONVERGENCE_PLAN.json` before cross-repository work; visual/UI remains here until a responsibility is explicitly migrated.
3. Search `FAILED_ATTEMPTS.md`, `DO_NOT_ASSUME.md`, `ASSUMPTIONS.md`, `CONTRADICTIONS.md` and `CHANGE_REQUESTS.md` before repeating or extending prior work.
4. Reconcile current GitHub/main/PR/CI and current WellFit-now/WellFit-Buddy capability evidence when the UI makes technical claims.
5. Validate evidence freshness via `EVIDENCE_TTL.json` and tracked truth drift via `DRIFT_BASELINE.json`.
6. If an owner-only action is deferred, keep it visible in `OWNER_ACTION_INBOX.md` and continue only with safe unrelated work.

## V4 — Execution continuity
`STARTED_WORK.md`, `WORK_LOCKS.md`, `EXECUTION_RECEIPTS.md` and `RECONCILIATION.md` preserve unfinished work across chats/sessions. A stale lock is not free until reconciled.

## V5 — Quality and countercheck
`QUALITY_CONTROL.md`, `COUNTERCHECK_POLICY.md`, `ASSUMPTIONS.md` and `CONTRADICTIONS.md` enforce R1–R4 risk, evidence quorum, negative/regression checks, rollback/recovery where applicable and the falsification question: **What observation would prove our conclusion wrong?**

## V6 — Finishline and external acceptance
`PROJECT_FINISHLINE.md`, `FINISHLINE_STATE.json` and `EXTERNAL_ACCEPTANCE.md` separate implementation from acceptance. Visual owner acceptance and cross-repo capability alignment cannot be inferred from code alone.

## V7 — Freshness, drift, milestones and governance
`EVIDENCE_TTL.json`, `DRIFT_BASELINE.json`, `BRANCH_PROTECTION_CONTRACT.json` and `milestones/` prevent stale success, require reconciliation after relevant drift, preserve append-only accepted snapshots and define the desired `main` protection contract.

## V8 — Cross-chat, impact, owner inbox, auto-handoff and convergence
`MEMORY_V8_CONTROLS.json`, `OWNER_ACTION_INBOX.md`, `NEXT_BEST_ACTION.md`, `AUTO_HANDOFF.md` and `CONVERGENCE_PLAN.json` provide cross-chat reconciliation, impact-aware revalidation, compact owner actions, robust handoff and planned-but-unscheduled convergence of `WellFit`, `WellFit-now` and `WellFit-Buddy`.

## Status and acceptance
Use `TODO`, `IN_PROGRESS`, `BLOCKED`, `PARTIAL`, `IMPLEMENTED`, `IMPLEMENTED_NOT_VERIFIED`, `VERIFIED`, `COUNTERCHECKED`, `ACCEPTED`, `PRODUCTION_CONFIRMED`, `NEEDS_REVALIDATION`, `RECONCILIATION_REQUIRED`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`.

Implementation is not visual acceptance. Relevant mutable evidence must be current and tied to the current preview/build/cross-repo capability state.

## Convergence rule
The three WellFit repositories may later converge all at once or incrementally. Do not assume target repo, timing or strategy. Every concrete migration step must define source, destination, scope, dependencies, evidence and rollback; do not duplicate implementation before responsibility migration is reconciled.

## Postflight
After meaningful work, reconcile task/current state, started work, locks, receipts, open loops, dependencies, evidence, external acceptance, finishline, next-best-action, owner inbox and handoff. Milestone acceptance requires an append-only snapshot.

Never store secrets, tokens, credentials or private user data here.
