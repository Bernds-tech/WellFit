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
- Verification source/evidence: fresh GitHub metadata reports PR #2 as draft and mergeable, but its exact head `7da05d9e4fd191b0a7f239ee9fa9c94175066894` has no GitHub Actions runs and is based on older main.
- Status: INVALIDATED
- Recheck trigger: after PR #2/current-main visual inventory and fresh exact-head preview/tests.
- Action if false: keep PR #2 as candidate only; selectively rebase/port the chosen visual delta. Mergeability alone is not acceptance.

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
## ASM-WERK-SV-004
- Date: 2026-09-06
- Status: VERIFIED
- Scope: 2026 standard full-year ASVG, 14 equal salaries, no family/commuter/other-income/extra-fee cases; statutory tariff and credits remain unchanged under hypothetical KV/PV/ALV cuts.
- Evidence: current RIS EStG §§16,33,41,77, BMF 2026 credit tables.
- Boundary: model before payslip cent and assessment whole-euro rounding; no population recapture rate follows from examples.
- Falsification: independent annual-tax anchors or credit/cap boundaries disagree, or source year is not 2026.

## ASM-WERK-SV-005
- Date: 2026-09-07
- Status: NEEDS_VERIFICATION
- Scope: 0/1/2/3% nominal contribution-growth and 0/2% funded base-repayment growth are sensitivities, not forecasts or empirically financed surpluses. Rates 1/2.5/4%, recapture 0/30%; no calendar start.
- Source boundary: OeNB June 2026 forecast has a short horizon; BMF long-term 2025 projection has a different policy vintage from July 2026 baseline. Neither can validate a constant multi-decade employee-contribution-growth assumption.
- Falsification: growing costs may invalidate initial target coverage or a previously affordable rate; test post-debt years and hold-rate shortfalls explicitly.
- Recovery: revert bounded SV-005 changes only.

- SV-005 validation: geometric-series repayment and compound-growth identities independently checked; 28 growth tests plus existing regression suites pass. Actual growth/funding assumptions remain unverified as real-world forecasts.

## WERK-SV-006 — ESSOSS allocation limits
- Status: VERIFIED for published method, NEEDS_VERIFICATION for actual policy cash scope.
- ALV employee4.686bn is statistical half-allocation, not separately measured receipts. Public-service employee category includes pension-security deductions from retirees.
- Falsifier checked: source method sheets contradict a naive exact-employee-receipts interpretation; exact policy total remains null.

## WERK-SV-007
- VERIFIED: ÖGK2026 whole-base ALV thresholds; 24 local standard-assessment effects.
- Falsifier checked: uniform50% core cuts do not remove all net-loss notches. Exact actual ALV-DN aggregate and future-law projection remain unverified.

## WERK-SV-008
- VERIFIED bounded model: 14 equal full-year pay packets; 2026 net rules; three non-overlapping right-side transition widths. Candidate continuity is not enacted law.
- NEEDS_VERIFICATION: national incidence and costs, final variable 2027 values, complete household net effects and funding. ÖGK primary publication explicitly provisional; no final 2027 net claim.

## WERK-SV-009
- VERIFIED source:1161 quartile values; year2024, person-level annual income/insurance days×30 including specials, apprentices excluded. Repeated totals agree.
- INVALIDATED shortcut: same normalized annual income does not identify monthly ALV relief; 18 constructive counterexamples.
- NEEDS_VERIFICATION: observed eligible assessment counts and future-year bridge. 14000 payments equal1000 persons only in the explicitly conditional14-payment model. No national estimate.
