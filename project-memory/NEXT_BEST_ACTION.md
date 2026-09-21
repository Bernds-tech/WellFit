# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-001`
- Status: `AWAITING_INDEPENDENT_COUNTERCHECK`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Autoritative Wirkungsmessungs-Source-Bindung unabhängig gegenprüfen

## Why this action is selected
The Builder has implemented the previously blocking YELLOW source-binding reconciliation without creating a parallel registry or calculator. Exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb` passed WERK Impact Measurement Check #6 and Data Contract Registry Check #63. Staging migration `20260921062817 werk_impact_authoritative_source_binding` is live; the canonical current tuple is accepted and unknown map, map/reform mismatch, map/artifact mismatch and stale source version fail closed while all impact tables remain zero-row.

Builder evidence is not independent acceptance. `CTR-WERK-IMPACT-SOURCE-BINDING-001`, `WERK-LOOP-IMPACT-001` and `LOCK-WERK-IMPACT-001` therefore remain open until the Supervisor independently rechecks the exact CI/runtime/security evidence.

## Exact next step
1. Supervisor re-read exact functional head `ceea9a8bce350529114258049a93ba1057dacbeb` and WERK Impact Measurement Check #6 / Data Contract Registry #63.
2. Independently verify live migration 043 and the valid current tuple plus unknown/stale/mismatched fail-closed paths.
3. Recheck zero synthetic baseline and security/advisor state after the schema change.
4. If evidence agrees, Supervisor reconciles the contradiction/freshness state; Builder then consumes the closeout and may advance `WERK-DEP-IMPACT-FEEDBACK-001`.

## Do not start yet
- Do not implement `WERK-IMPACT-FEEDBACK-001` before independent countercheck.
- Do not activate an external/paid AI provider.
- Do not infer causal policy effect or political recommendation.
- Do not reopen Impact Bridge, Expert Input or bounded provider-disabled AI synthesis.

## Known separate production-hardening item
Hosted Supabase still reports `pg_net extension_in_public`; this remains separate from the impact source-binding correctness path and continues to block production-security acceptance.
