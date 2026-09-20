from pathlib import Path
import json,re

p=Path('werk-data/ideenwerk-api-contract.json')
d=json.loads(p.read_text())
d['version']='2026-09-21-v17'
if 'Impact-Bridge' not in d.get('status',''):
    d['status']=d.get('status','').replace('; Produktivfreigabe offen','') + '; versiongebundener IDEENWERK-Impact-Bridge zu bestehenden WERK-Reform-/Rechenartefakten staging-live; Produktivfreigabe offen'
principle='der Impact-Bridge verknüpft nur hochspezifische Problemsignale mit bereits existierenden WERK-Reform- und Daten-/Rechenvertrags-IDs; er erzeugt keine neue Wirkungszahl, keinen politischen Score und keine Annahme/Ablehnung; bei Versionsdrift wird die alte Zuordnung fail-closed nur als revalidation_required ausgegeben und no_known_mapping ist kein Vollständigkeitsnachweis'
if principle not in d['principles']: d['principles'].append(principle)
for ep in d['endpoints']:
    if ep['method']=='GET' and ep['path']=='/status/{public_id}':
        if 'impact_bridge_check?' not in ep['response']: ep['response'].append('impact_bridge_check?')
        if 'impact_bridge_check enthält' not in ep['notes']:
            ep['notes'] += '; impact_bridge_check enthält candidate_mapping mit bestehenden reform_ids/data_contract_ids/gate_refs und Registry-/Source-Versionen, no_known_mapping ohne Vollständigkeitsbehauptung oder bei Versionsdrift revalidation_required ohne alte Mappings; keine neue Wirkungszahl oder politische Entscheidung'
    if ep['method']=='GET' and ep['path']=='/privacy/export/{public_id}':
        if 'impact_bridge_check' not in ep['response']: ep['response'].append('impact_bridge_check')
        if 'Impact-Bridge' not in ep['notes']:
            ep['notes'] += '; der aktuelle stale-safe Impact-Bridge-Bezug wird als Provenienzinformation exportiert, ohne neue Wirkungszahl oder politische Bewertung'
if not any(j.get('name')=='impact_bridge_check' for j in d.get('internal_jobs',[])):
    d.setdefault('internal_jobs',[]).append({'name':'impact_bridge_check','implementation':'staging-live','input':'structured_proposal + immutable submission context + canonical WERK reform/data-contract registries','output':'version-bound candidate reform/data-contract/gate references only, or no_known_mapping','failure':'registry/source version drift returns revalidation_required with no stale mappings; no match never claims completeness; no new fiscal effect or political decision'})
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')

p=Path('werk-data/werk-system-graph.json')
g=json.loads(p.read_text()); g['updated']='2026-09-21'
for n in g['nodes']:
    if n.get('id')=='IDEENWERK-IMPACT':
        n.update({'state':'IN_PROGRESS','builder_state':'IMPLEMENTED_STAGING_AWAITING_COUNTERCHECK','implementation':'ideenwerk-backend/sql/037_ideenwerk_impact_bridge.sql','registry':'werk-data/ideenwerk-impact-bridge.json','staging_migration':'20260920223436 ideenwerk_impact_bridge'})
for e in g['edges']:
    if e.get('to')=='IDEENWERK-IMPACT' and e.get('from') in ('REFORM-REGISTER','CALC-WERK','IDEENWERK-INTAKE'):
        e['state']='IN_PROGRESS'; e['builder_state']='STAGING_LINK_IMPLEMENTED_AWAITING_COUNTERCHECK'
p.write_text(json.dumps(g,ensure_ascii=False,indent=2)+'\n')

def replace(path,heading,body):
    p=Path(path); t=p.read_text(); pat=rf'(?ms)^## {re.escape(heading)}\n.*?(?=^## |\Z)'
    t,n=re.subn(pat,body.rstrip()+'\n\n',t,count=1)
    if n!=1: raise SystemExit(f'{path}: {heading} section count={n}')
    p.write_text(t)

replace('project-memory/STARTED_WORK.md','WERK-IDEENWERK-IMPACT-BRIDGE-001','''## WERK-IDEENWERK-IMPACT-BRIDGE-001
- Started: 2026-09-20 22:31 UTC
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Branch: `werk-v49-preview-host`
- Lock: `LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001`
- Scope: version-bound citizen/precheck → existing WERK reform/calculation reference bridge; no new fiscal calculation or political recommendation.
- Implemented: canonical registry; migration 037; protected status/privacy export; stale/no-match negative path; existing V71 status rendering; dedicated CI.
- Staging: `20260920223436 ideenwerk_impact_bridge` active. Synthetic SV case mapped only to `SV-01` / `FISCAL-DATA` / `WERK-SV-010|011`; protected status matched; forced stale version returned `revalidation_required` with empty mappings; zero baseline restored.
- CI: WERK Impact Bridge Check #2 and WERK Frontend Check #176 succeeded on functional head `f5a38a74caf4daf896124b2f606942d1653e2316`.
- Next: independent WERK Supervisor countercheck. Do not rebuild or advance the finishline gate.''')

