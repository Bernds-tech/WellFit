from pathlib import Path
import json
import re

FUNCTIONAL_HEAD = "7e4291717563e5fe51cb84c7d239d7920a7d937e"
PARENT_PRODUCT_HEAD = "95e4e921d45149045ddd825e89f7e8da8e5b41f3"
SUPERVISOR_RECEIPT = "project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T181600Z.json"


def replace_section(path: str, header: str, body: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    pattern = re.compile(rf"(?ms)^## {re.escape(header)}\n.*?(?=^## |\Z)")
    replacement = f"## {header}\n{body.strip()}\n\n"
    new_text, count = pattern.subn(replacement, text, count=1)
    if count != 1:
        raise SystemExit(f"expected exactly one section {header!r} in {path}, got {count}")
    p.write_text(new_text.rstrip() + "\n", encoding="utf-8")


def ensure_section(path: str, header: str, body: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    if re.search(rf"(?m)^## {re.escape(header)}$", text):
        replace_section(path, header, body)
        return
    p.write_text(text.rstrip() + f"\n\n## {header}\n{body.strip()}\n", encoding="utf-8")


replace_section(
    "project-memory/TASK_LEDGER.md",
    "WERK-IMPACT-FEEDBACK-001",
    f"""
- Date: 2026-09-21
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Goal: connect counterchecked impact-review/improvement hypotheses back into the existing AI synthesis context while retaining current source binding, provenance, uncertainty and non-causal/non-political semantics.
- Prior implementation: migration 044 and functional head `6d95b394d0869fb91562f6a84a13502469ef7869` established the bounded feedback edge, but independent Supervisor receipt `{SUPERVISOR_RECEIPT}` found `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001`: the old read path globally limited candidates before submission map/reform relevance, so >50 newer unrelated reviews could hide an older relevant review.
- Builder correction: migration 045 `ideenwerk_impact_feedback_selection_hardening` moves current submission map/reform relevance into the SQL candidate query before the bounded `LIMIT 12`. It preserves authoritative source-binding revalidation, provenance/uncertainty gates, service-role-only execution and hypothesis-only semantics. No parallel feedback store/calculator was created.
- Exact functional head: `{FUNCTIONAL_HEAD}`. The product/migration delta first landed at `{PARENT_PRODUCT_HEAD}`; the only subsequent change to reach the exact functional head was stabilization of the >50-review regression harness.
- CI: WERK Impact Feedback Check #3 SUCCESS, WERK AI Synthesis Check #7 SUCCESS and IDEENWERK Backend Check #187 SUCCESS on exact head `{FUNCTIONAL_HEAD}`. WERK Data Contract Registry Check #65 succeeded on `{PARENT_PRODUCT_HEAD}`, which contains the identical migration/product delta. The first newly added Impact Feedback run #2 failed only in the initial regression harness after migrations/current-stale checks had passed; the harness was corrected without changing product logic and #3 is green.
- Staging: migration `20260921182939 ideenwerk_impact_feedback_selection_hardening` is active on WERK Österreich Staging. A rollback-only live regression with one relevant review plus 51 newer unrelated reviews proved that the relevant review remains selected, unrelated reviews do not leak, the output remains bounded to 12, and stale Impact Bridge registry state returns `revalidation_required` with zero review refs. Rollback cleanup restored the synthetic submission/review counts to zero.
- ACL/security: `anon` EXECUTE=false, `authenticated` EXECUTE=false, `service_role` EXECUTE=true for `ideenwerk_ai_feedback_context(uuid)`; the deployed function contains no old `LIMIT 50`, retains `LIMIT 12`, and contains current map/reform relevance binding. Fresh Security Advisor evidence introduced no new WARN; the pre-existing `pg_net extension_in_public` WARN remains separate production hardening, and service-role-only RLS INFO findings remain unchanged.
- Provider boundary: external provider remains disabled; no live model call, secret, paid action, Production action, political ranking, automatic policy change or causal promotion was introduced.
- Dependency/loop/lock: `WERK-DEP-IMPACT-FEEDBACK-001` remains `IMPLEMENTED_AWAITING_COUNTERCHECK`; `WERK-LOOP-IMPACT-FEEDBACK-001` remains `OPEN_AWAITING_INDEPENDENT_COUNTERCHECK`; `LOCK-WERK-IMPACT-FEEDBACK-001` remains ACTIVE until independent confirmation of the corrected head/evidence.
- Separate open finding: `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` remains YELLOW and out of scope for this selection correction. It is tracked as its own open loop and must be resolved before any reliance on stale measurement snapshots as current.
- Exact next step: independent Supervisor counterchecks `{FUNCTIONAL_HEAD}`, Impact Feedback #3 / AI Synthesis #7 / Backend #187, migration 045, >50 relevance-before-limit regression, ACL, stale fail-closed behavior and zero cleanup. Only then may this task/loop/lock/dependency close. No new feature slice should bypass the separate snapshot-freshness YELLOW.
- Do not repeat: do not restore a global pre-relevance candidate limit, rebuild the feedback edge, create a parallel store/calculator, promote review hypotheses to facts/causal effects, rank political variants, auto-change policy, or activate the provider.
""",
)

replace_section(
    "project-memory/STARTED_WORK.md",
    "WERK-IMPACT-FEEDBACK-001",
    f"""
- Started: 2026-09-21 10:18 Europe/Vienna
- Updated: 2026-09-21 20:35 Europe/Vienna
- Status: IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK
- Risk: R3
- Branch: `werk-v49-preview-host`
- Scope: bounded current-source impact-review feedback into the existing AI synthesis source snapshot/provider context; retain provenance, uncertainties and epistemic labels while preventing causal/political promotion.
- Upstream consumed: `WERK-IMPACT-001` remains independently `COUNTERCHECKED_STAGING`; receipt `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T072152Z.json`.
- Reconciliation trigger: independent Supervisor receipt `{SUPERVISOR_RECEIPT}` found YELLOW `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001` because the prior 044 read path globally limited qualifying reviews before current submission map/reform relevance.
- Builder result: migration 045 now filters current submission map/reform relevance before `LIMIT 12`; exact functional head `{FUNCTIONAL_HEAD}`. A dedicated >50-newer-unrelated regression is part of WERK Impact Feedback Check #3.
- CI: Impact Feedback #3, AI Synthesis #7 and IDEENWERK Backend #187 are green on exact head `{FUNCTIONAL_HEAD}`; Data Contract Registry #65 is green on parent product head `{PARENT_PRODUCT_HEAD}` with identical product/migration code.
- Staging evidence: migration `20260921182939 ideenwerk_impact_feedback_selection_hardening` is live; one relevant review remained visible despite 51 newer unrelated reviews; unrelated reviews did not leak; max 12 remained enforced; stale Impact Bridge failed closed to `revalidation_required`; test data rolled back to zero. ACL remains anon/authenticated denied and service_role allowed.
- Security boundary: fresh advisor evidence shows no new WARN from this correction; existing `pg_net extension_in_public` remains separate production hardening.
- Provider boundary: external provider remains disabled; no secrets, paid calls, live political generation, production action, causal promotion, ranking or automatic decision.
- Work lock: `LOCK-WERK-IMPACT-FEEDBACK-001` remains ACTIVE in corrected-staging / awaiting-independent-countercheck phase.
- Open loop/dependency: `WERK-LOOP-IMPACT-FEEDBACK-001` and `WERK-DEP-IMPACT-FEEDBACK-001` remain open pending independent confirmation. `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` is separately tracked and not claimed fixed by this work.
- Exact next step: independent Supervisor counterchecks the corrected exact head and staging evidence. Do not release this lock or start a feature expansion from this edge before the countercheck.
""",
)

replace_section(
    "project-memory/WORK_LOCKS.md",
    "LOCK-WERK-IMPACT-FEEDBACK-001",
    f"""
- Task: WERK-IMPACT-FEEDBACK-001
- Status: ACTIVE
- Phase: CORRECTED_STAGING_AWAITING_INDEPENDENT_COUNTERCHECK
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Scope: existing `IMPROVEMENT-LOOP` → `AI-SYNTHESIS` feedback edge, including the bounded relevance-before-limit correction required by `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001`.
- Corrected evidence: exact functional head `{FUNCTIONAL_HEAD}`; migration `20260921182939 ideenwerk_impact_feedback_selection_hardening`; Impact Feedback #3, AI Synthesis #7 and Backend #187 green; >50 unrelated-review rollback regression and stale fail-closed probe green on Staging; zero synthetic cleanup; service-role-only ACL preserved.
- Release condition: independent Supervisor confirms the corrected exact head/evidence and closes or explicitly supersedes `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001` for the bounded Staging scope.
- Boundary: this lock does not cover `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`; that separate YELLOW requires its own coordinated corrective scope before implementation.
- Forbidden while active: parallel feedback implementation, provider activation, production action, political ranking/automatic decision, or treating Builder evidence as independent acceptance.
""",
)

replace_section(
    "project-memory/DEPENDENCIES.md",
    "WERK-DEP-IMPACT-FEEDBACK-001",
    f"""
- From: `IMPROVEMENT-LOOP` → `AI-SYNTHESIS` feedback edge.
- Requires: independently counterchecked `WERK-IMPACT-001`; current submission map/reform relevance applied before the bounded feedback selection window; authoritative source-binding revalidation; uncertainty/provenance; and—only for real model regeneration—an approved active AI provider boundary.
- Type: cross-component feedback integration.
- Status: IMPLEMENTED_AWAITING_COUNTERCHECK
- Updated: 2026-09-21 20:35 Europe/Vienna.
- Builder evidence: exact functional head `{FUNCTIONAL_HEAD}`; migration 045 active on Staging; >50 newer unrelated-review regression proves the relevant review is not displaced; stale source state fails closed; exact-head Impact Feedback #3 / AI Synthesis #7 / Backend #187 are green.
- Independent gate: `{SUPERVISOR_RECEIPT}` raised the selection YELLOW on the prior implementation; only a new independent countercheck may satisfy this dependency after the correction.
- Provider boundary: external provider remains disabled and is not required to verify the contract-only feedback edge.
- Does not satisfy: separate `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001`; current-state measurement snapshot freshness remains an independent YELLOW.
- Unblocks: closeout of the bounded feedback edge only after independent countercheck; no Production or live political-generation claim.
""",
)

replace_section(
    "project-memory/OPEN_LOOPS.md",
    "WERK-LOOP-IMPACT-FEEDBACK-001",
    f"""
- Related: `WERK-IMPACT-FEEDBACK-001`, `WERK-DEP-IMPACT-FEEDBACK-001`, `WERK-AI-SYNTH-001`.
- Status: OPEN_AWAITING_INDEPENDENT_COUNTERCHECK
- Updated: 2026-09-21 20:35 Europe/Vienna
- Risk: R3
- Supervisor trigger: `{SUPERVISOR_RECEIPT}` raised YELLOW `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001` because the old 044 function globally bounded candidates before current submission map/reform relevance.
- Builder correction: migration 045 moves relevance into the SQL candidate query before `LIMIT 12`; exact functional head `{FUNCTIONAL_HEAD}`. A dedicated regression inserts one relevant review plus 51 newer unrelated reviews and proves the relevant review remains selected while unrelated reviews cannot leak.
- CI/Staging: Impact Feedback #3, AI Synthesis #7 and Backend #187 are green on the exact head; Data Contract Registry #65 is green on the identical product parent; Staging migration `20260921182939 ideenwerk_impact_feedback_selection_hardening` is live; stale bridge state fails closed; rollback cleanup leaves zero synthetic rows; ACL remains service-role only.
- Boundary: review material stays hypothesis-only, non-causal and non-political; no provider, paid call, production action, ranking or automatic policy change.
- Close condition: independent Supervisor validates the corrected head and closes/supersedes the selection finding. Builder evidence alone does not close this loop.
""",
)

ensure_section(
    "project-memory/OPEN_LOOPS.md",
    "WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001",
    f"""
- Related finding: `CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001` from `{SUPERVISOR_RECEIPT}`.
- Status: OPEN_RECONCILIATION_REQUIRED
- Updated: 2026-09-21 20:35 Europe/Vienna
- Risk: R3
- Evidence gap: `public.werk_impact_measurement_snapshot(text)` returns a persisted plan's `source_version` without re-invoking `public.werk_impact_validate_source_binding(...)`; a later canonical source-registry/version change can therefore leave a read snapshot looking current until separately revalidated.
- Current runtime effect: no stale persisted plan is known; impact measurement tables were zero-row at the independent audit. This is a freshness correctness gap, not evidence of a false live result.
- Required resolution: under a dedicated corrective lock, make the read/snapshot path revalidate the map/reform/artifact/source-version tuple or return `revalidation_required` before any current-state reliance; add current/stale negative tests and independent countercheck.
- Coordination boundary: this is not covered by `LOCK-WERK-IMPACT-FEEDBACK-001` and is not claimed fixed by migration 045. Do not modify the already counterchecked measurement formulas or infer causal effect while closing this read-side freshness gap.
""",
)

Path("project-memory/NEXT_BEST_ACTION.md").write_text(
    f"""# WERK Next Best Action

Updated: 2026-09-21 20:35 Europe/Vienna

## Current state
`WERK-IMPACT-FEEDBACK-001` remains the active locked task. Builder-side YELLOW `CTR-WERK-IMPACT-FEEDBACK-SELECTION-001` has been corrected on exact functional head `{FUNCTIONAL_HEAD}` by migration 045, which applies current submission map/reform relevance before the bounded `LIMIT 12`. WERK Impact Feedback #3, WERK AI Synthesis #7 and IDEENWERK Backend #187 are green on the exact head; the live Staging >50-unrelated-review regression, stale fail-closed probe, ACL check and rollback cleanup are green. This is a Builder claim, not independent acceptance.

## Exact next action
1. **Independent countercheck of the corrected feedback selection** — Supervisor validates exact head `{FUNCTIONAL_HEAD}`, migration `20260921182939 ideenwerk_impact_feedback_selection_hardening`, Impact Feedback #3 / AI Synthesis #7 / Backend #187, the >50 relevance-before-limit regression, stale `revalidation_required`, service-role-only ACL and zero synthetic cleanup.
2. Do **not** release `LOCK-WERK-IMPACT-FEEDBACK-001`, close `WERK-LOOP-IMPACT-FEEDBACK-001`, satisfy `WERK-DEP-IMPACT-FEEDBACK-001` or promote any Finishline gate until that independent receipt exists.
3. The next blocking YELLOW is separately tracked as `WERK-LOOP-IMPACT-SNAPSHOT-FRESHNESS-001`: `werk_impact_measurement_snapshot()` must revalidate authoritative source binding or fail closed before current-state reliance. It requires a dedicated coordinated corrective lock; do not silently fold it into the feedback lock.
4. No new feature expansion, external AI provider, paid call, Production action, political ranking/automatic decision or change to WERK principles is justified while these countercheck/freshness gates remain open.

## Boundaries
- Existing VERIFIED/COUNTERCHECKED components remain consumed, not rebuilt.
- Historical generic WellFit finishline/owner files do not steer WERK.
- Mutable evidence is used only within the WERK TTL/freshness policy.
- Builder did not write Supervisor State, Evidence Freshness, Finishline State or the Navigator-owned WERK_NEXT_BEST_ACTIONS catalog.
""",
    encoding="utf-8",
)

# Update only evidence/implementation metadata on the actually existing feedback component/edge.
graph_path = Path("werk-data/werk-system-graph.json")
graph = json.loads(graph_path.read_text(encoding="utf-8"))
node_updated = False
edge_updated = False


def walk(value):
    global node_updated, edge_updated
    if isinstance(value, dict):
        if value.get("id") == "IMPROVEMENT-LOOP":
            value["state"] = "IN_PROGRESS"
            value["builder_state"] = "IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK"
            value["boundary"] = "At most 12 current source-bound reviews with improvement hypothesis, uncertainty and provenance are selected only after current submission map/reform relevance is applied; review hypotheses remain non-causal and non-political; provider disabled; independent Supervisor countercheck pending."
            value["feedback_integration"] = "ideenwerk-backend/sql/044_ideenwerk_impact_feedback.sql"
            value["selection_hardening"] = "ideenwerk-backend/sql/045_ideenwerk_impact_feedback_selection_hardening.sql"
            value["staging_feedback_migration"] = "20260921084055 ideenwerk_impact_feedback"
            value["staging_feedback_selection_migration"] = "20260921182939 ideenwerk_impact_feedback_selection_hardening"
            value["functional_head"] = FUNCTIONAL_HEAD
            value["ci"] = "WERK Impact Feedback #3, WERK AI Synthesis #7 and IDEENWERK Backend #187 success on exact functional head; Data Contract Registry #65 success on identical product parent 95e4e921d45149045ddd825e89f7e8da8e5b41f3."
            value["countercheck"] = "AWAITING_INDEPENDENT_COUNTERCHECK_AFTER_SELECTION_FIX"
            node_updated = True
        if value.get("from") == "IMPROVEMENT-LOOP" and value.get("to") == "AI-SYNTHESIS" and value.get("relation") == "feedback":
            value["state"] = "IN_PROGRESS"
            value["evidence"] = f"Builder exact functional head {FUNCTIONAL_HEAD}; migration 045 moves current submission map/reform relevance before LIMIT 12; Impact Feedback #3, AI Synthesis #7 and Backend #187 green; live Staging >50-unrelated review regression, stale fail-closed ACL and zero cleanup green. Independent Supervisor countercheck pending; provider remains disabled."
            edge_updated = True
        for child in value.values():
            walk(child)
    elif isinstance(value, list):
        for child in value:
            walk(child)


walk(graph)
if not node_updated or not edge_updated:
    raise SystemExit(f"system graph target missing: node={node_updated} edge={edge_updated}")
graph_path.write_text(json.dumps(graph, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

claim = {
    "claim_id": "WERK-IMPACT-FEEDBACK-SELECTION-2026-09-21T183500Z",
    "task_id": "WERK-IMPACT-FEEDBACK-001",
    "finding_addressed_builder_side": "CTR-WERK-IMPACT-FEEDBACK-SELECTION-001",
    "status": "IMPLEMENTED_STAGING_AWAITING_INDEPENDENT_COUNTERCHECK",
    "supervisor_source_receipt": SUPERVISOR_RECEIPT,
    "exact_functional_head": FUNCTIONAL_HEAD,
    "product_delta_parent_head": PARENT_PRODUCT_HEAD,
    "implementation": {
        "migration": "ideenwerk-backend/sql/045_ideenwerk_impact_feedback_selection_hardening.sql",
        "selection_rule": "current submission map/reform relevance is applied before the bounded LIMIT 12",
        "regression": "ideenwerk-backend/scripts/impact-feedback-selection-regression.mjs",
        "no_parallel_store_or_calculator": True,
    },
    "ci": [
        {"workflow": "WERK Impact Feedback Check", "run_number": 3, "run_id": 35638526274, "head": FUNCTIONAL_HEAD, "conclusion": "success"},
        {"workflow": "WERK AI Synthesis Check", "run_number": 7, "run_id": 35638526570, "head": FUNCTIONAL_HEAD, "conclusion": "success"},
        {"workflow": "IDEENWERK Backend Check", "run_number": 187, "run_id": 35638526340, "head": FUNCTIONAL_HEAD, "conclusion": "success"},
        {"workflow": "WERK Data Contract Registry Check", "run_number": 65, "head": PARENT_PRODUCT_HEAD, "conclusion": "success", "note": "identical product/migration delta; the next commit changed only the regression harness"},
    ],
    "ci_correction_history": "Initial Impact Feedback #2 failed only in the newly added regression harness after migration/current-stale checks passed. The harness was stabilized without product logic change; exact-head Impact Feedback #3 succeeded.",
    "staging": {
        "project": "WERK Österreich Staging",
        "project_id": "jwomaoxefgnhsgiebaqy",
        "migration": "20260921182939 ideenwerk_impact_feedback_selection_hardening",
        "rollback_probe": {
            "relevant_reviews": 1,
            "newer_unrelated_reviews": 51,
            "relevant_review_survived": True,
            "unrelated_reviews_leaked": False,
            "max_review_refs": 12,
            "stale_bridge_returns": "revalidation_required",
            "synthetic_submission_rows_after_rollback": 0,
            "synthetic_unrelated_review_rows_after_rollback": 0,
        },
        "acl": {"anon_execute": False, "authenticated_execute": False, "service_role_execute": True},
        "deployed_function": {"old_limit_50_present": False, "limit_12_present": True, "map_reform_relevance_binding_present": True},
    },
    "security": {
        "new_warn_from_change": False,
        "remaining_warn": "pg_net extension_in_public (pre-existing, separate Production hardening)",
        "info_boundary": "service-role-only RLS tables continue to report RLS enabled/no policy INFO; unchanged by this correction",
    },
    "open_limits": [
        "Independent Supervisor countercheck is still required before task/loop/lock/dependency closeout.",
        "CTR-WERK-IMPACT-SNAPSHOT-FRESHNESS-001 remains separately open; this claim does not fix or close it.",
        "External AI provider remains disabled; no secrets, paid calls or live political model generation are enabled.",
        "No Production, ACCEPTED, causal effect, political ranking, automatic decision or WERK-principle change is claimed.",
    ],
    "builder_authority_observed": {
        "did_not_write": ["WERK_SUPERVISOR_STATE", "WERK_EVIDENCE_FRESHNESS", "WERK_FINISHLINE_STATE", "WERK_NEXT_BEST_ACTIONS"],
        "updated_builder_owned": ["TASK_LEDGER", "STARTED_WORK", "WORK_LOCKS", "DEPENDENCIES", "OPEN_LOOPS", "NEXT_BEST_ACTION", "WERK_SYSTEM_GRAPH"],
    },
}
claim_path = Path("project-memory/werk-builder-claims/WERK_IMPACT_FEEDBACK_SELECTION_2026-09-21T183500Z.json")
claim_path.parent.mkdir(parents=True, exist_ok=True)
claim_path.write_text(json.dumps(claim, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print("WERK builder postflight reconciliation prepared")
