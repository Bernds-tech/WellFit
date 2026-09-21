from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
FUNCTIONAL_HEAD = "3f1f5ee9b7325f958b33bfb05a2a7414ce2ec14f"
STAGING_MIGRATION = "20260921192342 werk_impact_snapshot_freshness"
CLAIM_PATH = ROOT / "project-memory/werk-builder-claims/WERK_IMPACT_SNAPSHOT_FRESHNESS_2026-09-21T1924Z.json"


def read(rel):
    return (ROOT / rel).read_text()


def write(rel, text):
    (ROOT / rel).write_text(text)


def replace_section(text, heading, replacement):
    start = text.find(heading)
    if start < 0:
        raise RuntimeError(f"missing section: {heading}")
    next_heading = text.find("\n## ", start + len(heading))
    if next_heading < 0:
        return text[:start].rstrip() + "\n\n" + replacement.rstrip() + "\n"
    return text[:start] + replacement.rstrip() + "\n" + text[next_heading:]


def append_once(text, marker, block):
    if marker in text:
        return text
    return text.rstrip() + "\n\n" + block.strip() + "\n"


# TASK_LEDGER: append-only builder claim state; never self-promote to counterchecked.
ledger = read("project-memory/TASK_LEDGER.md")
ledger_block = f"""
## WERK-IMPACT-SNAPSHOT-FRESHNESS-001
- Date: 2026-09-21
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Goal: close Supervisor YELLOW `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` by making the existing impact measurement snapshot revalidate its persisted map/reform/artifact/source-version tuple before any current-state reliance.
- Builder correction: migration 046 `werk_impact_snapshot_freshness` replaces only the existing read RPC. Current authoritative tuples continue to return the prior measurement state plus `current_reliance=true`; stale/unknown authoritative source tuples return `state=revalidation_required`, `current_reliance=false`, preserve the stored append-only evidence as historical, and withhold current observation/review projection.
- Exact functional head: `{FUNCTIONAL_HEAD}`.
- CI: WERK Impact Measurement Check #8 SUCCESS on exact functional head; WERK Data Contract Registry Check #66 SUCCESS on the same head. Contract guard, migration idempotency, existing measurement smoke and dedicated current/stale snapshot-freshness smoke all passed.
- Staging: migration `{STAGING_MIGRATION}` is live on WERK Österreich Staging. Rollback-only runtime probe proved a current source tuple remains readable and an intentionally stale persisted tuple fails closed to `revalidation_required`. Post-probe counts: plans=0, implementation events=0, observations=0, reviews=0.
- ACL/security: snapshot EXECUTE remains anon=false, authenticated=false, service_role=true. Fresh Security Advisor introduced no new WARN; only the pre-existing `pg_net extension_in_public` production-hardening WARN remains.
- Calculation-integrity boundary: no baseline, target, KPI, deviation, fiscal, reform, debt, attribution or causal formula changed. No historical row is rewritten/deleted. No political ranking, automatic decision, provider activation, paid call or Production action.
- Loop/lock/dependency: `WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001`, `LOCK-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` and `WERK-DEP-IMPACT-SNAPSHOT-FRESHNESS-001` remain open pending independent Supervisor countercheck.
- Exact next step: Supervisor independently validates `{FUNCTIONAL_HEAD}`, migration 046, Impact Measurement #8 / Data Contract Registry #66, current/stale fail-closed semantics, ACL and zero cleanup; only then may the finding/loop/lock/dependency close.
- Do not repeat: do not rebuild impact measurement, create a parallel source registry, rewrite historical measurement evidence, infer causality, or treat Builder evidence as independent acceptance.
"""
ledger = append_once(ledger, "## WERK-IMPACT-SNAPSHOT-FRESHNESS-001", ledger_block)
write("project-memory/TASK_LEDGER.md", ledger)

