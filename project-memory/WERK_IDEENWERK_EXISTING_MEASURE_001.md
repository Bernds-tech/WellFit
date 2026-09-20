# WERK IDEENWERK — Existing Measure Check / Human Review

- Task: `WERK-IDEENWERK-EXISTING-MEASURE-001`
- Date: 2026-09-20
- Status: `VERIFIED_STAGING`
- Risk: `R2`
- Branch: `werk-v49-preview-host`
- Functional implementation head before handoff: `d6bb32a769b92bee56b002faf0722ff84003b8cd`

## Implemented

Migration `030_existing_measure_check` adds a conservative precheck against the existing WERK baseline registries. It reuses the audited repository datasets rather than introducing a second policy registry:

- `current-government-measures-register` `2026-09-03-v2`
- `implementation-overlap` `2026-09-03-v3`
- `government-measure-legal-status` `2026-09-05-v3`
- `government-reference-measures` `2026-09-03-v1`

The runtime classifier uses only high-specificity aliases. `possible_overlap` means only that a known WERK baseline deserves human comparison. `no_known_overlap` is explicitly not proof that no existing or planned measure exists. The check never accepts, rejects, merges, scores political merit or changes the citizen's proposal.

The result is token-protected in the existing private status contract and included in the private GDPR export. The existing V71 IDEENWERK status surface displays a citizen-readable overlap notice or a bounded no-hit notice; there is no parallel page.

Migration `031_existing_measure_review_queue` closes the previous operational gap: every `possible_overlap` result creates exactly one active `review_tasks` entry with `review_type=existing_measure_overlap`, `required_role=impact_reviewer`, priority 75. Repeated checks do not duplicate the active task. `no_known_overlap` creates no review task. The queue trigger records an audit event but performs no decision itself.

## Staging verification

`WERK Österreich Staging` has both runtime contracts active:

- `existing_measure_check_contract = 030_existing_measure_check`
- `existing_measure_review_queue_contract = 031_existing_measure_review_queue`

Reversible synthetic checks proved:

- digital administration / Once-Only -> `possible_overlap`, refs `GOV-REFORMPARTNERSHIP-ADMIN`, `GOV-DADEX`, `ADM-01`, confidence 0.960, human review required;
- protected status returns the same result and a wrong status-token is denied;
- private export contains the same result;
- unrelated drinking-fountain fixture -> `no_known_overlap`, empty refs, no human-review task;
- `possible_overlap` creates one open unassigned `existing_measure_overlap` task for `impact_reviewer`, priority 75, with zero review decisions;
- replaying the classifier leaves one active task and one enqueue audit event;
- submission remains at `precheck` and `original_text` remains unchanged.

All synthetic staging rows were removed after verification. Final counts are zero for submissions, processing jobs, review tasks, review decisions, audit events, privacy requests, clarifications, clarification prompts, competence prechecks, existing-measure checks and clusters.

## Gates

- `IDEENWERK Backend Check #130` succeeded on `e4e4b07c2b301d604cc324022f3676673b8d110c`, including migrations/idempotency, the new existing-measure check and human-review routing guardrails, prior privacy/clarification/competence guardrails, backup/restore, clustering diagnostics and the 1,000-item queue integration load.
- `WERK Frontend Check #152` succeeded on API-contract head `d6bb32a769b92bee56b002faf0722ff84003b8cd`.
- The existing staging Edge function remains version 5; no production deploy or Edge redeploy was needed because the protected status/export routes consume the updated database RPC contracts.

## Remaining bounded gap / next slice

`staging-competence-precheck-e2e.mjs` now asserts `existing_measure_check` through the real protected HTTP status/export path in the reusable staging smoke suite. This exact HTTP assertion was not executed from the current tool runtime because it has no outbound network/database-secret path; database/RPC/staging behavior is verified independently above.

Next functional slice: `WERK-IDEENWERK-EXISTING-MEASURE-REVIEW-RESOLUTION-001`. Reuse the existing human `review_decisions`/role enforcement to persist a bounded overlap disposition and reason code, close the review task audibly, and expose only the citizen-relevant result without operator identity. The resolution must remain factual/procedural and must not automatically accept or reject the proposal.
