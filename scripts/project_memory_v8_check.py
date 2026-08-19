#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
PM=ROOT/'project-memory'
required=[
 'STARTED_WORK.md','WORK_LOCKS.md','EXECUTION_RECEIPTS.md','RECONCILIATION.md',
 'QUALITY_CONTROL.md','ASSUMPTIONS.md','CONTRADICTIONS.md','COUNTERCHECK_POLICY.md',
 'PROJECT_FINISHLINE.md','FINISHLINE_STATE.json','EXTERNAL_ACCEPTANCE.md','NEXT_BEST_ACTION.md',
 'EVIDENCE_TTL.json','DRIFT_BASELINE.json','BRANCH_PROTECTION_CONTRACT.json','milestones/README.md',
 'MEMORY_V8_CONTROLS.json','OWNER_ACTION_INBOX.md','AUTO_HANDOFF.md','CONVERGENCE_PLAN.json',
 'MEMORY_VERSION_HISTORY.md','CURRENT_STATE.md','PROTOCOL.md'
]
errors=[]
for name in required:
    p=PM/name
    if not p.exists() or not p.read_text(encoding='utf-8').strip(): errors.append(f'missing-or-empty:{name}')
try:
    state=json.loads((PM/'FINISHLINE_STATE.json').read_text())
    if state.get('repository')!='Bernds-tech/WellFit' or state.get('project_role')!='visual_landing_ui': errors.append('finishline-identity-invalid')
except Exception as e: errors.append(f'finishline-invalid:{e}')
try:
    ttl=json.loads((PM/'EVIDENCE_TTL.json').read_text())
    if ttl.get('stale_state')!='NEEDS_REVALIDATION': errors.append('v7-evidence-ttl-invalid')
    drift=json.loads((PM/'DRIFT_BASELINE.json').read_text())
    if drift.get('on_change')!='DRIFT_REVIEW_REQUIRED': errors.append('v7-drift-contract-invalid')
    protection=json.loads((PM/'BRANCH_PROTECTION_CONTRACT.json').read_text())
    if protection.get('routine_direct_push_allowed') is not False: errors.append('v7-branch-protection-contract-invalid')
except Exception as e: errors.append(f'v7-json-invalid:{e}')
try:
    controls=json.loads((PM/'MEMORY_V8_CONTROLS.json').read_text())
    if controls.get('automatic_downgrade_target')!='NEEDS_REVALIDATION': errors.append('v8-stale-success-contract-invalid')
    if not controls.get('cross_chat',{}).get('require_github_memory_reconciliation'): errors.append('v8-cross-chat-contract-invalid')
except Exception as e: errors.append(f'v8-controls-invalid:{e}')
try:
    convergence=json.loads((PM/'CONVERGENCE_PLAN.json').read_text())
    if convergence.get('status')!='PLANNED_NOT_SCHEDULED' or convergence.get('target_repository') is not None: errors.append('convergence-contract-invalid')
except Exception as e: errors.append(f'convergence-invalid:{e}')
quality=(PM/'QUALITY_CONTROL.md').read_text(encoding='utf-8') if (PM/'QUALITY_CONTROL.md').exists() else ''
for token in ['R1','R2','R3','R4','COUNTERCHECKED','What observation would prove our conclusion wrong?']:
    if token not in quality: errors.append(f'v5-quality-token-missing:{token}')
protocol=(PM/'PROTOCOL.md').read_text(encoding='utf-8') if (PM/'PROTOCOL.md').exists() else ''
if 'Protocol v8' not in protocol: errors.append('protocol-version-not-v8')
if 'DEFERRED_BY_OWNER' not in (PM/'OWNER_ACTION_INBOX.md').read_text(encoding='utf-8'): errors.append('owner-inbox-invalid')
if 'WF-VISUAL-RECONCILE' not in (PM/'NEXT_BEST_ACTION.md').read_text(encoding='utf-8'): errors.append('next-best-action-invalid')
if errors:
    print('PROJECT_MEMORY_V8_RESULT=failed')
    [print('PROJECT_MEMORY_V8_ERROR='+e) for e in errors]
    sys.exit(1)
print('PROJECT_MEMORY_V8_RESULT=passed')
