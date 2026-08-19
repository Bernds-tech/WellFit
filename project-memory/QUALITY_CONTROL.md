# Project Memory Quality Control v5

Mandatory controls and countercontrols for substantive work.

## Risk levels
- R1: documentation/housekeeping with no runtime effect.
- R2: normal visual/UI/product changes with bounded blast radius.
- R3: cross-repo contracts, sensitive UX/data flows, deployment/configuration or architectural changes.
- R4: Production, security/privacy controls, destructive operations, payments/rewards activation, compliance or release/publishing boundaries.

Every substantive task records `Risk: R1|R2|R3|R4` before implementation. Unknown risk defaults upward.

## Completion quorum
- R1: scope/diff check + one evidence class.
- R2: implementation evidence + independent countercheck + relevant regression/negative-path check.
- R3: at least two independent evidence classes, current checks/preview evidence, dependency/assumption reconciliation and rollback/recovery plan when state can change.
- R4: all applicable governance/security checks green, at least two independent evidence classes, target-bound evidence, rollback/recovery plan, negative/fail-closed proof and any protected-boundary approval required by policy.

Evidence classes include diff review, automated checks, preview/runtime evidence, screenshot/visual acceptance, cross-repo contract verification and owner acceptance. Duplicate self-reports are one class.

## Evidence freshness
Evidence must match the current commit/PR/build/preview/target. Material head changes stale prior evidence until rerun or revalidated.

## Proof of absence / negative path
For fixes, identify what must no longer occur and test a meaningful negative/regression path where applicable.

## Rollback / recovery proof
R3/R4 state-changing work records recovery method, affected state, test/review status and irreversible steps before acceptance.

## Scope-diff guard
Compare intended scope with final diff. Unexpected files, assets, generated output, dependencies, routes or configuration trigger `RECONCILIATION_REQUIRED` until explained or removed.

## Assumption verification
Critical assumptions belong in `ASSUMPTIONS.md` with status `VERIFIED`, `INVALIDATED` or `NEEDS_VERIFICATION` and evidence. Never infer current preview/deploy/runtime state from old chat history.

## Contradiction matrix
Conflicts among TASK_LEDGER, STARTED_WORK, WORK_LOCKS, OPEN_LOOPS, DEPENDENCIES, EXECUTION_RECEIPTS, EVIDENCE, PR/CI and preview/runtime state belong in `CONTRADICTIONS.md` and force `RECONCILIATION_REQUIRED`.

## Completion state machine
`TODO -> IN_PROGRESS -> IMPLEMENTED -> VERIFIED -> COUNTERCHECKED -> ACCEPTED -> PRODUCTION_CONFIRMED` as applicable. Side states remain `BLOCKED`, `PARTIAL`, `IMPLEMENTED_NOT_VERIFIED`, `RECONCILIATION_REQUIRED`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`.

## Falsification question
Before COUNTERCHECKED answer: `What observation would prove our conclusion wrong?` Check the strongest practical falsifier or record why it cannot yet be checked.

## Milestone closeout
Before declaring a milestone complete, reconcile all related tasks, STARTED_WORK, OPEN_LOOPS, dependencies, failed attempts, change requests, PRs/checks, assumptions, contradictions and evidence. Unresolved work is explicitly carried forward and never silently disappears.
