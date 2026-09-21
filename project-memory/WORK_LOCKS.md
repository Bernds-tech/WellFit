# Work Locks

Prevents two agents/sessions from independently working the same task.

## Rules
- Acquire a lock before substantive implementation.
- One active lock per Task ID.
- A second worker must inspect the existing lock and continue/coordinate rather than restart.
- Locks older than 24h are STALE, not free: reconcile `STARTED_WORK.md`, PRs, commits and receipts before replacing.
- Release only after updating `STARTED_WORK.md` and the execution receipt.

## Active/stale locks

## LOCK-WERK-AI-SYNTH-001
- Task: WERK-AI-SYNTH-001
- Status: RELEASED
- Phase: COUNTERCHECKED_STAGING_BOUNDED_PROVIDER_DISABLED
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-21 06:26 Europe/Vienna
- Released: 2026-09-21 07:44 Europe/Vienna after independent Supervisor countercheck of the bounded Staging contract.
- Scope: bounded source-bound synthesis contract, provider adapter, status/V71 projection and reversible Staging verification. External model provider remains disabled.
- Counterchecked evidence: functional head `982fa7301bf13b2e2cf40be14e1f588874e77e4f`; WERK AI Synthesis Check #3 and Data Contract Registry #61 succeeded; Backend Check #176 succeeded on predecessor `4d3f63df43db446cd24c3c98304b1282acf61d9c`; migrations 040/041 live; synthesis table zero-row; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T054427Z.json`.
- Boundary: release closes only the bounded Staging implementation lock. `WERK-DEP-AI-PROVIDER-001` remains BLOCKED; no provider activation, paid action, live AI political variant, overall ACCEPTED or Production claim is implied.
- Reopen: only on concrete contradictory evidence or a later target-bound provider activation/extension requiring bounded implementation.

## LOCK-WERK-IMPACT-001
- Task: WERK-IMPACT-001
- Status: RELEASED
- Phase: COUNTERCHECKED_STAGING_CLOSEOUT_CONSUMED
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-21 06:33 Europe/Vienna
- Released: 2026-09-21 10:18 Europe/Vienna after consuming independent Supervisor receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json`.
- Scope: source-bound measurement plan, implementation evidence, KPI observation and review-only attribution/improvement feedback contract on Staging.
- Counterchecked evidence: exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb`; WERK Impact Measurement Check #6 SUCCESS; Data Contract Registry Check #63 SUCCESS; migration `20260921062817 werk_impact_authoritative_source_binding` live; canonical valid tuple accepted; unknown map, reform mismatch, artifact mismatch and stale source token rejected; zero impact rows retained.
- Boundary: no real-world implementation/effect claim, automatic causality, political change, provider activation or production action. Known pg_net extension placement remains separate production hardening.
- Reopen: only on concrete contradictory evidence or source-registry/version change requiring revalidation.

## LOCK-WERK-IMPACT-FEEDBACK-001
- Task: WERK-IMPACT-FEEDBACK-001
- Status: ACTIVE
- Phase: IMPLEMENTATION
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-21 10:18 Europe/Vienna
- Scope: bounded current-source impact-review feedback context into the existing AI synthesis source snapshot/provider context; provenance and uncertainty preserved; review hypotheses never promoted to causal fact, ranking, recommendation or automatic political change.
- Prerequisites consumed: `WERK-IMPACT-001` independently `COUNTERCHECKED_STAGING`; `WERK-AI-SYNTH-001` independently counterchecked for bounded provider-disabled Staging scope.
- Provider boundary: no external/paid provider activation, no secrets, no live political generation.
- Release condition: exact-head feedback/AI CI green, reversible Staging migration/probes and independent Supervisor countercheck.

