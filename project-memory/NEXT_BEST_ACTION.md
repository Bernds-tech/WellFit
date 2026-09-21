# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IMPACT-FEEDBACK-001`
- Catalog entry: `NBA-WERK-IMPACT-FEEDBACK`
- Status: `AWAITING_INDEPENDENT_COUNTERCHECK`
- Risk: `R3`
- Gate: `impact_measurement`
- Title: Gegengeprüfte Wirkungsreviews kontrolliert in den KI-Kontext zurückführen

## Builder result now awaiting Supervisor
The bounded feedback integration is implemented on exact functional head `6d95b394d0869fb91562f6a84a13502469ef7869`.

Exact-head GitHub Actions are green:
- WERK Impact Feedback Check #1 — success.
- WERK AI Synthesis Check #5 — success.
- WERK Data Contract Registry Check #64 — success.
- WERK Frontend Check #194 — success.
- IDEENWERK Backend Check #185 — success.

WERK Österreich Staging is `ACTIVE_HEALTHY` and migration `20260921084055 ideenwerk_impact_feedback` is active. A fresh rollback-only live probe verified: anon/authenticated cannot execute `ideenwerk_ai_feedback_context`; service_role can; a current source-bound impact review with improvement hypothesis, uncertainty and provenance enters the v2 synthesis snapshot; an unknown/non-current impact-review reference is rejected; stale Impact-Bridge registry state makes feedback and current synthesis fail closed as `revalidation_required`; rollback restores zero synthetic baseline. Fresh Security Advisor still reports the pre-existing single `pg_net extension_in_public` WARN and no new WARN attributable to this migration.

## Implemented connection
`IMPROVEMENT-LOOP` → `AI-SYNTHESIS` now consumes at most 12 current reviews whose map/reform matches the submission's current Impact Bridge and whose authoritative map/reform/artifact/source-version tuple validates. Reviews require a nonempty improvement hypothesis, explicit uncertainty and provenance. Eligible `impact_review` IDs are included in the existing AI source snapshot; stale/new feedback changes or invalidates that snapshot fail-closed. No parallel feedback store or calculator was introduced.

## Safety boundary retained
Impact observations, attribution hypotheses and improvement hypotheses remain review material, never causal fact. Existing anti-ranking, anti-recommendation, anti-accept/reject and anti-new-numeric-effect guards remain in force. The external synthesis provider remains disabled; no paid/external call, secret change, live political AI generation, production action or automatic political change occurred.

## Exact next step
Independent Supervisor must countercheck functional head `6d95b394d0869fb91562f6a84a13502469ef7869`, exact-head CI, migration 044, ACL/current/stale live probes, zero-baseline and fresh advisor result. Until that receipt exists, keep `LOCK-WERK-IMPACT-FEEDBACK-001`, the task, loop and dependency open and do not start the next functional slice.

## Known separate YELLOW item
Hosted Supabase still reports `pg_net extension_in_public`. It remains nonblocking for reversible Staging feature work but blocks production-security acceptance.