# STARTED_WORK: keep task active until independent countercheck.
started = read("project-memory/STARTED_WORK.md")
started_block = f"""
## WERK-IMPACT-SNAPSHOT-FRESHNESS-001
- Started: 2026-09-21 21:15 Europe/Vienna
- Updated: 2026-09-21 21:24 Europe/Vienna
- Status: IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK
- Risk: R3
- Branch: `werk-v49-preview-host`
- Trigger: Supervisor YELLOW `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`.
- Scope: read-side freshness hardening only for the existing `public.werk_impact_measurement_snapshot(text)` path; reuse the authoritative validator from migration 043 and preserve historical append-only evidence.
- Builder result: migration 046 revalidates the persisted source tuple before any current-state projection. Current tuples remain readable; stale/unknown tuples return `revalidation_required`, `current_reliance=false` and no current observation/review projection.
- Exact evidence: functional head `{FUNCTIONAL_HEAD}`; WERK Impact Measurement Check #8 SUCCESS; WERK Data Contract Registry Check #66 SUCCESS; live Staging migration `{STAGING_MIGRATION}`; rollback-only current/stale probe passed; ACL anon/authenticated=false and service_role=true; zero impact rows after rollback; no new Security Advisor WARN.
- Work lock: `LOCK-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` remains ACTIVE awaiting independent countercheck.
- Boundary: counterchecked measurement formulas and causal/political semantics are unchanged; no provider, Production or irreversible action.
- Exact next step: independent Supervisor countercheck. Builder must not self-close the finding or promote Finishline/Evidence states.
"""
if "## WERK-IMPACT-SNAPSHOT-FRESHNESS-001" not in started:
    marker = "\n## Closed / superseded work"
    pos = started.find(marker)
    if pos < 0:
        raise RuntimeError("STARTED_WORK closed marker missing")
    started = started[:pos].rstrip() + "\n\n" + started_block.strip() + "\n" + started[pos:]
write("project-memory/STARTED_WORK.md", started)

# WORK_LOCKS: update only the dedicated corrective lock; restore two accidental no-op wording drifts from lock acquisition.
locks = read("project-memory/WORK_LOCKS.md")
lock_block = f"""## LOCK-WERK-IMPACT-SNAPSHOT-FRESHNESS-001
- Task: WERK-IMPACT-SNAPSHOT-FRESHNESS-001
- Status: ACTIVE
- Phase: IMPLEMENTED_STAGING_AWAITING_INDEPENDENT_COUNTERCHECK
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-21 21:15 Europe/Vienna
- Trigger: Supervisor YELLOW `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` / `WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001`.
- Scope: bounded read-side hardening of the existing `public.werk_impact_measurement_snapshot(text)` path; no parallel measurement system or source registry.
- Builder evidence: exact functional head `{FUNCTIONAL_HEAD}`; WERK Impact Measurement #8 and Data Contract Registry #66 green; Staging migration `{STAGING_MIGRATION}` live; current tuple readable, stale tuple fails closed to `revalidation_required`; ACL service-role-only; zero synthetic rows after rollback; no new advisor WARN.
- Boundary: no measurement/KPI/fiscal/causal formula change, no historical evidence rewrite, provider activation, Production, political ranking/decision or WERK-principle change. Separate feedback lock remains untouched.
- Release condition: independent Supervisor confirms the corrected exact head/runtime evidence and closes or supersedes `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`. Builder evidence alone does not release this lock.
"""
locks = replace_section(locks, "## LOCK-WERK-IMPACT-SNAPSHOT-FRESHNESS-001", lock_block)
locks = locks.replace("- Result: specification and coordination records created; runtime repositories remain unchanged.\n- Recovery: revert PR #22; existing runtime repositories remain unchanged.", "- Result: specification and coordination records created; runtime gates remain open.\n- Recovery: revert PR #22; runtime repositories remain unchanged.")
write("project-memory/WORK_LOCKS.md", locks)