## LOCK-WERK-EXPERT-001
- Task: WERK-EXPERT-001
- Status: RELEASED
- Phase: COUNTERCHECKED_STAGING_CLOSEOUT_CONSUMED
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-21 03:15 Europe/Vienna
- Released: 2026-09-21 05:17 Europe/Vienna after independent Supervisor countercheck was consumed by Builder closeout.
- Scope: bounded IDEENWERK expert/affected-party input contract, source/relationship disclosure, audit trail, citizen-safe transparency, negative tests, and reversible Staging verification; reuse existing operator/review/status/website surfaces.
- Counterchecked evidence: functional head `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`; WERK Expert Input Check #4, WERK Data Contract Registry Check #59 and WERK Frontend Check #182 succeeded; Staging migrations `20260921012806 ideenwerk_expert_input` and `20260921013039 expert_input_operator_index`; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T023924Z.json`.
- Boundary: no expert veto, no political scoring/ranking, no citizen-text mutation, no production deployment, no paid/irreversible action; release does not imply ACCEPTED/Production.
- Reopen: only on concrete contradictory evidence or a documented downstream extension dependency.

## LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001
- Task: WERK-IDEENWERK-IMPACT-BRIDGE-001
- Status: RELEASED
- Phase: COUNTERCHECKED_STAGING_CLOSEOUT_CONSUMED
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-20 22:31 UTC
- Released: 2026-09-21 01:19 Europe/Vienna after independent Supervisor countercheck was consumed by Builder memory closeout.
- Counterchecked evidence: functional evidence head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`; WERK Impact Bridge Check #3 and WERK Frontend Check #177 green; Staging migration `20260920223436 ideenwerk_impact_bridge`; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-20T225510Z.json`.
- Boundary: release closes only the bounded Staging bridge implementation lock; production acceptance is not implied.
- Reopen: only on concrete contradictory evidence or a documented downstream extension dependency.

## LOCK-WFG-VIS-001
- Task: WFG-VIS-001
- Status: STALE
- Holder: legacy branch/agent ownership; exact session no longer authoritative
- Branch/PR: `agent/import-wellfit-landingpage` / PR #2
- Acquired: work existed by 2026-08-15
- Updated: 2026-08-20
- Scope: graphical/landing/UI candidate baseline only
- Resume from: reconcile PR #2 against current main and cross-repo capability before modifying visual product code
- Released: not released; stale until deliberately resumed or superseded

## LOCK-WERK-IDEENWERK-PRIVACY-001
- Task: WERK-IDEENWERK-PRIVACY-001
- Status: RELEASED
- Risk: R2
- Holder: WERK autonomous continuation 2026-09-20
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-20 Europe/Vienna
- Released: 2026-09-20 after verified staging implementation and subsequent privacy/clarification counterchecks.
- Scope: protected no-login citizen privacy access on the existing IDEENWERK status-token path.
- Result: completed; no rebuild unless new evidence invalidates the verified contract.
- Receipt: `WERK_IDEENWERK_PRIVACY_001_RECEIPT.json`.

## Released/superseded locks

### LOCK-WERK-SEC-PGNET-001
- Status: RELEASED
- Released: 2026-09-20 22:13 UTC
- Reason: independent supervisor countercheck satisfied the bounded staging Data-API boundary scope.
- Residual `extension_in_public` / hosted direct-ACL concern remains an open production-hardening loop, not a lock on Impact Bridge feature work.

## LOCK-WERK-IDEENWERK-TRIAGE-001
- Task: WERK-IDEENWERK-TRIAGE-001
- Status: RELEASED
- Risk: R2
- Holder: WERK autonomous continuation 2026-09-20
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-20 Europe/Vienna
- Released: 2026-09-20 after CI run 96 succeeded, staging migration `review_path_audit` was applied and synthetic verification was cleaned to baseline.
- Scope: connect the existing IDEENWERK triage contract to the real staging precheck path and persist a procedural review path/depth without political scoring or acceptance decisions.
- Result: FAST/STANDARD/DEEP procedural depth is implemented and `review_path_assigned` is persisted when a submission enters precheck; receipt `WERK_IDEENWERK_TRIAGE_001_RECEIPT.json`.
- Recovery: restore the previous staging status function from migration 018, drop `ideenwerk_review_depth(text,jsonb)` and remove the runtime marker; no production deployment occurred.

