# WellFit Cross-Repo Locks

Use this register for work that touches more than one WellFit repository.

## Rules
- Acquire one `XLOCK-*` before substantive cross-repository implementation.
- The lock names the lead repository and participating repositories.
- A local lock does not override a cross-repo lock.
- Stale means reconcile first, not free.
- Release only after dependencies, contracts, integration evidence and local memories are reconciled.

## Template
```text
## XLOCK-<ID>
- Cross-ID:
- Status: RELEASED|STALE|RELEASED|SUPERSEDED
- Lead repository:
- Participating repositories:
- Scope:
- Contract IDs:
- Dependency IDs:
- Branches/PRs:
- Acquired:
- Updated:
- Resume from:
```

## Active locks

None.

## Released locks

## XLOCK-WF-MIG-002-20260826
- Cross-ID: `WF-MIG-002`
- Status: ACTIVE
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`, `Bernds-tech/WellFit-Buddy`
- Scope: reconcile the V9 master to the exact, merged Buddy Unity source baseline and record the reviewed migration decision; no runtime source move.
- Contract IDs: `WF-CONTRACT-BUDDY-001`, `WF-CONTRACT-MISSION-001`, `WF-CONTRACT-REWARD-001`, `WF-CONTRACT-LOCATION-001`, `WF-CONTRACT-AUTH-001`
- Dependency IDs: `WF-XDEP-001`, `WF-XDEP-003`, `WF-XDEP-005`
- Branches/PRs: WellFit `codex/wf-mig-002-master-reconcile-20260826` / pending; WellFit-Buddy merged PRs #18 and #19
- Acquired: 2026-08-26 Europe/Vienna
- Updated: 2026-08-26 after bounded diff countercheck and PR #20 receipt
- Released: 2026-08-26; no runtime/source mutation occurred.
- Resume from: WellFit-Buddy main `48405aad8489c03d68f58526867eb14bb4458823` and exact WellFit-now source `447093decd783b33a6e724170dbe4667e899348b:native/unity/WellFitBuddyAR`.
