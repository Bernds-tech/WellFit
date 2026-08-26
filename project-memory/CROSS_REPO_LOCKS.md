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

## XLOCK-WF-AVATAR-ATTN-20260826
- Cross-ID: `WFG-AVATAR-ATTN-001` / `WFN-AVATAR-ATTN-001`
- Status: ACTIVE
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: owner-requested web-only pointer/focus attention behavior for existing Rudi/Buddy/avatar graphics while the current physical web UI still resides in WellFit-now; no backend, mission, reward, auth or native AR authority changes.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`
- Branches/PRs: WellFit `codex/avatar-attention-master-20260826` / PR #23; WellFit-now `codex/avatar-attention-20260826` / PR #387
- Acquired: 2026-08-26 Europe/Vienna
- Updated: 2026-08-26 after exact PRs were opened and initial implementation/coordination checks passed.
- Resume from: complete final-head CI/countercheck on PRs #387/#23, then release this cross-repo implementation lock if green. Separate Sites-v71 synchronization and visual acceptance remain open evidence, not part of a backend/native authority switch.

## Released locks

## XLOCK-WF-MIG-002-20260826
- Cross-ID: `WF-MIG-002`
- Status: RELEASED
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`, `Bernds-tech/WellFit-Buddy`
- Scope: reconcile the V9 master to the exact, merged Buddy Unity source baseline and record the reviewed migration decision; no runtime source move.
- Contract IDs: `WF-CONTRACT-BUDDY-001`, `WF-CONTRACT-MISSION-001`, `WF-CONTRACT-REWARD-001`, `WF-CONTRACT-LOCATION-001`, `WF-CONTRACT-AUTH-001`
- Dependency IDs: `WF-XDEP-001`, `WF-XDEP-003`, `WF-XDEP-005`
- Branches/PRs: WellFit `codex/wf-mig-002-master-reconcile-20260826` / PR #20; WellFit-Buddy merged PRs #18 and #19
- Acquired: 2026-08-26 Europe/Vienna
- Updated: 2026-08-26 after bounded diff countercheck and PR #20 receipt
- Released: 2026-08-26; no runtime/source mutation occurred.
- Resume from: WellFit-Buddy main `48405aad8489c03d68f58526867eb14bb4458823` and exact WellFit-now source `447093decd783b33a6e724170dbe4667e899348b:native/unity/WellFitBuddyAR`.


## XLOCK-WF-MOBILE-SHELL-001
- Cross-ID: `WF-CONTRACT-MOBILE-SHELL-001`
- Status: RELEASED
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`, `Bernds-tech/WellFit-Buddy`
- Scope: record the owner-approved one-screen camera/AR shell, consumer responsibilities, dependency and integration gate; no runtime code or authority transfer.
- Contract IDs: `WF-CONTRACT-MOBILE-SHELL-001`, `WF-CONTRACT-BUDDY-001`, `WF-CONTRACT-MISSION-001`, `WF-CONTRACT-AUTH-001`
- Dependency IDs: `WF-XDEP-006`, `WF-XDEP-007`
- Branches/PRs: WellFit `codex/wf-mobile-one-screen-ar-shell-20260826` / PR #22
- Acquired: 2026-08-26 Europe/Vienna
- Updated: 2026-08-26 after bounded contract diff and green Guard/Quality countercheck.
- Released: 2026-08-26; no runtime code or authority transfer occurred.
- Result: target UX, responsibilities, dependency and integration gate are registered.
- Resume from: WF-INT-006 plus the WellFit-now shell implementation prerequisite and WFB-UNITY-EDITOR-RESOLVE-001 blocked editor gate.
