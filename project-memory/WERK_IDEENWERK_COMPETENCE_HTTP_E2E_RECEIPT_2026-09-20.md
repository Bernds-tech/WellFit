# WERK IDEENWERK – Competence HTTP E2E Receipt

Date: 2026-09-20
Scope: WERK Österreich Staging only
Branch: `werk-v49-preview-host`
Production changes: none

## Delivered

A dedicated reusable staging HTTP end-to-end test now verifies the competence precheck through the deployed citizen path:

- create a synthetic submission via deployed `POST /submissions`
- wait for the existing staging worker to advance the case to `precheck`
- read the result only through the protected status-token route
- verify the competence result in the protected status and private privacy export
- verify wrong-token denial
- verify immutable `original_text`
- verify audit event and worker completion
- remove all synthetic business data and assert no residue

Implementation files:

- `ideenwerk-backend/scripts/staging-competence-precheck-e2e.mjs`
- `ideenwerk-backend/package.json` (`smoke:staging` now includes the competence E2E)
- `.github/workflows/ideenwerk-backend-check.yml` (syntax gate includes the new E2E script)

Implementation commits:

- `a4a15a505ea7fdb9feb6784aa8080534aa13a81a` – add competence staging HTTP E2E
- `f578438831b2eb6c9212644ac9868adc13e69bdf` – include it in `smoke:staging`
- `d9300ada3089c25283cdd86c66aedeb0bb809da0` – include it in CI syntax validation

## Real staging verification

A reversible HTTP verification was executed against the deployed `werk-ideenwerk-api` Edge Function v5 using the existing server-side `pg_net` capability.

Synthetic input intentionally matched the existing audited competence rule for digital administration. The deployed HTTP/status path returned:

- HTTP submission creation: `201`
- final workflow state: `precheck`
- review depth: `STANDARD`
- competence result: `matched`
- inventory item: `COMP-ADMIN-DIGITAL`
- current class: `mixed`
- suggested level: `geteilt`
- sources: `BVG-10`, `BVG-15`, `BVG-118`
- confidence: `0.85`
- legal change required: `false`
- classifier: `competence-precheck-v1`
- wrong status token: `403 STATUS_ACCESS_DENIED`
- private export: same competence result and `structured_proposal.suggested_level = geteilt`
- worker execution: 5 jobs completed, 0 errors
- original citizen text remained unchanged

No political decision was produced by the precheck; it remains a conservative procedural competence hint.

## Cleanup

The synthetic submission, worker jobs, audit events and competence-precheck row were removed after verification. The temporary internal HTTP response rows used for the check were also removed.

Post-cleanup staging counts:

- submissions: 0
- active jobs: 0
- dead jobs: 0
- cluster candidates: 0
- clusters: 0
- open reviews: 0
- audit events: 0
- privacy requests: 0
- citizen clarifications: 0
- clarification prompts: 0
- competence prechecks: 0

## CI

`IDEENWERK Backend Check #122` on commit `d9300ada3089c25283cdd86c66aedeb0bb809da0` completed successfully. The run passed syntax, unit tests, migration application and idempotency, operator/privacy/clarification/competence guardrails, rate-limit guardrail, API/worker smoke, retention dry-run, backup/restore, clustering diagnostic and the 1,000-item queue integration load.

## Next smallest functional step

With the competence-precheck HTTP gap closed, the next useful precheck component is `existing_measure_check`: reuse the existing WERK government-measure/legal-status/implementation-overlap datasets to flag plausible already-existing measures for review. It must remain conservative, source-backed and non-decisive: ambiguous cases go to review rather than being treated as duplicates or rejected automatically.
