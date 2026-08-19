# Execution Policy v5

Mandatory default for substantive agent/Codex/automation work.

## Automatic preflight
Before acting, read `AGENTS.md` plus relevant project-memory sources including CURRENT_STATE, TASK_LEDGER, CHANGE_REQUESTS, DECISIONS, FAILED_ATTEMPTS, OPEN_LOOPS, DEPENDENCIES, EVIDENCE, DO_NOT_ASSUME, SESSION_HANDOFF, project/cross-project status, AUTHORIZATIONS, STARTED_WORK, WORK_LOCKS, EXECUTION_RECEIPTS, RECONCILIATION, QUALITY_CONTROL, ASSUMPTIONS and CONTRADICTIONS. Verify actual Git/PR/check/preview/runtime state and existing task IDs/attempts.

Assign `Risk: R1|R2|R3|R4`; uncertainty defaults upward. Record/verify critical assumptions. Define success evidence, negative/regression evidence where relevant and recovery expectations for R3/R4 state-changing work.

## Started-work rule
As soon as substantive work starts, record it in STARTED_WORK with Risk, acquire/update the Task-ID lock and open an execution receipt. Unfinished work remains visible until explicitly closed, superseded or transferred with exact next step.

## Duplicate/regression and scope guard
Confirm the work is not already implemented, failed/rejected without new evidence, in the wrong repo or blocked by an unresolved dependency. Before completion compare intended scope with final diff; unexplained extra files/assets/dependencies/configuration force `RECONCILIATION_REQUIRED`.

## Independent countercheck
Before merge/completion/success reporting: re-read the goal, inspect final diff, verify fresh commit/PR/preview evidence, test a meaningful negative/regression path where applicable, answer `What observation would prove our conclusion wrong?`, re-check assumptions/dependencies/open loops/contradictions, reconcile memory with PR/check/runtime state, and apply the Risk-level completion quorum from QUALITY_CONTROL. R3/R4 require at least two independent evidence classes. Record rollback/recovery proof where applicable, finish the receipt and release/update the lock.

## Completion state machine
`TODO -> IN_PROGRESS -> IMPLEMENTED -> VERIFIED -> COUNTERCHECKED -> ACCEPTED -> PRODUCTION_CONFIRMED` as applicable. Side states include `BLOCKED`, `PARTIAL`, `IMPLEMENTED_NOT_VERIFIED`, `RECONCILIATION_REQUIRED`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`. Never jump from implementation to acceptance without quorum.

## Stop conditions
Do not bypass red governance/security checks, invalid assumptions, contradictory verified evidence, missing prerequisites/secrets, protected production/billing/destructive/compliance/publishing boundaries or previous failed approaches without new evidence.

## Milestone closeout
Before a phase/milestone is complete, reconcile all related tasks, started work, locks, loops, dependencies, failed attempts, change requests, PR/checks, assumptions, contradictions and evidence. Unresolved work is explicitly carried forward.

Standing permissions in AUTHORIZATIONS are reused where technically/safely allowed; platform/protected-boundary confirmations still apply.

**Invariant: Project memory -> actual state -> prior attempts -> Risk/assumptions -> started-work/lock -> dependencies/evidence plan -> action -> falsification/negative check -> independent countercheck -> quorum/reconciliation -> receipt -> memory update.**
