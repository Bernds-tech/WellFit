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

## XLOCK-WF-RUDI-WORLD-20260905
- Cross-ID: `WFG-RUDI-WORLD-001` / `WFN-RUDI-3D-001`
- Status: ACTIVE
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: graphical coordination plus current physical web implementation for Rudi as a DOM-surface-bound Landingpage resident. Includes letter/surface footing, scroll-with-surface, route-guided catch-up, layering, CTA attention and machine verification. Excludes backend/auth/data, mission/reward/economy, location/camera, native Buddy runtime and production deployment authority.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`; physical graphical ownership drift remains under `WF-MIG-001`.
- Branches/PRs: WellFit `codex/rudi-living-world-coordination-20260905`; WellFit-now `codex/rudi-3d-living-avatar-20260905` / PR #401.
- Acquired: 2026-09-05 Europe/Vienna
- Updated: 2026-09-05 after exact WellFit-now head `0240d7542d5451ab052743b605275a5cae895f7a` passed Build #1260, Container #245, Database #237, Beta Emulator #216 and Project Memory Guard/Quality/Status.
- Resume from: harden deterministic physical route invariants and reconcile stale WellFit-now memory/PR wording. The public ChatGPT Site remains a separate synchronization/visual-acceptance step and is not changed by this lock.

No active avatar-attention implementation cross-repo lock. The remaining public ChatGPT Site synchronization is a graphical WellFit/Sites step tracked by WF-LOOP-005.

## Superseded locks

## XLOCK-WF-AVATAR-ATTN-20260826
- Cross-ID: `WFG-AVATAR-ATTN-001` / `WFN-AVATAR-ATTN-001`
- Status: SUPERSEDED
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: initial whole-image pointer/focus transform experiment.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`
- Branches/PRs: WellFit merged PR #23; WellFit-now merged PR #387; closeout PR #388 closed unmerged.
- Acquired: 2026-08-26 Europe/Vienna
- Superseded: 2026-08-28 after owner live validation proved no visible movement on the actual Site and whole-image rotation did not satisfy head tracking.
- Resume from: do not resume; articulated correction superseded it.

## Released locks

## XLOCK-WF-AVATAR-PUPPET-20260828
- Cross-ID: `WFG-AVATAR-PUPPET-001` / `WFN-AVATAR-PUPPET-001`
- Status: RELEASED
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: corrective articulated web head/body puppet behavior for existing Rudi/Buddy/avatar graphics after live Site validation invalidated whole-image transforms; no backend, mission, reward, auth or native AR authority changes.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`
- Branches/PRs: WellFit `codex/avatar-puppet-coordination-20260828`; WellFit-now implementation merged through PR #390.
- Acquired: 2026-08-28 Europe/Vienna
- Released: 2026-08-29 after exact head `f2b2bdb89655bea3398687a35540704b091672d7` passed Build #1198, Container #183, DB #175 and Project Memory checks and PR #390 merged as `d374e4db4777406d93a8aad72adc10ab47db216f`.
- Result: reusable technical Puppet renderer is merged. Public ChatGPT Site synchronization/preview/publication remains open and is not claimed by this release.
- Resume from: WF-LOOP-005 and the actual editable `wellfit-bewegt` ChatGPT Site source.

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
