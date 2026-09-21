# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-FEEDBACK-001`
- Catalog entry: `NBA-WERK-IMPACT-FEEDBACK`
- Status: `RECONCILIATION_REQUIRED`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Wirkungsfeedback-Auswahl vor unabhängigem Closeout korrigieren

## Independent Supervisor result
The functional implementation remains bound to exact head `6d95b394d0869fb91562f6a84a13502469ef7869`.

Exact-head GitHub Actions were independently confirmed green:
- WERK Impact Feedback Check #1 — success.
- WERK AI Synthesis Check #5 — success.
- WERK Data Contract Registry Check #64 — success.
- WERK Frontend Check #194 — success.
- IDEENWERK Backend Check #185 — success.

WERK Österreich Staging is `ACTIVE_HEALTHY`; migration `20260921084055 ideenwerk_impact_feedback` is live; `werk-ideenwerk-api` remains v7; feedback/source-snapshot/record RPC execution is service-role-only; zero synthetic baseline and empty processing/review queues were independently rechecked. Fresh Security Advisor still reports only the pre-existing `pg_net extension_in_public` WARN.

## Blocking YELLOW reconciliation in the same task
`public.ideenwerk_ai_feedback_context()` currently orders all qualifying impact reviews globally, applies `LIMIT 50`, and only afterwards tests whether each review's `impact_map_id`/`reform_id` belongs to the current submission's Impact Bridge. Therefore more than 50 newer unrelated reviews can hide an older relevant current review before relevance is evaluated. This means the broad builder/system-graph claim that the function consumes up to 12 current matching reviews is not yet fully counterchecked.

The fix must remain inside the existing `WERK-IMPACT-FEEDBACK-001` scope: filter for the current submission's map/reform relevance before the bounded candidate limit, retain the final maximum of 12 exposed reviews, and add a regression case with more than 50 newer unrelated reviews. Then rerun exact-head CI and the current/stale/rollback staging probes. Do not create a parallel feedback store, calculator or task system.

## Separate YELLOW freshness gap
The live `werk_impact_measurement_snapshot()` still returns a stored measurement plan and its stored `source_version` without revalidating the tuple through `werk_impact_validate_source_binding(...)`. A later authoritative source/registry change can therefore require revalidation even though the stored plan was valid when written. Keep `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` open before current-state/acceptance reliance; historical evidence remains historical.

## Safety boundary retained
Impact observations, attribution hypotheses and improvement hypotheses remain review material, never causal fact. Existing anti-ranking, anti-recommendation, anti-accept/reject and anti-new-numeric-effect guards remain in force. The external synthesis provider remains disabled; no paid/external call, secret change, live political AI generation, production action or automatic political change is authorized.

## Exact next step
Builder fixes the relevance-before-limit defect under the existing active task/lock, adds the missing regression case, pushes a new functional head, and produces exact-head CI plus fresh staging evidence. Independent Supervisor then counterchecks that new head. No next functional slice starts before this reconciliation closes.

## Known separate production-hardening item
Hosted Supabase still reports `pg_net extension_in_public`. It remains nonblocking for reversible Staging feature work but blocks production-security acceptance.
