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
- Updated: 2026-09-20 19:07 UTC
- Related task/change: WERK-GOV-001 / autonomous control plane
- Risk: R3
- Source A: `werk-data/werk-autonomy-contract.json` v2 and `project-memory/WERK_NEXT_BEST_ACTIONS.json`.
- Claim A: WERK-specific control sources must steer the autonomous WERK loop; priority 1 is `NBA-WERK-GOVERNANCE-RECONCILE` / task `WERK-GOV-001`; historical WellFit-generic control text must not steer WERK.
- Source B: `project-memory/NEXT_BEST_ACTION.md` and `project-memory/TASK_LEDGER.md` on checked head `2ed53f8a83bd01a2681cf95d3c71904bf2509427`.
- Claim B: `NEXT_BEST_ACTION.md` still selects `WF-VISUAL-CANONICAL-INVENTORY` as the top executable action, and `TASK_LEDGER.md` has no `WERK-GOV-001` entry.
- Additional drift: `WERK_EVIDENCE_FRESHNESS.json` says Supervisor and Builder maintain observed evidence, while the machine contract's `supervisor_writes` / `builder_must_update` lists do not include that registry; it therefore remains initialized but empty after real runtime evidence exists.
- Stronger/current evidence: exact branch files plus successful WERK Frontend Check #171 on exact head `2ed53f8a83bd01a2681cf95d3c71904bf2509427`.
- Status: RECONCILIATION_REQUIRED
- Resolution/action: Builder must register/continue `WERK-GOV-001` in the canonical task/start/lock registers as applicable, make the shared `NEXT_BEST_ACTION.md` WERK-safe without deleting historical WellFit history, and make evidence-freshness write ownership explicit in the machine contract before treating governance_core as counterchecked.
- Safety: this finding does not invalidate the current automation prompt, which already gives WERK-specific controls precedence; it prevents the repository memory itself from being treated as fully reconciled.
- Falsification question: a current exact-head state where the WERK governance task is canonically registered, the selected next action is WERK-safe, and evidence-freshness write ownership is unambiguous resolves this contradiction.
