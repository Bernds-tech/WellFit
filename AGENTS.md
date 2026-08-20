# WellFit Repository Agent Rules

## Mandatory project-memory preflight
Before answering project-state questions or making any code, configuration, content, UI or repository change, read:
1. `project-memory/PROTOCOL.md`
2. `project-memory/PROJECT_COORDINATION.json`
3. `project-memory/CURRENT_STATE.md`
4. `project-memory/FINISHLINE_STATE.json`
5. `project-memory/NEXT_BEST_ACTION.md`
6. `project-memory/AUTO_HANDOFF.md`
7. `project-memory/OWNER_ACTION_INBOX.md`
8. `project-memory/SESSION_HANDOFF.md`
9. `project-memory/STARTED_WORK.md`
10. `project-memory/WORK_LOCKS.md`
11. `project-memory/OPEN_LOOPS.md`
12. `project-memory/TASK_LEDGER.md`
13. `project-memory/DEPENDENCIES.md`
14. `project-memory/DECISIONS.md`
15. `project-memory/FAILED_ATTEMPTS.md`
16. `project-memory/CHANGE_REQUESTS.md`
For cross-repository work also read `project-memory/WELLFIT_MASTER_STATE.json`, `project-memory/CROSS_REPO_DEPENDENCIES.json`, `project-memory/CONTRACT_REGISTRY.json`, `project-memory/INTEGRATION_GATES.json`, `project-memory/CROSS_REPO_LOCKS.md`, `project-memory/CONVERGENCE_LEDGER.json` and `project-memory/WELLFIT_MASTER_NEXT_ACTION.md`.

Then check current branch/main, git status, recent commits/PRs/CI and relevant current repository/runtime evidence. Search for an existing task/change ID and prior attempt before starting a new path. Chat memory is a navigation hint only and never overrides Project Memory or current evidence.

## Mandatory postflight
After meaningful work, update project memory before considering the task complete. Do not silently absorb later owner ideas into old completed tasks; create or classify a change request first.

## Repository role
This repository is the graphical/UI/UX authority for WellFit. `Bernds-tech/WellFit-now` is the technical product authority, including backend, data, APIs, security/runtime and general technical application/mobile logic. `Bernds-tech/WellFit-Buddy` owns only the Buddy domain: Buddy-specific behavior, presentation/animation and Buddy-specific AR/camera interaction. Do not infer general mobile/application ownership from the Buddy repository.

Do not store secrets or private credentials in project memory.