# Contradiction / Reconciliation Register

Any conflict between project memory and actual Git/PR/CI/preview/runtime evidence is recorded here and forces `RECONCILIATION_REQUIRED` until resolved.

Statuses: `OPEN`, `RECONCILIATION_REQUIRED`, `RESOLVED`, `SUPERSEDED`.

## CTR-WFG-001
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: WFG-VIS-001 / PR #1
- Risk: R2
- Source A: PR #1
- Claim A: WellFit public product is a flavor/size/subscription product configurator.
- Source B: current WellFit/WellFit-now/WellFit-Buddy product roles and current WellFit product implementation.
- Claim B: WellFit is the graphical frontend of the movement/Buddy product; technical capability is in WellFit-now and Buddy capability in WellFit-Buddy.
- Stronger/current evidence: current program memory plus current WellFit-now product/runtime.
- Status: RESOLVED
- Resolution/action: PR #1 is obsolete/superseded and must be closed, not merged.
- Evidence: PR #1 metadata; `WELLFIT_MASTER_STATE.json`; current role definitions.

## CTR-WFG-002
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: WFG-VIS-001
- Risk: R2
- Source A: `STARTED_WORK.md`, `OPEN_LOOPS.md`, `EVIDENCE.md` before this reconciliation
- Claim A: no active substantive visual work was recorded.
- Source B: open PR #2
- Claim B: substantive visual implementation has existed since 2026-08-15 and remains unresolved.
- Stronger/current evidence: current PR metadata and exact head.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: carry WFG-VIS-001 through Task Ledger, Started Work, Loop, Evidence, Lock and dependencies; resolve only after the visual candidate is reconciled/accepted or explicitly superseded.
- Evidence: PR #2 head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`.

## CTR-WFG-003
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: governance
- Risk: R3
- Source A: `BRANCH_PROTECTION_CONTRACT.json`
- Claim A: main requires PRs/status checks/conversation resolution and blocks force-push/delete.
- Source B: live GitHub branch metadata
- Claim B: `main` reports `protected=false` and no enforced required checks.
- Stronger/current evidence: live GitHub branch API.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: keep branch+PR discipline operationally; owner must activate GitHub protection/ruleset when available.
- Evidence: live `main` branch metadata on 2026-08-20.

## CTR-WFG-004
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: cross-repo responsibility
- Risk: R3
- Source A: earlier memory wording
- Claim A: WellFit-Buddy owns native AR/mobile/buddy generally.
- Source B: current owner-defined role split
- Claim B: WellFit-now is the technical part, WellFit is graphical, WellFit-Buddy is the Buddy; general technical mobile logic remains technical unless Buddy-specific.
- Stronger/current evidence: latest owner direction persisted through all three repository memories.
- Status: RESOLVED
- Resolution/action: current master/local role and dependency/contract wording now reflects the clarified responsibility split; reopen only on an explicit newer role decision.
- Evidence: `WELLFIT_MASTER_STATE.json` and matching current local memories.

## CTR-WFG-005
- Date: 2026-08-20
- Updated: 2026-08-20
- Related task/change: WFG-VIS-001 / PR #2
- Risk: R2
- Source A: same-day Project Memory reconciliation text
- Claim A: PR #2 was `draft/not mergeable`.
- Source B: fresh GitHub PR metadata
- Claim B: PR #2 is `draft=true` and `mergeable=true` on exact head `7da05d9e4fd191b0a7f239ee9fa9c94175066894`; exact-head workflow lookup returns no Actions runs.
- Stronger/current evidence: fresh PR API metadata plus workflow lookup.
- Status: RESOLVED
- Resolution/action: corrected Current State, Task Ledger, Started Work, Evidence, Assumptions, Open Loops and Handoff. The acceptance conclusion does not change: mergeability only proves current Git compatibility, not current CI/browser/visual acceptance.
- Falsification question: What observation would prove our conclusion wrong? Fresh exact-head CI/browser evidence plus current visual/capability acceptance would invalidate the candidate-only status and permit advancement through the required V5 status path.
- Evidence: current PR #2 metadata and exact-head workflow lookup on 2026-08-20.

