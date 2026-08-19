#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
PM=ROOT/'project-memory'
required=['FINISHLINE_STATE.json','MEMORY_V8_CONTROLS.json','OWNER_ACTION_INBOX.md','NEXT_BEST_ACTION.md','AUTO_HANDOFF.md','CURRENT_STATE.md','PROTOCOL.md']
errors=[]
for name in required:
    p=PM/name
    if not p.exists() or not p.read_text(encoding='utf-8').strip(): errors.append(f'missing-or-empty:{name}')
try:
    state=json.loads((PM/'FINISHLINE_STATE.json').read_text())
    if state.get('repository')!='Bernds-tech/WellFit' or state.get('project_role')!='visual_landing_ui': errors.append('finishline-identity-invalid')
except Exception as e: errors.append(f'finishline-invalid:{e}')
try:
    controls=json.loads((PM/'MEMORY_V8_CONTROLS.json').read_text())
    if controls.get('automatic_downgrade_target')!='NEEDS_REVALIDATION': errors.append('stale-success-contract-invalid')
    if not controls.get('cross_chat',{}).get('require_github_memory_reconciliation'): errors.append('cross-chat-contract-invalid')
    if not controls.get('milestones',{}).get('append_only'): errors.append('milestone-contract-invalid')
except Exception as e: errors.append(f'controls-invalid:{e}')
if 'DEFERRED_BY_OWNER' not in (PM/'OWNER_ACTION_INBOX.md').read_text(encoding='utf-8'): errors.append('owner-inbox-invalid')
if 'WF-VISUAL-RECONCILE' not in (PM/'NEXT_BEST_ACTION.md').read_text(encoding='utf-8'): errors.append('next-best-action-invalid')
if errors:
    print('PROJECT_MEMORY_V8_RESULT=failed')
    [print('PROJECT_MEMORY_V8_ERROR='+e) for e in errors]
    sys.exit(1)
print('PROJECT_MEMORY_V8_RESULT=passed')
