# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-001`
- Status: `COUNTERCHECKED_STAGING_CLOSEOUT_REQUIRED`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Gegengeprüften WERK-IMPACT-001 Zustand kanonisch konsumieren

## Why this action is selected
`WERK-IMPACT-001` is now independently `COUNTERCHECKED_STAGING`: exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb` passed WERK Impact Measurement Check #6 and Data Contract Registry Check #63, migration `20260921062817 werk_impact_authoritative_source_binding` is live, the current authoritative source tuple passes, unknown/stale/mismatched tuples fail closed, and all impact tables remain zero-row.

The Supervisor has already resolved `CTR-WERK-IMPACT-SOURCE-BINDING-001`, recorded the COUNTERCHECKED receipt, closed the impact open loop and advanced the Finishline gate. However builder-owned registers that still show `IMPLEMENTED_NOT_VERIFIED` / an active impact lock must consume the same receipt before the selector may safely start the downstream task.

## Exact next step
Canonical memory closeout only: set `WERK-IMPACT-001` to `COUNTERCHECKED_STAGING` in Task Ledger/Started Work, release `LOCK-WERK-IMPACT-001`, update `WERK-DEP-IMPACT-FEEDBACK-001` to reflect that the upstream prerequisite is satisfied, and consume the independent receipt. Do not change migration 043 or rebuild impact measurement.

After that closeout, catalog priority selects `WERK-IMPACT-FEEDBACK-001` / `NBA-WERK-IMPACT-FEEDBACK`.

## Do not change
- Do not rebuild Impact Bridge, Expert Input, AI synthesis base or WERK-IMPACT-001.
- Do not activate an external/paid AI provider.
- Do not infer causal policy effect, new fiscal values or political ranking from review text.
- Do not perform production, identity or voting activation.

## Known separate YELLOW items
Hosted Supabase still reports `pg_net extension_in_public`, blocking production-security acceptance. The current governance/control head also lacks exact-head GitHub Actions evidence; this does not invalidate the exact-head-green functional implementation but remains a separate evidence gap.
