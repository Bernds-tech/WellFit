# WellFit Master Next Best Action

- Selected action: `WF-MASTER-OWNERSHIP-RECONCILE`
- Status: `EXECUTABLE`
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`, `Bernds-tech/WellFit-Buddy`
- Risk: `R3`

## Why this is now the program-level next action
The first contract baseline is no longer empty: backend auth, missions, rewards, Buddy and location foundations are identified as real but partially integrated. The biggest cross-repo risk is now physical ownership drift: WellFit-now still contains most product UI plus the Unity AR project even though WellFit and WellFit-Buddy are the intended authorities.

## Exact next work
1. Complete the canonical visual/UI inventory for `WF-MIG-001` without moving files.
2. Complete the Unity/native inventory for `WF-MIG-002` without moving files.
3. For each candidate decide one of: `MIGRATE_NOW`, `KEEP_TEMPORARILY`, or `DEFER_UNTIL_FINAL_CONVERGENCE`.
4. Base the decision on active development conflict, build/test isolation, future convergence cost and rollback quality—not on repository naming alone.
5. If a migration is approved later, move only one bounded responsibility at a time and preserve the source until destination verification passes.

## Parallel local work
- WellFit-now may continue the legacy writer/server-authority migration and Project Rail fixture coverage.
- WellFit-Buddy may inventory Unity/AR assets/contracts, but must not create a duplicate Unity implementation.
- WellFit may continue graphical canonical-source inventory, but must not claim technical/native features beyond evidence.

## Selection rule
Program-level work is selected here only when it crosses repository boundaries. Pure UI, backend or native work continues to use that repository's local `NEXT_BEST_ACTION.md`.
