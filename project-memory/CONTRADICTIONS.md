# Contradiction / Reconciliation Register

Any conflict between project memory and actual Git/PR/CI/preview/runtime evidence is recorded here and forces `RECONCILIATION_REQUIRED` until resolved.

Statuses: `OPEN`, `RECONCILIATION_REQUIRED`, `RESOLVED`, `SUPERSEDED`.

Template:
```text
## CTR-YYYY-NNN
- Date:
- Updated:
- Related task/change:
- Risk: R1|R2|R3|R4
- Source A:
- Claim A:
- Source B:
- Claim B:
- Stronger/current evidence:
- Status: RECONCILIATION_REQUIRED
- Resolution/action:
- Evidence:
```

Triggers include completed task with open/red PR/checks, merged PR with stale active work, missing lock/receipt, resolved dependency still marked blocked, stale evidence, or memory contradicted by current code/preview/runtime evidence. Preserve the old record and document why it was stale or wrong.
