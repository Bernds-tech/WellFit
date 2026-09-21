# WERK Next Best Action

Updated: 2026-09-21 20:35 Europe/Vienna

## Current state
`WERK-IMPACT-FEEDBACK-001` remains the active locked task. Builder-side YELLOW `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001` has been corrected on exact functional head `7e4291717563e5fe51cb84c7d239d7920a7d937e` by migration 045, which applies current submission map/reform relevance before the bounded `LIMIT 12`. WERK Impact Feedback #3, WERK AI Synthesis #7 and IDEENWERK Backend #187 are green on the exact head; the live Staging >50-unrelated-review regression, stale fail-closed probe, ACL check and rollback cleanup are green. This is a Builder claim, not independent acceptance.

## Exact next action
1. **Independent countercheck of the corrected feedback selection** — Supervisor validates exact head `7e4291717563e5fe51cb84c7d239d7920a7d937e`, migration `20260921182939 ideenwerk_impact_feedback_selection_hardening`, Impact Feedback #3 / AI Synthesis #7 / Backend #187, the >50 relevance-before-limit regression, stale `revalidation_required`, service-role-only ACL and zero synthetic cleanup.
2. Do **not** release `LOCK-WERK-IMPACT-FEEDBACK-001`, close `WERK-LOOP-IMPACT-FEEDBACK-001`, satisfy `WERK-DEP-IMPACT-FEEDBACK-001` or promote any Finishline gate until that independent receipt exists.
3. The next blocking YELLOW is separately tracked as `WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001`: `werk_impact_measurement_snapshot()` must revalidate authoritative source binding or fail closed before current-state reliance. It requires a dedicated coordinated corrective lock; do not silently fold it into the feedback lock.
4. No new feature expansion, external AI provider, paid call, Production action, political ranking/automatic decision or change to WERK principles is justified while these countercheck/freshness gates remain open.

## Boundaries
- Existing VERIFIED/COUNTERCHECKED components remain consumed, not rebuilt.
- Historical generic WellFit finishline/owner files do not steer WERK.
- Mutable evidence is used only within the WERK TTL/freshness policy.
- Builder did not write Supervisor State, Evidence Freshness, Finishline State or the Navigator-owned WERK_NEXT_BEST_ACTIONS catalog.