## LOCK-WFG-MOBILE-UX-001
- Task: WFG-MOBILE-UX-001
- Status: RELEASED
- Risk: R3
- Holder: Codex session 2026-08-26
- Branch/PR: `codex/wf-mobile-one-screen-ar-shell-20260826` / PR #22.
- Acquired: 2026-08-26 Europe/Vienna
- Released: 2026-08-26 after bounded diff and green Guard/Quality countercheck.
- Scope: canonical one-screen AR mobile UX contract and cross-repository responsibility mapping only; no visual runtime, backend or Unity controller implementation.
- Result: specification and coordination records created; runtime gates remain open.
- Recovery: revert PR #22; runtime repositories remain unchanged.

No additional locks recorded.
## LOCK-WERK-LAB-002
- Task: WERK-LAB-002
- Status: RELEASED
- Holder: Codex current WERK continuation
- Acquired: 2026-09-05 UTC
- Scope: labour JSON, labour validation/workflow, dependent WERK registers and WERK project memory only.
- Branch: werk-v49-preview-host
- Released: 2026-09-05 UTC after local verification and commit 869423f.
- Receipt: WERK_LABOUR_HANDOFF.md; publication blocked by automatic approval review; no remote update or deployment occurred.

### WERK-LAB-002 publication continuation — 2026-09-06
- Status: RELEASED
- Holder: Codex WERK continuation 2026-09-06
- Scope: publication receipt and WERK-specific memory reconciliation only.
- Previous lock reconciled: local implementation preserved; owner answered the concrete publication request with “Weiter”.
- Remote implementation: 00bed9975f07435920fd02414a071467532f73a6; all 13 triggered checks succeeded.
- Released: 2026-09-06 after exact-commit CI verification and preparation of the publication receipt.

## LOCK-WERK-LAB-003
- Task: WERK-LAB-003
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-06
- Scope: same-period regional labour source reconciliation, occupation supply acquisition and dependent data contracts; existing branch only.
- Released: 2026-09-06 after publication and exact-commit success of all 13 workflows; receipt WERK_LABOUR_003_CI_RECEIPT.json.

## LOCK-WERK-LAB-004
- Task: WERK-LAB-004
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-06
- Scope: qualification and working-time evidence for August, no invented joint distribution; existing branch only.
- Released: 2026-09-06 after publication and exact-implementation success of all 13 workflows and preparation of WERK_LABOUR_004_CI_RECEIPT.json.

## LOCK-WERK-LAB-005
- Task: WERK-LAB-005
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-06
- Scope: working-time wishes/care evidence and dependent WERK data contracts on existing branch.
- Released: 2026-09-06 after successful publication and all 13 exact-implementation CI workflows; WERK_LABOUR_005_CI_RECEIPT.json.

## LOCK-WERK-CALC-001
- Task: WERK-CALC-001
- Status: RELEASED
- Holder: Codex 2026-09-06
- Scope: WERK-Rechenartefakte, Fiskalvertrag und Projektübergabe.
- Branch: werk-v49-preview-host
- Released: 2026-09-06 after exact-implementation CI success and receipt.

## LOCK-WERK-SV-001
- Status: RELEASED
- Task: WERK-SV-001
- Holder: Codex 2026-09-06
- Scope: SV-01 model, source data, existing calculation and WERK registers.

- Verified: 2096e1cf402ad36968a3d57ffc74c7efc39eba83; all four triggered CI workflows succeeded. WERK_SV_CI_RECEIPT.json.

## LOCK-WERK-SV-002
- Status: RELEASED
- Task: WERK-SV-002
- Holder: Codex 2026-09-06
- Scope: SV model, calculations, program, funding/status registers.

- Verified: 7fc44e6d024bdfc5932f501224094a8d52f482cb; all four triggered workflows successful. WERK_SV_002_CI_RECEIPT.json.

