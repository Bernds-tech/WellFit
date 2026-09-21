# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-FEEDBACK-001`
- Catalog action: `NBA-WERK-IMPACT-FEEDBACK`
- Status: `EXECUTABLE`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Gegengeprüfte Wirkungsreviews kontrolliert in den KI-Kontext zurückführen

## Why this action is selected
`WERK-IMPACT-001` is now independently `COUNTERCHECKED_STAGING`: exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb` passed WERK Impact Measurement Check #6 and Data Contract Registry Check #63, migration `20260921062817 werk_impact_authoritative_source_binding` is live, the current authoritative source tuple passes, unknown/stale/mismatched tuples fail closed, and all impact tables remain zero-row. `WERK-AI-SYNTH-001` is already counterchecked for the bounded provider-disabled staging scope.

This satisfies the catalog prerequisites for `WERK-IMPACT-FEEDBACK-001`. The previous source-binding contradiction is resolved for Staging and must not trigger a rebuild of WERK-IMPACT-001.

## Exact next step
Build the existing bounded feedback integration only: make independently reviewed impact/improvement hypotheses available to the already-existing AI synthesis context with explicit provenance, source version, uncertainty and review state. The consumer must fail closed on stale/unreviewed/mismatched evidence and must not convert a hypothesis into an observed fact, causal effect, political recommendation or automatic policy change.

## Do not start / do not change
- Do not rebuild Impact Bridge, Expert Input, AI synthesis base or WERK-IMPACT-001.
- Do not activate an external/paid AI provider.
- Do not infer causal policy effect, new fiscal values or political ranking from review text.
- Do not perform production, identity or voting activation.

## Known separate production-hardening item
Hosted Supabase still reports `pg_net extension_in_public`; this remains separate from the impact-feedback implementation path and continues to block production-security acceptance.

## Evidence boundary
The current governance/control head itself still lacks an exact-head GitHub Actions run. This does not invalidate the independently exact-head-green functional implementation, but it remains a separate YELLOW evidence gap until a relevant control-equivalent head is CI-counterchecked.