# DEPENDENCIES: record read-side source-freshness dependency without changing the counterchecked measurement task itself.
deps = read("project-memory/DEPENDENCIES.md")
dep_block = f"""
## WERK-DEP-IMPACT-SNAPSHOT-FRESHNESS-001
- From: current-state reads of `public.werk_impact_measurement_snapshot(text)` / KPI measurement projection.
- Requires: existing authoritative Impact Bridge validator from migration 043, persisted map/reform/artifact/source-version tuple, fail-closed read-side revalidation and preserved historical evidence.
- Type: source-freshness/current-reliance correctness.
- Status: IMPLEMENTED_AWAITING_COUNTERCHECK
- Updated: 2026-09-21 21:24 Europe/Vienna.
- Builder evidence: exact functional head `{FUNCTIONAL_HEAD}`; migration 046 active on Staging; Impact Measurement #8 and Data Contract Registry #66 green; current tuple returns current authoritative binding, stale persisted tuple returns `revalidation_required`; ACL unchanged; zero impact rows after rollback.
- Independent gate: only Supervisor may satisfy this dependency and close/supersede `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` after independent countercheck.
- Boundary: does not alter measurement formulas, write-side source binding, historical evidence, causal attribution, feedback selection, AI provider or Production.
- Unblocks: safe reliance on measurement snapshots as current input only after independent countercheck.
"""
deps = append_once(deps, "## WERK-DEP-IMPACT-SNAPSHOT-FRESHNESS-001", dep_block)
write("project-memory/DEPENDENCIES.md", deps)

# OPEN_LOOPS: keep loop open; Builder does not countercheck itself.
loops = read("project-memory/OPEN_LOOPS.md")
loop_block = f"""## WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001
- Related finding: `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` from `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T181600Z.json`.
- Related task/dependency: `WERK-IMPACT-SNAPSHOT-FRESHNESS-001`, `WERK-DEP-IMPACT-SNAPSHOT-FRESHNESS-001`.
- Status: OPEN_AWAITING_INDEPENDENT_COUNTERCHECK
- Updated: 2026-09-21 21:24 Europe/Vienna
- Risk: R3
- Builder correction: migration 046 reuses `public.werk_impact_validate_source_binding(...)` on every existing measurement snapshot before current-state reliance. Current tuples retain the normal state plus `current_reliance=true`; stale/unknown persisted tuples return `revalidation_required`, `current_reliance=false`, preserve historical evidence and withhold current observation/review projection.
- Exact evidence: functional head `{FUNCTIONAL_HEAD}`; WERK Impact Measurement Check #8 SUCCESS; WERK Data Contract Registry Check #66 SUCCESS; live Staging migration `{STAGING_MIGRATION}`; rollback-only current/stale probe passed; ACL anon/authenticated denied and service_role allowed; impact tables restored to zero; no new Security Advisor WARN.
- Boundary: no counterchecked measurement formula, KPI arithmetic, source registry, fiscal/reform calculation, causal attribution rule, feedback selection or political/provider behavior changed. Historical append-only rows are not mutated.
- Close condition: independent Supervisor validates the exact head/CI/Staging current+stale semantics and closes or supersedes `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`. Builder evidence alone does not close this loop.
"""
loops = replace_section(loops, "## WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001", loop_block)
write("project-memory/OPEN_LOOPS.md", loops)

