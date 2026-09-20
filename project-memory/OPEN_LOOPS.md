# WellFit Open Loops

Use this register for started, partial, blocked or implemented-but-unverified visual/landing/UI follow-up work.

## WF-LOOP-001
- Related: WF-MEM-001
- Status: CLOSED
- Updated: 2026-08-19
- Gap: v1 project memory lacked open-loop/dependency/evidence/stale-work controls.
- Close when: Project Memory Protocol v2 is merged and active.
- Result: Closed by the v2 governance upgrade.

## WF-LOOP-002
- Related: WFG-VIS-001
- Status: OPEN
- Updated: 2026-08-20
- Gap: substantive visual work exists in PR #2, but it is not reconciled to current main/cross-repo capability. Fresh GitHub metadata reports it as draft and mergeable, while its exact head has no current Actions acceptance. It remains unaccepted.
- Close when: one canonical visual baseline is selected, current checks/browser evidence are green, capability claims match WellFit-now/WellFit-Buddy, and visual acceptance is recorded.
- Next check: classify PR #2/current main/current visual assets; do not start a parallel redesign first. Treat mergeability only as Git compatibility, not acceptance.

## WF-LOOP-003
- Related: WFG-VIS-001 / PR #1
- Status: SUPERSEDED
- Updated: 2026-08-20
- Gap: PR #1 represents a flavor/size/subscription product-preview concept inconsistent with current WellFit product truth.
- Resolution: exclude and close the stale PR; preserve history, do not merge it.

## WF-LOOP-004
- Related: WFG-MOBILE-UX-001 / WF-CONTRACT-MOBILE-SHELL-001
- Status: OPEN
- Updated: 2026-08-26
- Gap: the one-screen AR shell target is owner-approved and specified, but graphical acceptance, general mobile-shell implementation, Unity/Buddy integration, build and exact-device evidence do not yet exist.
- Close when: the canonical contract is counterchecked and later exact-version visual + technical shell + Buddy AR implementation passes WF-INT-006 and the applicable device gates.
- Next check: countercheck this specification PR, then create separate repository-owned implementation tasks without bypassing WFB-UNITY-EDITOR-RESOLVE-001.

## WF-LOOP-005
- Related: WFG-AVATAR-PUPPET-001 / WFG-CR-007 / CTR-WFG-006
- Status: OPEN
- Updated: 2026-08-29
- Gap: the reusable articulated head/body Puppet renderer is now merged and fully green in WellFit-now (`d374e4db4777406d93a8aad72adc10ab47db216f`), but the actual public `wellfit-bewegt` ChatGPT Site is a separate Sites source and still does not contain the behavior. The user therefore correctly still sees no head movement on the public Landingpage.
- Close when: the owner opens `wellfit-bewegt` through ChatGPT Sites/Edit (or the original Site chat) so the Site is referenced in the composer; the verified Puppet renderer and Luma/Rudi/avatar pivots are ported to that Site source; pointer/CTA tracking is visually tested on the exact preview without seams/ghosting/layout regressions; and the verified version is deliberately published to the existing public Site URL.
- Next check: no more GitHub-only substitute work. The next execution context must be the actual ChatGPT Site reference in the composer.

Rules: `PARTIAL`, `BLOCKED`, `IMPLEMENTED_NOT_VERIFIED` and `RECONCILIATION_REQUIRED` tasks require an open-loop reference or explicit no-follow-up rationale. Never delete historical loops; close or supersede them. States: `OPEN`, `BLOCKED`, `CLOSED`, `SUPERSEDED`.

## WERK-SV-006 continuation
- Status: PARTIAL
- Published seven-system employee contribution bridge is available; actual ALV DN, PV/KV policy scope and future funding remain open. Statistical29.600bn is not booked as exact reform cost.

## WERK-SV-007
- Status: PARTIAL
- Local2026 ALV notches calculated; complete household marginal burden, statutory2027+ transition and continuous-tariff policy costs open. Actual ALV-DN cash not identified from budget totals.

## WERK-SV-008
- PARTIAL: continuous 2026 contribution candidates and provisional 2027 cohort amounts are calculated; representative monthly contribution-base frequencies, final 2027+ tax/transition rules, national costs and funding remain open.
- Actual ALV-DN cash, PV/KV eligible policy scope, household transfers and sustainable debt-linked funding are unchanged open gates.
- Next: quantify population cost bounds from a suitable official monthly contribution distribution; if unavailable record the missing table precisely rather than manufacture a national estimate.

## WERK-SV-009
- PARTIAL: official normalized annual-person quartiles now available. They cannot identify monthly ALV reform incidence, proven with18 equal-annual-income examples.
- Need aggregate counts of ALV-assessed bases by year/month, employment relationship, ordinary vs special payment period, eligible group, applicable rate and fine gross interval. No national count/cost/year bridge assumed.
- Next use published measure-level administrative counts or contribution-accounting tables if available; otherwise prepare a concrete aggregate data specification without sending third-party requests.

