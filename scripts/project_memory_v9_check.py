#!/usr/bin/env python3
from pathlib import Path
import json, sys
ROOT=Path(__file__).resolve().parents[1]
PM=ROOT/'project-memory'
required=['WELLFIT_MASTER_STATE.json','PROJECT_COORDINATION.json','CROSS_REPO_DEPENDENCIES.json','CONTRACT_REGISTRY.json','INTEGRATION_GATES.json','CROSS_REPO_LOCKS.md','CONVERGENCE_LEDGER.json','WELLFIT_MASTER_NEXT_ACTION.md','REAL_WORK_BASELINE_2026-08-19.md','REAL_WORK_PROGRAM_BASELINE_2026-08-19.md','PROTOCOL.md']
errors=[]
for name in required:
    p=PM/name
    if not p.exists() or not p.read_text(encoding='utf-8').strip(): errors.append('missing-or-empty:'+name)
try:
    master=json.loads((PM/'WELLFIT_MASTER_STATE.json').read_text())
    if master.get('authority_repository')!='Bernds-tech/WellFit': errors.append('master-authority-invalid')
    repos=master.get('repositories',{})
    for repo in ['Bernds-tech/WellFit','Bernds-tech/WellFit-now','Bernds-tech/WellFit-Buddy']:
        if repo not in repos: errors.append('master-repo-missing:'+repo)
    if master.get('convergence',{}).get('target_repository') is not None: errors.append('convergence-target-must-remain-unset')
    if master.get('master_gates',{}).get('repo_memory_alignment',{}).get('state')=='IMPLEMENTED_NOT_VERIFIED': errors.append('master-real-state-not-populated')
except Exception as e: errors.append('master-json-invalid:'+str(e))
try:
    deps=json.loads((PM/'CROSS_REPO_DEPENDENCIES.json').read_text())
    contracts=json.loads((PM/'CONTRACT_REGISTRY.json').read_text())
    gates=json.loads((PM/'INTEGRATION_GATES.json').read_text())
    ledger=json.loads((PM/'CONVERGENCE_LEDGER.json').read_text())
    dep_ids=[x.get('id') for x in deps.get('dependencies',[])]
    con_ids=[x.get('id') for x in contracts.get('contracts',[])]
    gate_ids=[x.get('id') for x in gates.get('gates',[])]
    if len(dep_ids)!=len(set(dep_ids)) or not dep_ids: errors.append('dependency-ids-invalid')
    if len(con_ids)!=len(set(con_ids)) or not con_ids: errors.append('contract-ids-invalid')
    if len(gate_ids)!=len(set(gate_ids)) or not gate_ids: errors.append('integration-gate-ids-invalid')
    if any(x.get('state')=='NEEDS_BASELINE' for x in contracts.get('contracts',[])): errors.append('contract-baseline-still-empty')
    if ledger.get('status')!='PLANNED_NOT_SCHEDULED': errors.append('convergence-ledger-status-invalid')
except Exception as e: errors.append('v9-json-invalid:'+str(e))
protocol=(PM/'PROTOCOL.md').read_text(encoding='utf-8') if (PM/'PROTOCOL.md').exists() else ''
for token in ['Protocol v9','V9 — Multi-repository orchestration','WF-CONTRACT-*','WF-XDEP-*','XLOCK-*','WF-MIG-*']:
    if token not in protocol: errors.append('protocol-v9-token-missing:'+token)
if errors:
    print('PROJECT_MEMORY_V9_RESULT=failed')
    [print('PROJECT_MEMORY_V9_ERROR='+e) for e in errors]
    sys.exit(1)
print('PROJECT_MEMORY_V9_RESULT=passed')