## LOCK-WERK-SV-003
- Status: RELEASED
- Task: WERK-SV-003
- Holder: Codex 2026-09-06
- Scope: WERK SV and debt scenario linkage, program and registers.

- Verified: 5ddea9fd186ea50fd2cde6438767f873acd5a20f; all four triggered workflows successful. WERK_SV_003_CI_RECEIPT.json.

## LOCK-WERK-SV-004
- Status: RELEASED
- Task: WERK-SV-004
- Holder: Codex 2026-09-06
- Scope: WERK employee assessment and dependent SV calculations/registers only.

- Verified: 190e1940446205c4532ecef62c6d6f038a79cd01; all four triggered CI workflows succeeded. WERK_SV_004_CI_RECEIPT.json.

## LOCK-WERK-SV-005
- Status: RELEASED
- Task: WERK-SV-005
- Holder: Codex 2026-09-07
- Scope: WERK debt/SV calculation, source context, reports and contracts.

- Verified: 21fbedb180f45823cbfeeb44fd326dfb4b7fdd09; all four triggered CI workflows succeeded. WERK_SV_005_CI_RECEIPT.json.

## LOCK-WERK-SV-006
- Status: RELEASED
- Task: WERK-SV-006
- Holder: Codex 2026-09-07
- Scope: WERK contribution evidence, fiscal contract and reports.

- Verified: 25188b55f422ae204de2a495ae53d11338291607; all three triggered remote workflows succeeded.

## LOCK-WERK-SV-007
- Status: RELEASED
- Task: WERK-SV-007
- Holder: Codex 2026-09-07
- Scope: payroll threshold evidence and WERK handoff.

- Verified at af98ba7d35af415f8c0a297c0cb3d5a98fa8f93a; WERK_SV_007_CI_RECEIPT.json.

## LOCK-WERK-SV-008
- Task: WERK-SV-008
- Status: RELEASED
- Holder: Codex WERK continuation 2026-09-08
- Scope: new ALV transition model/library/report, fiscal integration and WERK memory on existing branch.

- Released 2026-09-08 after exact-implementation success of all three workflows; WERK_SV_008_CI_RECEIPT.json.

## LOCK-WERK-SV-009
- Task: WERK-SV-009
- Status: RELEASED
- Holder: Codex WERK continuation 2026-09-08
- Scope: new contribution-distribution and cost-bound artifacts, fiscal integration and WERK memory; existing branch.

- Released 2026-09-08 after exact-implementation success of all three workflows; WERK_SV_009_CI_RECEIPT.json.

## LOCK-WERK-SV-010
- Task: WERK-SV-010
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-08
- Scope: bounded ALV interval library/data/report/checks and WERK memory; existing branch only.
- Released: 2026-09-08 after exact-commit CI success; WERK_SV_010_CI_RECEIPT.json.

## LOCK-WERK-SV-011
- Task: WERK-SV-011
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-08
- Scope: bounded official source, funding library/report/checks and WERK memory.
- Released: 2026-09-08 after exact-commit success; WERK_SV_011_CI_RECEIPT.json.

## LOCK-WERK-TAX-001
- Task: WERK-TAX-001
- Status: RELEASED
- Risk: R2
- Holder: Codex WERK continuation 2026-09-08
- Scope: bounded ABB source, TAX02 model context, new calculator and WERK integration/memory.

- Exact implementation abcc4a3c577d52dcc0532f1ecbc05ad833479077: all four triggered workflows succeeded; WERK_TAX_001_CI_RECEIPT.json.

## LOCK-WERK-SUB-001
- Task: WERK-SUB-001
- Status: RELEASED
- Holder: Codex WERK continuation 2026-09-09
- Scope: subsidy data, checks, status, memory and existing WERK branch.

- Released 2026-09-09 after exact-implementation success of all 13 workflows; WERK_SUB_001_CI_RECEIPT.json.
