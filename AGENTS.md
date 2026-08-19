# WellFit Repository Agent Rules

## Mandatory project-memory preflight
Before any code, configuration, content, UI or repository change, read:
1. `project-memory/PROTOCOL.md`
2. `project-memory/CURRENT_STATE.md`
3. `project-memory/TASK_LEDGER.md`
4. `project-memory/DECISIONS.md`
5. `project-memory/FAILED_ATTEMPTS.md`
6. `project-memory/CHANGE_REQUESTS.md`
Then check the current branch, git status and recent commits/PRs. Search for an existing task/change ID and prior attempt before starting a new path.

## Mandatory postflight
After meaningful work, update project memory before considering the task complete. Do not silently absorb later owner ideas into old completed tasks; create or classify a change request first.

## Repository role
This repository owns WellFit visual/landing/UI work. Technical web/backend implementation belongs in `Bernds-tech/WellFit-now`; native AR/buddy/mobile work belongs in `Bernds-tech/WellFit-Buddy` unless an accepted bridge task explicitly says otherwise.

Do not store secrets or private credentials in project memory.