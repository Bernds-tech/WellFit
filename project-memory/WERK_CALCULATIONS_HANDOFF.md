# WERK-CALC-001 — Gesamtrechnung

Updated: 2026-09-06. Status: VERIFIED at d876d9f91c1edadd505edff018e7377500dab0b3; all three triggered CI workflows succeeded. See WERK_CALCULATIONS_CI_RECEIPT.json.

Owner explicitly requested all calculations. Existing public WERK branch publication authorization persists from the earlier continuation response. Existing LAB-005 remains verified. No Sites deployment follows from GitHub publication.

## Deliverables
- `WERK_GESAMTRECHNUNG.md`: full readable calculation.
- `werk-data/calculation-assumptions.json`: explicit hypothetical ramp, transition, overlap, interest, hours and payroll cases.
- `werk-data/calculation-results-2026.json`: exact source hashes, annual rows, 15 reform dossiers, three distinct operating models, 12 combined cost cases, 48 repayment cases, nine hours cases and 24 payroll examples.
- `scripts/werk-calculation-contract.mjs`: deterministic generation and equality check.
- `scripts/werk-calculation-negative-check.mjs`: 42 independent numerical anchors and invalid-input cases.

## Results and bounds
2026 official gap to balance 22.2bn; conditional improvement to +10bn surplus 32.2bn. 2031 target gap 28bn. Existing default models jointly 39.1565m annual net before unknown transition costs, only under independence. With illustrative 75m setup cost and 25%/75%/100% gross ramp: -87.710875m / 51.626m / 247.4085m after 1/5/10 years. At 25% overlap haircut, ten-year cumulative result 91.806375m. Verified funding remains zero; unknown reform effects are not zero.

Debt repayment is conditional on a funded base surplus, no new deficits/SFA, year-end repayment and subsequent-year interest savings; no calendar start is assumed. Payroll is employer withholding before assessment and household transfers/care/transport. Survey hours cases are not matches or budget receipts.

## Findings corrected
- Funding IDs FISC-01 and GMBL-01 now map to actual SUB-01 and GAME-01.
- Fiscal aggregate equality rejects non-finite/missing values.
- Previously orphaned BUD gap checker failed on source-rounded 2030 values and cumulative difference. Explicit -0.1bn rounding residual retained; checker now registered/executed in fiscal CI with counterexamples.
- Older 31.5bn calculator bridge is explicitly historical 2025, not the current 2026 gap.
- Legacy administration UI uses 15m DADEX baseline as illustrative transition input; this is not a verified additional WERK project cost. New calculation keeps actual transition unknown and exposes assumptions.

## Validation and recovery
All 13 WERK workflows executed locally; final changed fiscal/registry checks rerun successfully, plus 42 countercheck cases. Revert only the CALC-001 commits for recovery; no database/state migration or Sites change.

## Next substantive work
Replace scenario assumptions with measured process-specific transition/running costs and additional collectible effects; avoid claiming the 15 dossiers are a financed program. Prioritize subsidy program net-costing and administration pilot boundaries. Pension/health/care baselines exist, but reform cost models remain open. Labour matching joint dimensions and final household assessment remain open.
