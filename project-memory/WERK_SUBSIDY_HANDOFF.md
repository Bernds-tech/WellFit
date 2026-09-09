# WERK – Förderkonten: Übergabe SUB-001

Stand: 2026-09-09. Status: IMPLEMENTED_NOT_VERIFIED remotely. Existing WERK branch publication authorized; no Sites deployment.

Original BMF CSV retrieved from official August2026 portal, archived losslessly as gzip. Raw bytes 6,798,268; SHA256 eaf7a8436ae3289f3b232f72b3026a2dbbd83e683378d6bf0d3a3959e35235f1. Normalized all 15,802 records in integer EUR cents, 2,577 distinct source-dimension tuples. Full source columns retained via dimension dictionary; record and physical-line references preserved. 730 negative records retained. Annual history2014–2025, BVA2026–2028, separate monthly2025/2026; no missing-to-zero conversion.

Main duplicate trap: 2025 annual month-code16 and monthly1–14 each independently sum to the same three class totals. Do not add them. 2026 has booked months1–8 but no exact cutoff or full-August completeness proof. Funding classes06+16 separate from17 administration. 24 legacy2024UGs reconcile within source0.1m rounding.

Funding06+16 (mio EUR): 2024 12584.17694986; 2025 10509.02087452; 2026 BVA9730.198; 2027 BVA9034.582; 2028 BVA9054.790. Administration17: 280.19414557 /274.21443825 /228.507 /246.426 /245.133. Historical Taskforce2026 10.1bn and designable7.7bn remain explicitly dated March2026; time/scope bridge to newCSV is open, no new savings claim.

1,035 account/class combinations have a record in2024–2028. Matched2025/2028 funding accounts 414; aggregate change −1,454.23087452m, reconciled as matched differences plus2028-only records minus2025-only records. Missing account-year stays null; no proven program closure/new program. Source budget account is not a unique legal program. Top20 BVA2028 accounts total4,622.418m; separate review-priorities artifact has first questions and null fields for programs, law, commitments, cofinancing, government baseline, outcomes, costs and distribution.

Thermal renovation account43.01.02.00-1/7700.400: 2025actual1606.48138307m,2028BVA287.443m; difference−1319.03838307m is a baseline comparison, not available new savings or a justified cut. Portfolio includes EU-flow risk, external-agency overlap and unmatched-account risks.

SUB-D2 remains partial at program level; added closed SUB-D2a raw account extraction and open SUB-D2b legal program/commitment/cofinancing mapping. ESVG/TDB/outcome gates stay open. Source import, results, priorities, SUBSIDY-DATA registry, manifestv43, field2 workstate, analysis/status and main calculation report linked. No change to main/debt/SV numerical assumptions or outputs; verified extra funding remains0.

Local evidence: original CSV + 24 independent report UG controls; eight pinned numerical anchors,15 account/year/class reconcilations, annual/monthly duplication check,16 invalid inputs and8 source/output/review corruptions. All five final workflow bodies passed; final missing-annual-class guard rechecked through importer and negative checks. Exact-commit remote CI pending.

Next: map the20 accounts to legally identified programs and payable commitments, EU/RRF/cofinancing and government baseline before a reform saving; close ESVG2025–2031 series and cross-level duplicates. TAX001 cash/finality attribution remains open. Recovery: revert bounded SUB001 additions.

SUB001 final coverage finding: no source class16/17 records in2014–2016. Components and complete06+16 total now remain null, reported-row subtotal separate; three explicit counterchecks added. Focus2024–2028 totals unchanged. No historical zero inferred.
