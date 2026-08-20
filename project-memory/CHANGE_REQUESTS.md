# WellFit Change Requests

## WFG-CR-001
- Date: 2026-08-19
- Status: ACCEPTED
- Source: owner
- Idea: Add durable project-memory, duplicate checking and idea intake.
- Classification: Governance capability.
- Affected areas: design/UI workflow and repository governance.
- Existing task/decision checked: WFG-MEM-001
- Decision: Implement Project Memory Protocol v1.
- Related task: WFG-MEM-001

## WFG-CR-002
- Date: 2026-08-20
- Status: MERGED_INTO_EXISTING_TASK
- Source: owner
- Idea: Keep WellFit as the graphical part while WellFit-now remains technical and WellFit-Buddy owns the Buddy.
- Classification: cross-repository responsibility clarification
- Affected areas: master roles, contracts, dependencies, graphical migration boundaries.
- Existing task/decision checked: WFG-VIS-001 and V9 cross-repo master.
- Dependencies: matching local memory reconciliation in WellFit-now and WellFit-Buddy.
- Decision: general technical mobile logic remains in WellFit-now; only Buddy-specific behavior/presentation/AR belongs in WellFit-Buddy.
- Related task: WFG-VIS-001 / WFG-RECON-20260820

## WFG-CR-003
- Date: 2026-08-20
- Status: ACCEPTED_FOR_RECONCILIATION
- Source: current GitHub state
- Idea: resolve two parallel visual PRs and select one canonical graphical baseline.
- Classification: duplicate/scope reconciliation
- Affected areas: PR #1, PR #2, visual assets, future graphical migration.
- Existing task/decision checked: WFG-VIS-001
- Dependencies: current WellFit-now capability and WellFit-Buddy Buddy capability.
- Decision: close/supersede PR #1; keep PR #2 as candidate only until current-main/CI/visual acceptance is refreshed.
- Related task: WFG-VIS-001

## Intake template
```text
## WFG-CR-XXX
- Date: YYYY-MM-DD
- Status: NEW
- Source:
- Idea:
- Classification:
- Affected areas:
- Existing task/decision checked:
- Dependencies:
- Decision:
- Related task:
```
