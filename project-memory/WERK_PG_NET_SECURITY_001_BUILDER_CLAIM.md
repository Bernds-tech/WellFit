# WERK-SEC-PGNET-001 — Builder Claim

Stand: 2026-09-20 20:42 UTC

Status: `IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK`
Risk: `R3`
Finding: `CTR-WERK-SEC-PGNET-ACL-001`
Open loop: `WERK-LOOP-SEC-PGNET-001`
Functional code head: `4d79bf4fab4ec3448033f77919bd32c18ab6a7a4`
Branch: `werk-v49-preview-host`
Target: `WERK Österreich Staging`

## Claim

The Builder claims only the following bounded result:

WERK now has a platform-compatible public/user Data-API boundary around Hosted-Supabase-managed pg_net without moving, dropping, reinstalling or invoking the extension. `anon` and `authenticated` requests selecting PostgREST profile `net` are fail-closed by a pre-request guard, WERK exposes no anon/authenticated wrapper to pg_net routines, ordinary public IDEENWERK API behavior remains available, and the staging state is reversible. This claim does **not** say that Supabase-managed direct `net` ACLs were durably revoked, that the `extension_in_public` advisor warning disappeared, or that production security is accepted.

## Repository implementation

- `ideenwerk-backend/sql/036_pg_net_data_api_guard.sql`
  - creates `public.werk_api_security_guard()`;
  - configures `pgrst.db_pre_request=public.werk_api_security_guard` for `authenticator`;
  - blocks `anon`/`authenticated` `Accept-Profile: net` or `Content-Profile: net` with PGRST 403;
  - leaves service-role server paths outside that public/user denial;
  - refuses to overwrite an unrelated pre-existing PostgREST pre-request hook;
  - attempts the former direct ACL revokes but does not claim success against platform-owned grants;
  - never invokes `net.http_*`.
- `ideenwerk-backend/scripts/pg-net-security-guard-smoke.mjs`
  - checks NOLOGIN public roles, configured pre-request hook, absence of WERK-owned pg_net wrappers, public-profile allow path, net-profile deny paths and service-role non-regression;
  - treats open direct `net` ACLs as tolerable only when the schema is Supabase-owned and the WERK Data-API boundary is present.
- backend CI applies migration 036 twice for idempotency and runs `guardrails:pg-net` with the existing IDEENWERK contract/smoke/backup/restore suite.

## Staging evidence produced by Builder

Migration: `20260920203049 pg_net_data_api_guard` applied successfully on WERK Österreich Staging.

Observed after apply:

- `pgrst.db_pre_request=public.werk_api_security_guard` is configured for `authenticator`.
- Direct guard invocation as `anon` with profile `public` succeeds.
- Direct guard invocation as `anon` with profile `net` fails with expected PGRST 403 / `WERK_INTERNAL_SCHEMA`.
- Count of WERK/non-managed functions exposing pg_net routines to anon/authenticated: `0`.
- Hosted Supabase continues to own/manage direct `net` ACLs through `supabase_admin`; WERK's best-effort revoke did not establish a durable direct-ACL claim.
- Security Advisor still reports `extension_in_public` for pg_net; no unsafe extension move/drop/reinstall was attempted.
- `werk-ideenwerk-api` remained active at Edge version `7`.
- Relevant IDEENWERK citizen/review/privacy/cluster tables were checked at zero synthetic baseline after the change.

## Negative / recovery evidence

No outbound pg_net HTTP request was executed.

A transactional rollback rehearsal performed:

1. reset `authenticator` `pgrst.db_pre_request`;
2. drop only `public.werk_api_security_guard()`;
3. rollback the transaction.

After rollback, the guard function and pre-request setting were still present, proving the bounded recovery sequence is syntactically viable without leaving staging rolled back.

## CI evidence

IDEENWERK Backend Check #161, attempt 1, exact head `4d79bf4fab4ec3448033f77919bd32c18ab6a7a4`:

Passed before the final load step:
- syntax and 34 unit tests;
- migration apply and migration idempotency;
- operator/privacy/clarification/competence/existing-measure guardrails;
- distributed rate-limit guardrail;
- **pg_net Data API security guardrail**;
- no-login API/privacy smoke;
- retention dry-run;
- backup and isolated restore verification;
- clustering diagnostic.

Attempt 1 failed only at the unchanged 1,000-item queue integration benchmark after the existing 120-second timeout with work still queued. The Builder did not relax the threshold or hide the failure. One unchanged failed-job rerun was started; this claim must be updated/consumed with its final result before an independent countercheck treats full backend CI as green.

## Explicit non-claims

- Direct Supabase-managed `net` schema/function ACLs are **not** claimed revoked.
- The Supabase `extension_in_public` warning is **not** claimed fixed.
- No exploit, outbound-call vulnerability or data leak is claimed to have existed.
- No production change or production security acceptance occurred.
- No `ACCEPTED`, `VERIFIED` or `COUNTERCHECKED` status is self-awarded by the Builder.

## Required independent countercheck

Supervisor must independently verify:

1. exact functional head and backend CI outcome;
2. staging migration 036 and current PostgREST hook;
3. anon/authenticated net-profile fail-closed behavior;
4. absence of WERK-owned pg_net exposure paths;
5. current Hosted-Supabase-managed ACL/advisor limitation;
6. Edge/runtime health and zero synthetic baseline;
7. rollback/recovery plausibility;
8. whether the remaining managed ACL/advisor limitation is acceptable for staging and what remains blocked for production.

Only after that countercheck may the security blocker be closed/narrowed and the Builder proceed to `WERK-IDEENWERK-IMPACT-BRIDGE-001`.
