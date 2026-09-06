# WERK — Arbeitnehmerentlastung mit dem Schuldenabbau

## Current continuation: WERK-SV-004
Status: IMPLEMENTED_NOT_VERIFIED remotely; all five relevant local workflow bodies passed (36 annual + 55 SV + 42 general counterchecks). Remote publication/CI pending.
Current owner goal remains progressive 50% employee KV/PV/ALV relief during funded debt repayment.

New canonical annual-assessment rules and module feed 48 SV cases, 24 general extra-hours cases and 27 hypothetical work/nonwork comparisons. Sources: current dated RIS §§16/33/41/77 and BMF 2026 tariff/credits; 2025 Taxbook / 2027 annotations not mixed in. Scope: standard full-year employee, 14 equal pay packets, no family/commuter/other-income/transfers/extra e-card fee, model before payslip cent and assessment whole-euro rounding. Optional employer §77(4) rollup remains outside old withholding measure; annual §41(4) correction now included. PAY-I closed only for this standard scope; general household and marginal-burden gates remain open.

Half-cut outside Vienna annual gain after assessment: 1500 gross -> 1164.90 EUR; 2000 -> 1491.21; 2500 -> 1886.24; 3000 -> 2563.56; 4000 -> 3099.91. Refund/credit losses explain the change from withholding, together with special-pay annual correction. No empirical population recapture inferred. Official branch statistics still do not identify exact pure employee KV/PV/ALV scope; broad 31.952625bn is neither reform cost nor extra receipts.

Read WERK_SV_JAHRESNETTO.md and generated payroll-annual-assessment-results-2026.json. 36 new counterchecks plus existing 55 SV and 42 general cases. Recovery: revert bounded SV-004 commits. No Sites deployment.

Next unproven: representative pure employee contribution total / microdata; household transfers and other assessment groups; nominal wage/base growth and demographic funding stress; sustainable funded base repayment. Historical SV-003 constant-nominal debt paths and 30% recapture remain sensitivities, not newly proven financing.


## Previous refinement: WERK-SV-003
Owner supersedes delayed relief: progressively reduce employee KV/PV/ALV during funded debt repayment, reaching a relative 50% reduction by debt freedom as a political goal. Funding comes from recurring realized avoided interest. Base repayment and service entitlements remain protected. An interest euro cannot pay both relief and additional principal.

Implementation: existing SV files extended in place; historical `post-debt` paths retained to preserve references. Coupled model has 16 full annual paths: allocation 0/50/100% of interest to relief, 1/2.5/4% assumed rates, 0/20/30/40% recapture sensitivities, 431.4/525.2bn debt anchors and 1/3-year savings lag. Main report highlights 50% payroll cases; full abolition remains comparison only. Old 15.5bn goal is explicitly superseded. Debt/reform registers, overall calculation, field workstate and program updated.

At 525.2bn debt, funded 10bn annual base repayment and 2.5% rate: pure reinvestment 34 years; 50/50 split 41; full interest allocation to SV 53. At debt freedom end-year53, 13bn annual savings are effective; full 13.13bn follows in year54. Broad 2024 reference half 15.9763125bn exceeds eventual no-recapture interest by 2.8463125bn; this is not actual pure-SV cost. At assumed 30% recapture, net reference target 11.18341875bn can be reached in year46. No empirical recapture or actual end-target financing is claimed. Exact employee aggregate, maturities, demographic costs, reserve and actual rate law remain open.

Verification: 55 independent numerical/negative cases; local workflow bodies passed; VERIFIED at 5ddea9fd186ea50fd2cde6438767f873acd5a20f, all four triggered workflows successful. See WERK_SV_003_CI_RECEIPT.json. Recovery: revert SV-003 bounded commits only. No Sites deployment.

## Previous refinement: WERK-SV-002
Owner chose an initial 15.5bn EUR annual gross employee KV/PV/ALV relief volume after complete debt repayment. This supersedes immediate full abolition as the current program target; full abolition remains comparison only and requires a later decision. No personal 50% reduction is implied. Distribution and indexation until future activation are open. Without recapture, 1/5/10-year replacement is 15.5/77.5/155bn; at an assumed 30% tax recapture 10.85/54.25/108.5bn. Extra implementation/service costs remain open. Under the prior conditional 18.504bn capacity case, 3.004bn would remain even without recapture; this is not verified future financing. 37 SV counterchecks; VERIFIED at 7fc44e6d024bdfc5932f501224094a8d52f482cb; all four triggered workflows successful. See WERK_SV_002_CI_RECEIPT.json.

## Previous implementation: WERK-SV-001
Updated: 2026-09-06. Status: VERIFIED at 2096e1cf402ad36968a3d57ffc74c7efc39eba83; all four triggered workflows succeeded. See WERK_SV_CI_RECEIPT.json.

Owner requested continued calculations and abolition of wage social insurance after debt repayment. SV-01 records employee KV/PV/ALV relief with preserved insurance and pension rights; employer contributions, AK/WF and non-employee groups remain separate. Existing public WERK branch publication authorization persists; no Sites deployment.

## Calculation and evidence
- WERK_SV_NACH_SCHULDENFREIHEIT.md and post-debt-employee-sv model/results: 48 payroll, 24 capacity, 16 replacement-cost and 27 work/nonwork sensitivity cases.
- Official employment-only 2024 ODS, 19 gross brackets, 4,918,470 persons; broad withheld contributions/levies 31.952625bn. Original source hash and cell totals checked by Python importer. This is neither pure employee KV/PV/ALV cost nor new revenue; overview classification has a different scope (31.955bn).
- 3,000 monthly gross outside Vienna: ordinary net 2,174.08 to 2,532.55; annual gain 5,264.39 before assessment, transfers and funding incidence. Unchanged 2026 tax rules and 14 equal salaries are static scenarios, not future-year forecasts.
- Conditional post-debt capacity at 525.2bn starting debt, 10bn sustainably funded base repayment and 2.5% avoided interest: 23.13bn/year; 18.504bn after a 20% reserve. Actual future reform cost and funding remain unknown; no current budget credit.
- Owner's follow-up on using 31.96bn for debt: these receipts already exist. Redirection plus full replacement of displaced financing yields zero additional repayment capacity. Explicit accounting and negative tests prevent double booking.
- AMS basic replacement 55%, conditional supplement caps 60/80%; no general equal-pay claim. Household examples use explicitly hypothetical benefits, yearly-equivalent wages and work costs. Future earnings-linked ALG and final assessment remain open.
- Reform inventory now 16; 8 fields have dossiers, not necessarily funded measures. Program text, dependency map, manifest and fiscal registry updated.

## Validation and recovery
Five relevant workflow bodies run locally (Fiscal, Distribution, Registry, Policy Field, Frontend), including 34 SV counterchecks, original-source import and 42 existing calculation counterchecks. Remote Fiscal, Registry, Policy Field and Frontend workflows succeeded at the exact implementation SHA; see WERK_SV_CI_RECEIPT.json. Recovery: revert bounded SV-001 commits; no runtime state migration.

## First unproven step
Pure employee KV/PV/ALV aggregate by group; final assessment and household transfer effects; sustainable replacement financing and demographic costs. These are substantive open gates even when technical CI succeeds.
