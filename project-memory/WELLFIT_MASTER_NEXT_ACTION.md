# WellFit Master Next Best Action

- Selected action: `WF-MIG-002-UNITY-DESTINATION-INIT`
- Status: `EXECUTABLE`
- Lead repository: `Bernds-tech/WellFit-Buddy`
- Participating repositories: `Bernds-tech/WellFit`, `Bernds-tech/WellFit-now`
- Risk: `R3`

## Why this is now the program-level next action
The exact `WF-MIG-002` source inventory is merged and counterchecked. It proves that `WellFit-now@447093decd783b33a6e724170dbe4667e899348b:native/unity/WellFitBuddyAR` is useful scaffold/reference material, not a complete or compile-ready Unity project. The reviewed decision is `MIGRATE_NOW` through a fresh version-pinned destination, while preserving the source and all WellFit-now technical/server authority until acceptance.

## Exact next work
1. In WellFit-Buddy, acquire a fresh R3 local lock bound to the destination branch and exact Unity editor/package versions.
2. Initialize a genuine Unity 6.3 LTS project at `unity/WellFitBuddyAR` with real `ProjectVersion.txt`, `Packages/manifest.json`, generated lockfile and minimal project settings.
3. Add only the minimal AR Foundation/ARCore package baseline needed for Android; do not port the old controller fragments yet.
4. Prove clean empty-project editor compilation and a reproducible CI/build validation path.
5. After that proof, port one reviewed Buddy-domain controller slice at a time and preserve the WellFit-now source through build, device and cross-repo acceptance.

## Explicit boundaries
- No wholesale directory copy.
- No deletion or authority switch in WellFit-now.
- No mission completion, reward/economy or anti-cheat authority in the Unity client.
- No real-device claim until an exact build is exercised on an ARCore-capable device, including permission/tracking-loss negative paths.
- General technical mobile/application logic remains in WellFit-now.

## Parallel local work
- WellFit may continue `WF-MIG-001` graphical canonical-source inventory without claiming unverified Buddy capability.
- WellFit-now may continue technical/server work and retain the exact Unity source scaffold as rollback/reference.
- WellFit-Buddy owns the destination initialization and Buddy-specific runtime only.

## Selection rule
Program-level work is selected here only when it crosses repository boundaries. Pure UI, backend or Buddy-local work continues to use that repository's local `NEXT_BEST_ACTION.md`.
