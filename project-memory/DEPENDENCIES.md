# WellFit Dependencies

Track implementation ordering and cross-repository dependencies here.

## WF-DEP-001
- From: WellFit graphical/landing/UI tasks
- Requires: explicit repository ownership
- Type: cross-project governance
- Status: ACTIVE
- Updated: 2026-08-20
- Rule: `Bernds-tech/WellFit` owns graphics/UI/landing/product presentation. `Bernds-tech/WellFit-now` owns technical product implementation, including technical mobile application logic outside the Buddy domain. `Bernds-tech/WellFit-Buddy` owns Buddy behavior/presentation/animation and Buddy-specific AR/camera interaction. Bridge work must carry a cross-project ID.

## WF-DEP-002
- From: WFG-VIS-001
- Requires: current implemented capability from WellFit-now and current Buddy capability from WellFit-Buddy
- Type: capability/claim alignment
- Status: BLOCKED
- Updated: 2026-08-20
- Rule: graphical screens/landing claims cannot be ACCEPTED until they match current implemented capability and any unsupported/roadmap behavior is clearly marked.

## WF-DEP-003
- From: WFG-VIS-001
- Requires: canonical visual-baseline decision across PR #2, current main and any still-relevant visual assets in WellFit-now
- Type: migration/convergence
- Status: ACTIVE
- Updated: 2026-08-20
- Rule: classify KEEP/REPLACE/MIGRATE_LATER/OBSOLETE before moving or recreating visual code.

States: `ACTIVE`, `SATISFIED`, `BLOCKED`, `SUPERSEDED`.
## WERK-SV-006
- SV-01 financing needs actual ALV employee receipts after reduced DN rates; ESSOSS assumes equal split. PV/KV contributions require legal-scope bridge.
- Twelve static reference cases do not replace debt/SV growth paths; existing inputs unchanged.
