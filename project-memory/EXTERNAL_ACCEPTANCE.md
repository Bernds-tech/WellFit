# WellFit External Acceptance

Repository code cannot self-close these controls.

## EXT-VISUAL-OWNER
- Related gate: `visual_system` / `landing_ui`
- Status: OPEN
- Acceptance: current preview/build is reviewed and visually accepted by the owner against intended design.

## EXT-CAPABILITY-ALIGNMENT
- Related gate: `technical_alignment`
- Status: OPEN
- Acceptance: claims shown in UI are reconciled against current WellFit-now / WellFit-Buddy implementation evidence.

## EXT-CONVERGENCE-DECISION
- Related gate: `cross_repo_handoff`
- Status: OPEN
- Acceptance: a specific convergence step has explicit source, destination, scope, dependencies, evidence and rollback. The overall target/date may remain undecided.

## Rules
- Code/CI alone cannot mark external acceptance `ACCEPTED`.
- Never store private credentials, personal data or sensitive screenshots here.
