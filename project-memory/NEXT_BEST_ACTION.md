# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-FEEDBACK-001`
- Catalog entry: `NBA-WERK-IMPACT-FEEDBACK`
- Status: `IN_PROGRESS`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Gegengeprüfte Wirkungsreviews kontrolliert in den KI-Kontext zurückführen

## Why this action is selected
`WERK-IMPACT-001` is independently `COUNTERCHECKED_STAGING` and its Builder-owned closeout is consumed: the exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb` passed WERK Impact Measurement Check #6 and Data Contract Registry Check #63; migration `20260921062817 werk_impact_authoritative_source_binding` is live; source binding fails closed for unknown/stale/mismatched tuples; independent receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json` closes the upstream source-binding contradiction.

The Connection Sweep therefore exposes the next missing edge: `IMPROVEMENT-LOOP` → `AI-SYNTHESIS`. Existing impact reviews already carry attribution/improvement hypotheses, alternative explanations, uncertainties and source refs, but the current AI source snapshot/provider context does not yet consume them.

## Exact work
1. Reuse `werk_impact_reviews`, current Impact Bridge mappings and `werk_impact_validate_source_binding`; create no parallel calculator or feedback store.
2. Expose at most 12 current reviews whose measurement plan map/reform matches the submission's current Impact Bridge and whose full source tuple still validates.
3. Require an improvement hypothesis, explicit uncertainty and provenance refs before a review is eligible as feedback context.
4. Add eligible `impact_review` IDs to the existing AI synthesis source snapshot; new/stale feedback must change/invalidate the snapshot fail-closed.
5. Permit `impact_review` source refs only when present in that current snapshot.
6. Preserve all existing anti-ranking, anti-recommendation, anti-accept/reject and anti-new-numeric-effect guards.
7. Run exact-head Impact Feedback + AI Synthesis CI; then apply/reversibly probe migration 044 only on WERK Österreich Staging, restore zero synthetic baseline and produce a Builder claim for independent Supervisor countercheck.

## Safety boundary
Impact observations, attribution hypotheses and improvement hypotheses remain review material, not causal fact. This task performs no political ranking, automatic policy change, production action, paid/external provider activation, credential change or real-world implementation claim.

## Known separate YELLOW items
Hosted Supabase still reports `pg_net extension_in_public`, which remains nonblocking for ordinary reversible Staging work but blocks production-security acceptance. Exact-head control/governance CI evidence remains a separate evidence concern and should be refreshed by the triggered workflows on the implementation head rather than by rebuilding runtime work.
