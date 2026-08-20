# Assumption Verification Register

Critical assumptions used to plan or execute work must be recorded here before they are relied upon.

Statuses: `NEEDS_VERIFICATION`, `VERIFIED`, `INVALIDATED`, `SUPERSEDED`.

## ASM-WFG-001
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task: WFG-VIS-001
- Risk: R2
- Assumption: PR #2 is the final accepted canonical visual baseline.
- Why it matters: treating it as accepted would bypass current-main reconciliation, current capability alignment and visual acceptance.
- Verification source/evidence: current PR #2 is draft/not mergeable and has no current exact-head Actions evidence.
- Status: INVALIDATED
- Recheck trigger: after PR #2/current-main visual inventory and fresh preview/tests.
- Action if false: keep PR #2 as candidate only; selectively rebase/port the chosen visual delta.

## ASM-WFG-002
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task: WFG-VIS-001 / cross-repo roles
- Risk: R3
- Assumption: WellFit-Buddy owns the entire technical mobile application.
- Why it matters: this would move general technical mobile responsibilities out of the technical WellFit-now domain and blur contracts.
- Verification source/evidence: current owner direction defines WellFit-now as technical, WellFit as graphical, and WellFit-Buddy as the Buddy domain.
- Status: INVALIDATED
- Recheck trigger: explicit future owner decision changing repository responsibilities.
- Action if false: keep general technical mobile logic in WellFit-now; only Buddy-specific behavior/AR belongs in WellFit-Buddy.

## ASM-WFG-003
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task: WFG-VIS-001
- Risk: R2
- Assumption: the graphical candidate accurately represents current backend/Buddy capability.
- Why it matters: unsupported visual claims would create false product readiness.
- Verification source/evidence: cross-repo integration gates are still partial/open.
- Status: NEEDS_VERIFICATION
- Recheck trigger: before visual acceptance or public capability claims.
- Action if false: mark unsupported functionality as preview/roadmap or adjust visuals.

Do not delete invalid assumptions; preserve them as `INVALIDATED` or `SUPERSEDED`.