# NEXT_BEST_ACTION: Builder-owned selector consumes the still-open independent gates; no new feature expansion.
next_action = f"""# WERK Next Best Action

Updated: 2026-09-21 21:24 Europe/Vienna

## Current state
Two bounded Builder corrections are implemented on WERK Staging but remain independently unaccepted. `WERK-IMPACT-FEEDBACK-001` still awaits Supervisor countercheck of corrected relevance-before-limit head `7e4291717563e5fe51cb84c7d239d7920a7d937e`. Separately, `WERK-IMPACT-SNAPSHOT-FRESHNESS-001` now addresses blocking YELLOW `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` on exact functional head `{FUNCTIONAL_HEAD}` with migration 046, exact-head Impact Measurement #8 / Data Contract Registry #66, a rollback-only current/stale runtime probe, service-role-only ACL and zero synthetic rows. Both are Builder claims, not independent acceptance.

## Exact next action
1. **Independent countercheck of snapshot freshness** — Supervisor validates `{FUNCTIONAL_HEAD}`, migration `{STAGING_MIGRATION}`, Impact Measurement #8 / Data Contract Registry #66, current tuple `current_reliance=true`, stale tuple `revalidation_required` + `current_reliance=false`, historical evidence preservation, service-role-only ACL and zero cleanup. Only Supervisor may close/supersede `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`.
2. **Independent countercheck of impact-feedback selection** remains open in parallel for head `7e4291717563e5fe51cb84c7d239d7920a7d937e`; do not release its lock or satisfy its dependency without a receipt.
3. Do **not** start provider activation, Production, political ranking/automatic decision or a new feature slice while these independent gates remain open. Existing VERIFIED/COUNTERCHECKED work stays consumed and is not rebuilt.

## Boundaries
- Historical generic WellFit finishline/owner files do not steer WERK.
- Builder did not write Supervisor State, Evidence Freshness, Finishline State or the Navigator-owned `WERK_NEXT_BEST_ACTIONS.json` catalog.
- Systemgraph topology was not changed because no new component or edge was created; the correction hardens the already-existing KPI measurement read path.
- Mutable Staging/advisor evidence above was freshly collected after migration 046 and remains subject to WERK TTL policy.
"""
write("project-memory/NEXT_BEST_ACTION.md", next_action)

claim_source_head = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
claim = {
    "claim_type": "WERK_BUILDER_CLAIM",
    "task_id": "WERK-IMPACT-SNAPSHOT-FRESHNESS-001",
    "finding": "CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001",
    "created_at": "2026-09-21T19:24:30Z",
    "branch": "werk-v49-preview-host",
    "functional_head": FUNCTIONAL_HEAD,
    "claim_source_head": claim_source_head,
    "implementation": {
        "migration_file": "ideenwerk-backend/sql/046_werk_impact_snapshot_freshness.sql",
        "staging_migration": STAGING_MIGRATION,
        "runtime_function": "public.werk_impact_measurement_snapshot(text)",
        "reuses_validator": "public.werk_impact_validate_source_binding(text,text,text,text)",
        "new_component_or_systemgraph_edge": False
    },
    "tests": [
        {"name": "WERK Impact Measurement Check", "run_number": 8, "head": FUNCTIONAL_HEAD, "result": "success"},
        {"name": "WERK Data Contract Registry Check", "run_number": 66, "head": FUNCTIONAL_HEAD, "result": "success"},
        {"name": "snapshot freshness current tuple", "result": "planned_no_implementation_evidence + current_reliance=true + current_authoritative_registry_tuple"},
        {"name": "snapshot freshness stale tuple", "result": "revalidation_required + current_reliance=false + historical_evidence_preserved=true"},
        {"name": "ACL", "result": "anon=false; authenticated=false; service_role=true"},
        {"name": "rollback cleanup", "result": "plans=0; implementations=0; observations=0; reviews=0"}
    ],
    "runtime": {
        "project": "WERK Österreich Staging",
        "project_status": "ACTIVE_HEALTHY",
        "runtime_contract": "046_werk_impact_snapshot_freshness",
        "security_advisor_observed_at": "2026-09-21T19:24:27.190Z",
        "security_new_warns": 0,
        "remaining_known_warn": "pg_net extension_in_public (pre-existing production-hardening loop)"
    },
    "boundaries": [
        "Builder claim only; independent Supervisor countercheck required.",
        "No WERK_SUPERVISOR_STATE, WERK_EVIDENCE_FRESHNESS, WERK_FINISHLINE_STATE or WERK_NEXT_BEST_ACTIONS write.",
        "No measurement/KPI/fiscal/reform/causal formula changed.",
        "No historical evidence rewritten or deleted.",
        "No AI provider, paid call, Production, political ranking/decision or WERK principle change.",
        "No systemgraph topology change because no new component/edge was created."
    ],
    "open_limits": [
        "Independent Supervisor must validate and close/supersede CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001.",
        "WERK-IMPACT-FEEDBACK-001 remains separately awaiting independent countercheck.",
        "pg_net extension_in_public remains separate production hardening."
    ]
}
CLAIM_PATH.write_text(json.dumps(claim, ensure_ascii=False, indent=2) + "\n")
