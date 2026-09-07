"""Independent arithmetic and fail-closed source/output counterchecks."""
import copy
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

root = Path.cwd()
sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('essoss', root/'scripts/werk-import-essoss-contributions.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
d = module.build()
assert [s['history'][-1]['employee_contributions_mio_eur'] for s in d['systems']] == [18049,1941,126,6865,234,4686,36]
assert d['bridge']['core_statistical_employee_pv_kv_alv_mio_eur'] == 29600
assert d['overview']['component_total_mio_eur'] == 31937
assert d['overview']['published_minus_components_mio_eur'] == 1
for capture, expected_cost, expected_gap in [(0,14.8,1.67),(.3,10.36,0)]:
    row = next(r for r in d['static_reference_cases'] if r['debt_anchor_bn']==525.2 and r['assumed_avoided_rate_pct']==2.5 and r['assumed_tax_recapture_share']==capture)
    assert row['net_reference_cost_bn']==expected_cost and row['funding_gap_bn']==expected_gap
assert any(r['employee_contributions_mio_eur'] is None for s in d['systems'] for r in s['history'])
for value in ['', '-', '.', 'NaN', '1,2', '-100']:
    try:
        module.number(value)
    except ValueError:
        pass
    else:
        raise AssertionError(f'Invalid number accepted: {value}')

mutations = [
    lambda x: x['bridge'].update(exact_policy_eligible_cash_contribution_total_eur=29600000000),
    lambda x: x['bridge'].update(current_budget_credit_eur=14800000000),
    lambda x: x['systems'][5].update(quality='actual_employee_receipts'),
    lambda x: x['overview'].update(displayed_year='2024'),
    lambda x: x['overview'].update(published_minus_components_mio_eur=0),
    lambda x: x['static_reference_cases'][0].update(funding_gap_bn=None),
]
with tempfile.TemporaryDirectory(prefix='werk-essoss-check-') as tmp:
    target = Path(tmp)
    paths = [s['source']['local_file'] for s in d['systems']] + [d['overview']['local_file'], 'werk-data/employee-payroll-withholding-2024.json', str(module.REPORT)]
    for path in paths:
        dest = target/path
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root/path, dest)
    def run():
        return subprocess.run([sys.executable, str(root/'scripts/werk-import-essoss-contributions.py')], cwd=target, capture_output=True)
    out = target/module.OUT
    for mutate in mutations:
        changed = copy.deepcopy(d)
        mutate(changed)
        out.write_text(json.dumps(changed, ensure_ascii=False, indent=2)+'\n')
        assert run().returncode != 0, 'Corrupted evidence passed'
    out.write_text(json.dumps(d, ensure_ascii=False, indent=2)+'\n')
    assert run().returncode == 0, 'Unchanged fixture failed'
    source = target/d['systems'][0]['source']['local_file']
    source.write_bytes(source.read_bytes()+b'changed')
    assert run().returncode != 0, 'Source drift passed'
print('ESSOSS countercheck OK: independent component/financing arithmetic, missing markers, 6 invalid numbers and 7 source/output corruption cases.')