replace('project-memory/WORK_LOCKS.md','LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001','''## LOCK-WERK-IDEENWERK-IMPACT-BRIDGE-001
- Task: WERK-IDEENWERK-IMPACT-BRIDGE-001
- Status: ACTIVE
- Phase: BUILDER_CLAIM_READY_AWAITING_SUPERVISOR
- Risk: R3
- Holder: WERK autonomous builder / no second implementation worker
- Branch: `werk-v49-preview-host`
- Acquired: 2026-09-20 22:31 UTC
- Builder implementation complete: functional head `f5a38a74caf4daf896124b2f606942d1653e2316`; Staging migration `20260920223436 ideenwerk_impact_bridge`; zero baseline restored.
- Release: only after independent Supervisor countercheck or a concrete contradiction.''')

replace('project-memory/TASK_LEDGER.md','WERK-IDEENWERK-IMPACT-BRIDGE-001','''## WERK-IDEENWERK-IMPACT-BRIDGE-001
- Date: 2026-09-20
- Status: IMPLEMENTED_NOT_VERIFIED
- Risk: R3
- Goal: connect IDEENWERK citizen problems to existing WERK reform/calculation artifacts through a deterministic version-bound reference bridge without duplicating calculations.
- Result: five canonical mapping families reference only existing reform/data-contract/gate IDs; migration 037 runs at precheck, protected status/export expose current provenance, stale versions fail closed, no-match is non-complete, and V71 reuses the existing status surface.
- CI: WERK Impact Bridge Check #2 + WERK Frontend Check #176 green on `f5a38a74caf4daf896124b2f606942d1653e2316`.
- Staging: `20260920223436 ideenwerk_impact_bridge` active; candidate/status/stale checks passed; synthetic rows returned to zero baseline.
- Boundary: no new effect, saving, cost, forecast, political score or automatic acceptance/rejection.
- Dependency: `WERK-DEP-IDEENWERK-IMPACT-001`; loop remains open pending countercheck.
- Next: Supervisor countercheck; Builder must not self-verify.''')

replace('project-memory/OPEN_LOOPS.md','WERK-LOOP-IMPACT-BRIDGE-001','''## WERK-LOOP-IMPACT-BRIDGE-001
- Status: IMPLEMENTED_AWAITING_COUNTERCHECK
- Updated: 2026-09-20 22:36 UTC
- Builder result: registry + migration 037 map high-specificity citizen signals only to existing reform/data-contract/gate IDs; protected status/export and V71 expose current provenance; stale versions fail closed; no-match is non-complete.
- Evidence claim: head `f5a38a74caf4daf896124b2f606942d1653e2316`; Impact Bridge Check #2 and Frontend #176 green; Staging migration `20260920223436 ideenwerk_impact_bridge`; reversible candidate/status/stale verification and zero baseline.
- Boundary: no parallel calculator, new fiscal effect or political recommendation/decision.
- Next: independent Supervisor countercheck; close only after independent acceptance.''')

replace('project-memory/DEPENDENCIES.md','WERK-DEP-IDEENWERK-IMPACT-001','''## WERK-DEP-IDEENWERK-IMPACT-001
- From: IDEENWERK citizen precheck / problem cluster.
- Requires: verified competence/legal path, existing-measure path, reform identifiers and existing WERK calculation/data artifacts.
- Type: cross-component integration.
- Status: IMPLEMENTED_AWAITING_COUNTERCHECK
- Updated: 2026-09-20 22:36 UTC.
- Rule: reuse existing WERK calculation/reform artifacts; expose model/reform IDs, provenance and open gates without converting conditional calculations into verified effects.
- Builder evidence: registry, migration 037, head `f5a38a74caf4daf896124b2f606942d1653e2316`, Impact Bridge Check #2, Frontend #176, Staging migration `20260920223436 ideenwerk_impact_bridge`, reversible verification and zero baseline.
- Close when: independent Supervisor accepts end-to-end bridge and stale/negative safeguards.''')

Path('project-memory/NEXT_BEST_ACTION.md').write_text('''# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-IDEENWERK-IMPACT-BRIDGE-001`
- Catalog entry: `NBA-WERK-IMPACT-BRIDGE`
- Status: `AWAITING_INDEPENDENT_COUNTERCHECK`
- Risk: `R3`
- Gate: `impact_bridge`

## Current state
Builder implementation complete on functional head `f5a38a74caf4daf896124b2f606942d1653e2316`; Impact Bridge Check #2 and Frontend #176 are green; Staging migration `20260920223436 ideenwerk_impact_bridge` is active; protected status and stale-version behavior passed reversible verification; zero baseline restored.

## Exact next step
Independent Supervisor countercheck. Do not rebuild this scope, self-verify it, release the finishline gate or advance to downstream expert/AI work until the Supervisor records COUNTERCHECKED evidence or a concrete contradiction.

## Boundary
No duplicated calculator, unsupported numeric effect, political score/recommendation, automatic acceptance/rejection, completeness claim from `no_known_mapping`, or production release.
''')
