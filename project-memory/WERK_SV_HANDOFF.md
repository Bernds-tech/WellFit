# WERK — Arbeitnehmerentlastung nach Schuldenfreiheit

## Current refinement: WERK-SV-002
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
