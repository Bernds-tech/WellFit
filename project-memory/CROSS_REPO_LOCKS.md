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
- Status: ACTIVE|STALE|RELEASED|SUPERSEDED
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