## CTR-WFG-006
- Date: 2026-08-28
- Updated: 2026-08-28
- Related task/change: WFG-AVATAR-ATTN-001 / WFN-AVATAR-ATTN-001 / PR #387 / PR #23
- Risk: R2
- Source A: merged WellFit-now PR #387 and prior task wording
- Claim A: avatar attention implementation exists and passed technical CI in the WellFit-now web code.
- Source B: owner direct review of the actual public ChatGPT Site `wellfit-bewegt` / Sites-v71
- Claim B: Rudi's head does not move and the avatars do not visibly follow the mouse at all.
- Stronger/current evidence: direct live visual validation of the target public surface plus Project Memory's existing boundary that Sites-v71 is a separate checkout not synchronized by PR #387.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: close/supersede the technical closeout PR #388; do not claim public visual completion. Resume the actual editable ChatGPT Sites source and replace whole-PNG transforms with articulated layered/rigged head/body attention, then visually verify on the exact Site before publishing/acceptance.
- Evidence: owner validation 2026-08-28; PR #388 closed unmerged as superseded; WF-LOOP-005.
- Falsification question: only a preview of the exact `wellfit-bewegt` Site showing clearly visible head/body pointer tracking and control targeting without regression can resolve this contradiction.

Never resolve a contradiction by deleting the older record. Preserve the stale claim and record why it was superseded.
## WERK-TAX-001 — 2026-09-08
TAX-001 source reconciliation remains OPEN: ABB press headline>154m is not bridged to pure nonoverlapping tax cash. ABB report page40 printed98.35% and malformed1.311.2365 do not reconcile with79,543,000 less78,179,767. Correct source interpretation is implemented; no source correction or actual cash inference claimed.

## CTR-WERK-GOV-001
- Date: 2026-09-20
- Updated: 2026-09-20 20:10 UTC
- Related task/change: WERK-GOV-001 / autonomous control plane
- Risk: R3
- Source A: `werk-data/werk-autonomy-contract.json` and `project-memory/WERK_NEXT_BEST_ACTIONS.json`.
- Original Claim A: WERK-specific control sources must steer the autonomous WERK loop; priority 1 was `NBA-WERK-GOVERNANCE-RECONCILE` / task `WERK-GOV-001`; historical WellFit-generic control text must not steer WERK.
- Original Source B: shared `project-memory/NEXT_BEST_ACTION.md`, `TASK_LEDGER.md`, and evidence-write ownership before reconciliation.
- Original Claim B: shared selector still led with a WellFit action, WERK-GOV-001 was absent from the ledger and evidence-freshness ownership was ambiguous.
- Stronger/current evidence: shared `NEXT_BEST_ACTION.md` now leads with WERK and selects `WERK-IDEENWERK-IMPACT-BRIDGE-001`; `TASK_LEDGER.md` contains `WERK-GOV-001`; `WERK_AUTOMATION_ROLES.json` schema v2 and `werk-autonomy-contract.json` v4 explicitly separate Builder, Supervisor, Evidence Reaper and Finishline authority. WERK Frontend Check #174 succeeded on exact functional governance head `242893c2fcc322424d7b6fb4cc97a0e87ea90a6e`. Current pre-audit head `0b4ced1086a0b6b46ea16e9f12bc3e3d38997aca` is exactly one audit-only commit ahead and changes only `WERK_SUPERVISOR_STATE.json`.
- Status: RESOLVED
- Resolution/action: independent supervisor countercheck passed for the control-plane reconciliation. Any residual `IN_PROGRESS` or `EXECUTABLE_AFTER_GOVERNANCE_RECONCILIATION` wording is now stale bookkeeping and must be consumed by the Orphan/Zombie reconciliation path rather than reopening the original control-plane contradiction.
- Evidence: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T201023Z.json`; WERK Frontend Check #174.
- Safety: this resolves governance steering only. It does not accept any product, security, legal, identity or production gate.

## CTR-WERK-SEC-PGNET-ACL-001
- Severity: YELLOW
- Status: RESOLVED_FOR_BOUNDED_STAGING_SCOPE
- Detected: 2026-09-20 21:40 UTC
- Resolved: 2026-09-20 22:13 UTC
- Risk: R3
- Original contradiction: migration source attempted durable direct ACL revocation on the hosted `net` schema/routines, while Supabase restored those managed grants in the live staging state.
- Resolution: the builder claim is narrowed to the enforceable Hosted-Supabase request boundary, not durable direct ACL ownership. Independent countercheck confirmed `anon`/`authenticated` are `NOLOGIN`, there is no WERK-owned public wrapper to `net.http_*`, and PostgREST invokes `public.werk_api_security_guard`, which rejects Data-API requests selecting the `net` profile while allowing normal `public` requests.
- Evidence: supervisor receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T221347Z.json`; live migration `20260920203116 pg_net_data_api_guard`; Backend Check #161 attempt 2 success; staging healthy/zero synthetic baseline.
- Residual limitation: Supabase-managed direct grants plus `extension_in_public` remain under `WERK-LOOP-SEC-PGNET-001` and are not claimed as production-hardened.
- Reopen trigger: new evidence that the PostgREST guard can be bypassed by the WERK Data API, a new WERK wrapper exposes `net.http_*`, staging roles gain LOGIN capability, or production hardening requires a stronger provider-supported boundary.

