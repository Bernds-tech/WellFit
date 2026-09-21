# WERK Next Best Action

Updated: 2026-09-21 23:30 Europe/Vienna

## Current state
The highest-priority existing RED/YELLOW findings in `WERK-PARLIAMENTARY-RUNTIME-001` have now been corrected Builder-side on the existing locked scope. They are **not independently closed yet**. Do not start a new feature slice and do not move to the lower-priority identity YELLOW until the parliamentary correction has been independently counterchecked.

Functional correction head: `dfee17eb42f7bc90167f866307b09fdf907d13be`.

The correction adds migration 049 `parliamentary_trace_integrity_hardening`: service-role direct INSERT/UPDATE/DELETE on both parliamentary trace tables is revoked while SELECT remains available; all writes stay behind the bounded SECURITY DEFINER RPCs. A database UNIQUE index now enforces one `(source_decision_id, source_decision_version)` tuple, and `werk_create_parliamentary_trace` uses atomic `INSERT ... ON CONFLICT DO NOTHING` replay handling so concurrent creation cannot produce duplicate traces.

Exact-head CI is green: WERK Parliamentary Trace Runtime Check #6 and WERK Data Contract Registry Check #88 succeeded on `dfee17eb42f7bc90167f866307b09fdf907d13be`. WERK Österreich Staging has migration `20260921212809 parliamentary_trace_integrity_hardening`; post-migration ACL checks show service-role SELECT=true and direct INSERT/UPDATE/DELETE=false on both parliamentary tables, the unique index is present, sequential create/replay/conflict behavior is correct, and synthetic cleanup returned trace/event counts to zero. The exact-head runtime smoke also contains a two-client concurrent replay regression. Fresh Security Advisor evidence introduced no new WARN; the known `pg_net extension_in_public` WARN remains separate.

## Exact next action
1. **Independent Supervisor countercheck of the existing parliamentary scope** against `dfee17eb42f7bc90167f866307b09fdf907d13be`, migration 049, Runtime Check #6, Registry Check #88, direct-DML denial, concurrent replay regression, Staging ACL/runtime evidence and zero cleanup.
2. Supervisor decides whether `CTR-WERK-PARLIAMENTARY-APPEND-ONLY-001` and `CTR-WERK-PARLIAMENTARY-REPLAY-RACE-001` are resolved/superseded for bounded Staging scope. Builder must not self-close them.
3. Only after that countercheck may the parliamentary lock/loop/dependency close and the next lower-priority existing finding (`CTR-WERK-ID-CORE-FUTURE-VERIFIED-AT-001`) be reconciled in its existing lock.

## Boundaries
- Historical generic WellFit finishline/owner files do not steer WERK.
- No parallel parliamentary trace, identity ledger or task system.
- No live parliamentary connector, public publication, legal-effect claim, political scoring/ranking, WERK VOTE, paid/irreversible action or Production action.
- System graph is unchanged because no component or edge was added; the existing parliamentary runtime was hardened in place.
- The known `pg_net extension_in_public` WARN remains a separate Production-hardening loop.
- Builder does not modify Supervisor State, Evidence Freshness, Finishline State or WERK_NEXT_BEST_ACTIONS.
