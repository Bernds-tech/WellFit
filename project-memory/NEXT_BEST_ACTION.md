# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-EXPERT-001`
- Catalog entry: `NBA-WERK-EXPERT-PROCESS`
- Status: `EXECUTABLE`
- Risk: `R3`
- Gate: `expert_process`
- Title: Experten- und Betroffeneninput auditierbar in IDEENWERK integrieren

## Why this is next
`WERK-IDEENWERK-IMPACT-BRIDGE-001` is independently `COUNTERCHECKED_STAGING` and its canonical master receipt index is now reconciled. Task Ledger, Started Work, Work Lock, Open Loop, Dependency and System Graph all consume the same bounded completion state. The next lowest-priority executable catalog action is therefore the expert/betroffenen process.

## Exact work
1. Reuse the existing IDEENWERK review/audit model instead of creating a parallel platform.
2. Define structured expert/betroffenen input with source, role, relation to the subject, declared conflict/interest context, evidence/provenance and a bounded counter-position field.
3. Keep expert input advisory and auditable: no expert veto, no automatic acceptance/rejection and no political merit score.
4. Bind expert input to the relevant citizen problem/cluster and, where applicable, the already counterchecked Impact Bridge references.
5. Expose only citizen-relevant transparent information through existing protected/public IDEENWERK surfaces; keep operator/private data fail-closed.
6. Add role/authorization, idempotency, stale/version, negative-path and audit-trail tests; use reversible Staging verification and restore synthetic zero baseline.
7. Produce a Builder claim only; independent Supervisor countercheck remains required before any gate advancement.

## Do not rebuild
Do not rebuild the Impact Bridge, competence review, existing-measure review, privacy, clarification, public clusters or FAST/STANDARD/DEEP. Extend existing contracts and review infrastructure.

## Residual independent finding
`WERK-LOOP-SEC-PGNET-001` remains `OPEN_NONBLOCKING_PRODUCTION_HARDENING`. The hosted Supabase `extension_in_public` warning blocks Production security acceptance but does not block this reversible Staging feature work.

## After this
When `WERK-EXPERT-001` is independently counterchecked, `WERK-AI-SYNTH-001` becomes the next major functional integration because its two prerequisites—Impact Bridge and Expert Process—will then be satisfied.
