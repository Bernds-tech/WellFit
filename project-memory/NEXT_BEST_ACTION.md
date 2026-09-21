# WERK Next Best Action

Updated: 2026-09-21 Europe/Vienna

## Current state
The previously blocking impact-feedback selection and impact-snapshot freshness findings are independently counterchecked and consumed; they must not be rebuilt. `WERK-ID-ARCH-001` is independently counterchecked, and the existing provider-neutral Verified Support core has now been installed reversibly on WERK Österreich Staging under `WERK-ID-CORE-001`. Functional head `da75785b8d7d312f8beefbb2c37ed59abd52a4ff` has exact-head WERK Verified Support Core Check #4 and IDEENWERK Backend Check #194 green. Staging migration `20260921203233 verified_support_core` is live with runtime marker `047_verified_support_core_disabled`; public counting, public identity endpoint, identity provider activation and WERK VOTE remain disabled.

Fresh rollback-only Staging evidence confirms receipt/support creation, exact replay, conflicting idempotency rejection, scope-mismatch rejection, expired-receipt rejection, scoped-pseudonym duplicate prevention, audit non-disclosure of pseudonym/assertion hash, service-role-only direct access and zero synthetic residue. Security Advisor adds no new WARN from this core; the existing `pg_net extension_in_public` warning remains a separate Production-hardening loop.

## Exact next action
1. **Independent Supervisor countercheck of `WERK-ID-CORE-001`** — validate functional head `da75785b8d7d312f8beefbb2c37ed59abd52a4ff`, Verified Support Core #4, Backend #194, migration `20260921203233 verified_support_core`, runtime marker `047_verified_support_core_disabled`, ACL/RLS boundaries, rollback negative paths, no direct identity fields and zero cleanup.
2. Keep `LOCK-WERK-ID-CORE-001`, `WERK-LOOP-VERIFIED-SUPPORT-CORE-001` and `WERK-DEP-VERIFIED-SUPPORT-CORE-001` open until that independent receipt exists. Builder evidence alone must not promote the task to COUNTERCHECKED/VERIFIED or Finishline ACCEPTED.
3. Only after independent countercheck may the Owner Action Manager reassess readiness of the owner-gated identity/provider/legal/privacy decision. Countercheck does **not** activate an identity provider, public verified-support counting, WERK VOTE or Production.

## Boundaries
- Historical generic WellFit finishline/owner files do not steer WERK.
- Builder does not write Supervisor State, Evidence Freshness, Finishline State or the Navigator-owned `WERK_NEXT_BEST_ACTIONS.json` catalog.
- The provider-neutral core stores only receipt metadata/hashes and a scoped pseudonym path; no raw name, DOB, address, government identifier or provider token is persisted in the support ledger.
- `counting_state` remains `disabled_until_identity_activation`; support is not an official vote and the support pseudonym must not become a WERK VOTE ballot identity.
- No Production, paid provider, irreversible action or political decision is authorized by this staging result.