## CTR-WERK-IMPACT-SOURCE-BINDING-001
- Date: 2026-09-21
- Detected: 2026-09-21 07:44 Europe/Vienna
- Resolved: 2026-09-21 09:21 Europe/Vienna
- Related task/change: `WERK-IMPACT-001` / `IDEENWERK-IMPACT -> KPI-MEASUREMENT` connection.
- Severity: YELLOW
- Risk: R3
- Status: RESOLVED_FOR_STAGING_SCOPE
- Original contradiction: the impact-measurement contract claimed authoritative source binding, while migration 042 stored `impact_map_id`, `reform_id`, `model_or_artifact_ref` and `source_version` without a fail-closed lookup against the current WERK Impact Bridge/reform/model chain.
- Resolution: migration `043_werk_impact_authoritative_source_binding.sql` introduces `public.werk_impact_validate_source_binding(...)` and makes `public.werk_record_impact_measurement_plan(...)` invoke it before persistence. The validator compiles the existing authoritative Impact Bridge mapping and exact source tuple; it rejects unknown map, wrong reform, wrong artifact and stale/unknown source version. No parallel registry/calculator and no numeric/political formula change were introduced.
- Independent evidence: exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb`; WERK Impact Measurement Check #6 success; WERK Data Contract Registry Check #63 success; live Staging migration `20260921062817 werk_impact_authoritative_source_binding`; live positive current-tuple probe PASS; live negative probes returned `WERK_IMPACT_SOURCE_MAP_UNKNOWN`, `WERK_IMPACT_SOURCE_REFORM_MISMATCH`, `WERK_IMPACT_SOURCE_ARTIFACT_MISMATCH` and `WERK_IMPACT_SOURCE_VERSION_STALE_OR_UNKNOWN`; anon/authenticated have no EXECUTE on validator/recorder while service_role does; all impact-measurement tables remain zero-row.
- Result: `WERK-IMPACT-001` source-binding scope is `COUNTERCHECKED_STAGING`.
- Residual boundary: this does not assert production acceptance, causal policy effect, legal acceptance or completed improvement feedback. The downstream KPI/measurement → improvement-feedback integration remains separate work.
- Reopen trigger: source registry/version changes without matching validator update/revalidation; validator bypass before persistence; invalid source-bound plan appears; or exact functional CI regresses.
- Independent receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json`.
