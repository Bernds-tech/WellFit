# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-AI-SYNTH-001`
- Catalog entry: `NBA-WERK-AI-SYNTHESIS`
- Status: `AWAITING_AUTHORITATIVE_GATE_CONSUMPTION`
- Risk: `R3`
- Gate: `ai_synthesis`
- Title: KI-Synthese aus Bürgerideen, Experteninput und bestehenden WERK-Modellen vorbereiten

## Why this is next
`WERK-EXPERT-001` is independently `COUNTERCHECKED_STAGING` and the Builder-side canonical closeout has been consumed: expert loop closed, lock released, dependency satisfied and system-graph source edges can be marked counterchecked. The Impact Bridge was already `COUNTERCHECKED_STAGING` and must not be rebuilt.

The remaining prerequisite transition is owned by other roles: `WERK_FINISHLINE_STATE.json` still shows `expert_process=TODO`, and `WERK_EVIDENCE_FRESHNESS.json` has not yet consumed the fresh 2026-09-21 expert/runtime/advisor countercheck. Under the write-authority contract, the Builder may not self-update those records or start AI synthesis while they remain stale.

## Required authoritative reconciliation before implementation starts
1. Finishline Navigator consumes the independent expert receipt and updates `expert_process` only to the evidence-supported staging state; no ACCEPTED/PRODUCTION_CONFIRMED claim.
2. Evidence Reaper/Supervisor records the fresh expert/runtime/advisor evidence from `WERK_SUPERVISOR_2026-09-21T023924Z.json` and supersedes stale current-state entries without deleting history.
3. Supervisor closes `WERK-EXPERT-CLOSEOUT-RECON-001` after confirming Task/Started Work/Lock/Loop/Dependency/System Graph are reconciled.
4. `WERK_NEXT_BEST_ACTIONS.json` remains navigator-owned; once its prerequisites resolve against canonical gate state, `NBA-WERK-AI-SYNTHESIS` becomes executable.

## Intended bounded AI-synthesis scope once executable
- Reuse existing citizen problem/cluster, Impact Bridge references and counterchecked expert/affected-party evidence.
- Generate multiple traceable solution variants with provenance, explicit uncertainty/open gates and counterpositions.
- No political ranking, automatic acceptance/rejection, expert veto, manufactured fiscal effect or replacement of existing WERK calculations.
- Reuse existing IDEENWERK/API/V71 surfaces; no parallel platform.
- Add deterministic source/version binding, negative/stale tests, audit trail and reversible Staging verification before any downstream claim.

## Current evidence
- Expert functional head: `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`.
- Expert countercheck receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T023924Z.json`.
- Expert CI: WERK Expert Input Check #4, WERK Data Contract Registry Check #59, WERK Frontend Check #182 all successful.
- Staging migrations: `20260921012806 ideenwerk_expert_input`, `20260921013039 expert_input_operator_index`.
- Impact Bridge remains `COUNTERCHECKED_STAGING` at functional head `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`.
- Hosted `pg_net extension_in_public` remains a separate nonblocking Staging / blocking Production-hardening issue.

## Do not start yet
Do **not** implement `WERK-AI-SYNTH-001` until the Finishline/Freshness authoritative records consume the expert countercheck and the Supervisor clears the blocking closeout finding. Do not rebuild Impact Bridge or Expert Input.