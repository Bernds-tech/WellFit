# WellFit Master Next Best Action

- Selected action: `WF-MASTER-BASELINE-CONTRACTS`
- Status: `EXECUTABLE`
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`, `Bernds-tech/WellFit-Buddy`
- Risk: `R3`

## Goal
Baseline the first shared contracts and dependencies before new cross-repository feature work expands further.

## Exact next work
1. Reconcile auth/identity, mission completion, reward authority, buddy state/events and location/sensor boundaries against current code in the owning repositories.
2. Mark each `WF-CONTRACT-*` and `WF-XDEP-*` as current, partial or unresolved with exact repository evidence.
3. Do not rewrite implementations merely to make the contracts look consistent.
4. Only after contract baselines exist, select the first meaningful cross-repository integration gate.

## Selection rule
Program-level work is selected here only when it crosses repository boundaries. Pure UI, backend or native work continues to use that repository's local `NEXT_BEST_ACTION.md`.
