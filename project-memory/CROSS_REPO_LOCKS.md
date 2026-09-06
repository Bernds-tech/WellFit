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

## XLOCK-WF-RUDI-MEMORY-20260906
- Cross-ID: `WFG-RUDI-WORLD-001` / `WFN-RUDI-3D-001` memory consolidation
- Status: ACTIVE
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: documentation/project-memory reconciliation only after the hardened Rudi runtime and Site-sync contract were merged. Replace stale active instructions that still point to PR #401, Site v105, the deleted viewport/props controller or pre-hardening source `9ae4f278...` with the immutable hardened source `b07d39938aeab4e32eddac7d19b8e15e22afacb7`, PR #402 evidence and the current `RUDI_SITE_SYNC_MANIFEST.json`. No runtime, visual redesign, Site publication, backend/auth/data, mission/reward/economy, location/camera or native Buddy mutation.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`; graphical ownership drift remains under `WF-MIG-001`.
- Branches/PRs: WellFit `codex/rudi-memory-consolidation-20260906`; WellFit-now memory branch to be created from hardened main `b07d39938aeab4e32eddac7d19b8e15e22afacb7`.
- Acquired: 2026-09-06 Europe/Vienna
- Updated: 2026-09-06 after mandatory preflight found that WellFit `STARTED_WORK.md`, `WORK_LOCKS.md`, `OPEN_LOOPS.md` and `TASK_LEDGER.md` still referenced the pre-hardening PR #401 source, while WellFit-now active Rudi memory still referenced Site v105, the removed props/viewport path and an obsolete owner-review next step.
- Resume from: reconcile the technical memory first, merge it with green Project Memory gates, then update WellFit local task/loop/lock/ledger/handoff/status to the hardened source and release this lock. Do not change runtime code.

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

## XLOCK-WF-RUDI-FALLBACK-20260906
- Cross-ID: `WFG-RUDI-WORLD-001` / `WFN-RUDI-3D-001` fallback-hardening sub-scope
- Status: RELEASED
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: bounded pre-Site-sync hardening of the accepted DOM-bound Rudi architecture only: stop autonomous/journey timers and route guides when presentation falls back to static/reduced-motion, propagate WebGL/GLTF failure into static mode, and avoid loading animation clips unused by the active runtime. No visual redesign, new controller, backend/auth/data, mission/reward/economy, location/camera, native Buddy runtime or public Site publication.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`; physical graphical ownership drift remains under `WF-MIG-001`.
- Branches/PRs: WellFit `codex/rudi-fallback-hardening-coordination-20260906`; WellFit-now PR #402 on `codex/rudi-static-fallback-hardening-20260906`.
- Acquired: 2026-09-06 Europe/Vienna
- Released: 2026-09-06 after WellFit-now PR #402 exact head `23318cdf395bd25e46f1b2a31499f14cc8afd51d` passed Build #1288, Container #273, Database #265 and Project Memory Guard #116 / Quality #123 / Status #131, then squash-merged as `b07d39938aeab4e32eddac7d19b8e15e22afacb7`. Beta Emulator was not triggered because its workflow is path-filtered away from the landing-only change set.
- Result: static/reduced-motion/error fallback now terminates pending animated journey state; route guides are WebGL-only; the fallback waits for a real anchor; initial active WebGL loading is limited to the five clips the controller can select. `RUDI_SITE_SYNC_MANIFEST.json` is advanced to merge `b07d39938aeab4e32eddac7d19b8e15e22afacb7` with updated source blob SHAs and fail-closed invariants.
- Resume from: exact editable `wellfit-bewegt` Site source and the current manifest. Do not restart a repository-only substitute unless a new independently evidenced pre-sync defect is found.

## XLOCK-WF-RUDI-WORLD-20260905
- Cross-ID: `WFG-RUDI-WORLD-001` / `WFN-RUDI-3D-001`
- Status: RELEASED
- Lead repository: `Bernds-tech/WellFit`
- Participating repositories: `Bernds-tech/WellFit-now`
- Scope: graphical coordination plus current physical web implementation for Rudi as a DOM-surface-bound Landingpage resident. Includes letter/surface footing, scroll-with-surface, route-guided catch-up, layering, CTA attention and machine verification. Excludes backend/auth/data, mission/reward/economy, location/camera, native Buddy runtime and production deployment authority.
- Contract IDs: `WF-CONTRACT-BUDDY-001`
- Dependency IDs: `WF-XDEP-004`; physical graphical ownership drift remains under `WF-MIG-001`.
- Branches/PRs: WellFit `codex/rudi-living-world-coordination-20260905` / PR #29; WellFit-now merged PR #401.
- Acquired: 2026-09-05 Europe/Vienna
- Released: 2026-09-05 after WellFit-now PR #401 exact head `54186ec16a617549acbaa0437b0b81ab36ee2abb` passed Build #1285, Container #270, Database #262, Beta Emulator #241 and Project Memory Guard/Quality/Status, then squash-merged to WellFit-now main as `9ae4f278a90d17d612f0399c40babd32c344e02b`.
- Result: the technical/web bridge for the DOM-bound living Rudi is merged. Remaining work is exact public ChatGPT Site source synchronization plus real-WebGL visual acceptance under WellFit graphical authority; later bounded pre-sync fallback hardening is separately recorded by `XLOCK-WF-RUDI-FALLBACK-20260906`.
- Resume from: current `RUDI_SITE_SYNC_MANIFEST.json` and `WF-LOOP-006`; do not restart the deleted viewport-bound controller.

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