## WERK-SV-010 continuation
- OPEN data: actual period-level assessed-case counts and charged-base sums, rate-assessment base, true payer and source/cash reconciliation. Draft employee-alv-interval-spec.json is not an acquired dataset. Standard interval engine does not close special-case, national-cost or funding gates.

## WERK-SV-011
- PARTIAL: official deficit/debt reconciliation and annual funding requirement implemented. Actual policy debt adjustments, genuinely available interest savings and recurring reform effects remain OPEN.
- Existing10bn net-debt-reduction goal requires a debt-flow check alongside Maastricht balance, without treating temporary liquidity movements as recurring financing.

## WERK-TAX-001 — 2026-09-08
TAX-001: OPEN cash/finality/refund/cohort comparison, all-in marginal costs, government overlap and recurring additional effect. OPEN ABB headline and office-budget source clarification. Next step is authoritative cash bridge or additional empirical reform evidence; no inferred funding credit.

## WERK-SUB-001 — 2026-09-09
SUB-D2a account extraction closed; SUB-D2b program/legal/commitment/cofinancing mapping open. Twenty account review entries are a prioritized evidence request, not adopted cuts. ESVG2025–2031/TDB and outcome effects stay open.


## WERK-LOOP-IMPACT-BRIDGE-001
- Status: OPEN
- Updated: 2026-09-20
- Gap: IDEENWERK can already intake, classify, clarify, competence-check and compare citizen ideas with known measures, while WERK already owns verified calculation/reform artifacts; the citizen-process-to-calculation/reform connection is not yet an end-to-end verified system path.
- Risk: rebuilding calculations inside IDEENWERK would duplicate logic and allow inconsistent fiscal claims.
- Next: implement `WERK-IDEENWERK-IMPACT-BRIDGE-001` by reusing existing model/reform IDs and exposing provenance/open gates rather than manufacturing new effects.
- Close when: connection is version-bound, tested, surfaced through existing IDEENWERK, independently counterchecked and no parallel calculation source exists.

## WERK-LOOP-SEC-PGNET-001
- Status: IMPLEMENTED_NOT_VERIFIED
- Updated: 2026-09-20 20:40 UTC
- Risk: R3
- Finding: `CTR-WERK-SEC-PGNET-ACL-001`; task `WERK-SEC-PGNET-001`.
- Original gap: live Hosted Supabase restored platform-managed USAGE/EXECUTE privileges around pg_net despite the earlier WERK revoke intent. The independent supervisor correctly rejected the assumption that migration `016_internal_pg_net` still described live ACL state.
- Builder result: migration `036_pg_net_data_api_guard.sql` is active on WERK Österreich Staging as `20260920203049 pg_net_data_api_guard`. It installs `public.werk_api_security_guard()` as PostgREST `pgrst.db_pre_request` and fail-closes `anon`/`authenticated` requests that select profile `net`, while ordinary `public` API use and service-role server paths remain unblocked. No WERK-owned anon/auth wrapper exposes `net.http_*` or other pg_net routines.
- Platform boundary discovered: direct schema/function ACLs are owned/restored by Hosted Supabase (`supabase_admin` / `issue_pg_net_access`) and remained platform-managed after WERK's best-effort revoke. WERK therefore no longer claims those managed grants are durably revoked. The enforceable WERK boundary is NOLOGIN public roles + no WERK wrapper + PostgREST pre-request denial of the `net` profile.
- Negative evidence: direct guard test for anon `public` profile passes; anon `net` profile returns expected PGRST 403 `WERK_INTERNAL_SCHEMA`; unsafe WERK pg_net-wrapper count is zero. No outbound `net.http_*` call was made.
- Runtime evidence: Edge function `werk-ideenwerk-api` remains active at version 7; relevant citizen/review/privacy/cluster tables were verified at zero synthetic baseline after the staging change. Transactional rollback rehearsal for resetting the pre-request hook and dropping the guard function rolled back cleanly and left the guard in place.
- Advisor boundary: Security Advisor still reports `extension_in_public` for pg_net. The Builder did not move/drop/reinstall the Supabase-managed extension merely to clear the warning. This remains a visible staging/production-hardening limitation for independent classification.
- CI: exact-head backend security migration/guardrail, unit tests, API/privacy smoke, backup/restore and contract checks passed on head `4d79bf4fab4ec3448033f77919bd32c18ab6a7a4`. The first overall Backend Check #161 failed only because the pre-existing 1,000-item queue benchmark exceeded its unchanged 120-s budget; one unchanged failed-job rerun is in progress. No threshold was relaxed.
- Next: consume the unchanged CI rerun, then issue a Builder claim. Independent Supervisor must countercheck the actual Data-API boundary, platform-managed ACL limitation, exact-head CI, Security Advisor, Edge/migration state, zero baseline and rollback evidence. Do not start the Impact Bridge while this blocker's countercheck remains unresolved.
- Close when: Supervisor verifies that public/user Data API cannot expose pg_net through WERK, required internal behavior still passes, and explicitly classifies the remaining Hosted-Supabase managed ACL/advisor limitation. Production/security acceptance remains blocked if that limitation is judged unacceptable for production.
