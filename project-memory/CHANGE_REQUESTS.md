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

## WFG-CR-004
- Date: 2026-08-26
- Status: ACCEPTED
- Source: owner continuation plus merged WellFit-Buddy WF-MIG-002 baseline
- Idea: continue setting up WellFit-Buddy by reconciling the program master and authorizing the next bounded Unity destination step.
- Classification: cross-repository migration decision/reconciliation
- Affected areas: V9 master state, dependencies, contracts, integration gates and convergence ledger.
- Existing task/decision checked: `WF-MIG-002`, WFB-MIG-002-BASELINE, merged Buddy PRs #18/#19.
- Dependencies: exact source baseline, source retention, fresh destination compile/build/device evidence and unchanged WellFit-now server authority.
- Decision: `MIGRATE_NOW` means initialize a fresh version-pinned Unity destination and port only reviewed Buddy-domain material incrementally; it does not authorize wholesale copy, source deletion or an authority switch before acceptance.
- Related task: WFG-MASTER-MIG-002-RECON

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
