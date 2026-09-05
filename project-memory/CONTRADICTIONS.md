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

## CTR-WFG-007
- Date: 2026-09-06
- Updated: 2026-09-06
- Related task/change: WFG-RUDI-WORLD-001 / Project Memory reconciliation
- Risk: R2
- Source A: `CURRENT_STATE.md` after the Rudi coordination/site-sync merges
- Claim A: WellFit `main` was still `649a3b647dd6162f402663f2d84b8ca201f45400`.
- Source B: live GitHub branch metadata and merged PRs #29-#31.
- Claim B: at that reconciliation point, live WellFit `main` was `d0d5d6ae42f2e5dccb9387c31ecc36f798329eb9`; PR #29 merged the Rudi graphical coordination, PR #30 merged `RUDI_SITE_SYNC_MANIFEST.json`, and PR #31 finalized the Site-specific handoff.
- Stronger/current evidence: live GitHub branch API plus immutable merge commits.
- Status: RESOLVED
- Resolution/action: `CURRENT_STATE.md` was reconciled to the then-live branch state and recorded PRs #29-#31 plus the exact Site-transfer manifest. No runtime or public Site change was implied by this memory correction.
- Evidence: historical WellFit branch observation `d0d5d6ae42f2e5dccb9387c31ecc36f798329eb9`; WellFit-now immutable merge `9ae4f278a90d17d612f0399c40babd32c344e02b`; `project-memory/RUDI_SITE_SYNC_MANIFEST.json`.
- Falsification question: a newer live WellFit main is expected over time and does not invalidate the immutable evidence; only a newer accepted Site-sync source supersedes the Rudi transfer contract.

## CTR-WFG-008
- Date: 2026-09-06
- Updated: 2026-09-06
- Related task/change: Project Memory live-ref semantics
- Risk: R2
- Source A: prior `CURRENT_STATE.md` convention
- Claim A: a tracked file can safely state that mutable `main` "is currently" a specific SHA.
- Source B: Git semantics plus PR #32 merge behavior.
- Claim B: updating that tracked statement necessarily creates a later commit/merge SHA, so the statement becomes stale immediately after the very reconciliation that writes it.
- Stronger/current evidence: live GitHub branch API showed `main` advancing after each Project Memory merge while immutable merge/evidence SHAs remained valid historical facts.
- Status: RESOLVED
- Resolution/action: mutable branch tips are no longer persisted as static current truth. Mandatory preflight queries live refs; Project Memory stores immutable merge/exact-head/evidence revisions only. `project_memory_quality_check.py` now rejects self-staling `CURRENT_STATE.md` wording that binds current `main` to a 40-character SHA.
- Evidence: `PROTOCOL.md`, `DO_NOT_ASSUME.md`, `CURRENT_STATE.md`, `scripts/project_memory_quality_check.py` on the reconciliation branch.
- Falsification question: if a tracked current-branch SHA could remain identical after the commit that changes that same tracked file, this rule would be unnecessary; ordinary Git commit semantics make that impossible for this workflow.

Never resolve a contradiction by deleting the older record. Preserve the stale claim and record why it was superseded.
