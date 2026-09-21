# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-EXPERT-001`
- Catalog entry: `NBA-WERK-EXPERT-PROCESS`
- Status: `AWAITING_INDEPENDENT_COUNTERCHECK`
- Risk: `R3`
- Gate: `expert_process`
- Title: Experten- und Betroffeneninput auditierbar in IDEENWERK integrieren

## Builder result
The bounded expert/betroffenen process is implemented on Staging and must now be independently counterchecked before the gate or downstream AI synthesis can advance.

Implemented without a parallel platform:
1. source-bound, append-only expert/affected-party input on the existing IDEENWERK submission/audit model;
2. explicit contributor role, subject relation/expertise, source URL/reference, relationship/conflict disclosure and optional separately sourced counterposition;
3. write access limited to an active `impact_reviewer` through the trusted service-role boundary;
4. deterministic idempotency with changed-payload conflict rejection;
5. protected citizen status and privacy export expose only citizen-relevant expert input; operator identity, idempotency key and payload hash remain private;
6. existing V71 status surface renders the input through `site-ideenwerk-expert.js` using safe DOM text nodes rather than a parallel page;
7. aggregate expert-input transparency exists content-free behind the trusted API layer for reuse by the existing transparency surface;
8. no expert veto, political merit score, review-depth override, citizen-text mutation, automatic acceptance/rejection or manufactured fiscal/impact effect was introduced.

## Exact builder evidence
- Functional evidence head: `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`.
- WERK Expert Input Check #4: `SUCCESS`.
- WERK Data Contract Registry Check #59: `SUCCESS`.
- Staging migration: `20260921012806 ideenwerk_expert_input`.
- Staging hardening migration: `20260921013039 expert_input_operator_index`.
- Live reversible Staging checks passed for replay deduplication, wrong-role fail-closed, append-only mutation guard, citizen-safe status projection and aggregate-only transparency.
- Fresh performance-advisor follow-up no longer reports the new unindexed operator foreign key after migration 039.
- Synthetic expert/submission/operator/audit fixtures were cleaned; Staging returned to zero relevant fixture rows.
- Edge function `werk-ideenwerk-api` remained ACTIVE at version 7; no Edge deployment was required for the protected status DB contract.

## Open countercheck boundaries
- Builder evidence is not Supervisor evidence. `LOCK-WERK-EXPERT-001` remains active until independent countercheck/reconciliation.
- No production deployment or production acceptance is claimed.
- No live browser/visual acceptance is claimed beyond code/CI and the live protected-status data contract; the independent countercheck may require additional UI runtime evidence.
- The aggregate transparency RPC is currently trusted-service-role only; exposing it through the existing public metrics endpoint remains a bounded downstream transparency option, not a claimed public endpoint in this slice.
- Existing `WERK-LOOP-SEC-PGNET-001` remains nonblocking Staging work but still blocks production-security acceptance.

## Do not start yet
Do **not** start `WERK-AI-SYNTH-001` until the independent Supervisor counterchecks `WERK-EXPERT-001`, the expert lock/loop/dependency are reconciled, and the Finishline Navigator consumes the result. If counterchecked, AI synthesis becomes the next major functional integration because Impact Bridge is already `COUNTERCHECKED_STAGING`.
