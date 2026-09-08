import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('dvsv_import', 'scripts/werk-import-contribution-distribution.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
for value in [None, '', '2444', True, float('nan'), float('inf'), -1]:
    try:
        module.number(value)
    except ValueError:
        pass
    else:
        raise AssertionError('Invalid number accepted')
data = json.loads(module.OUTPUT.read_text())
# Pinned independent transcription of national all-worker/employee quantiles.
row = next(x for x in data['rows'] if x['dimension'] == 'region' and x['employment_group'] == 'workers_and_employees' and x['label'] == 'all')
assert list(row['quantiles']['all'].values()) == [2444, 3501, 4845]
assert list(row['quantiles']['female'].values()) == [2040, 2897, 4099]
assert len({(r['dimension'], r['employment_group'], r['label']) for r in data['rows']}) == 129
with tempfile.TemporaryDirectory(prefix='werk-dvsv-distribution-') as tmp:
    for path in [Path('scripts/werk-import-contribution-distribution.py'), module.SOURCE, module.OUTPUT]:
        target = Path(tmp) / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
    def run():
        return subprocess.run([sys.executable, 'scripts/werk-import-contribution-distribution.py'], cwd=tmp, capture_output=True).returncode
    assert run() == 0
    for key, value in [('data_year', 2026), ('actual_monthly_payment_distribution', True), ('person_count', 1000), ('national_transition_cost_identified', True), ('verified_budget_credit_eur', 1)]:
        mutated = json.loads(module.OUTPUT.read_text())
        mutated[key] = value
        (Path(tmp) / module.OUTPUT).write_text(json.dumps(mutated, ensure_ascii=False, indent=2) + '\n')
        assert run() != 0
    shutil.copyfile(module.OUTPUT, Path(tmp) / module.OUTPUT)
    with (Path(tmp) / module.SOURCE).open('ab') as file:
        file.write(b'altered-source')
    assert run() != 0
print('DVSV distribution counterchecks OK: independent national transcription, unique row keys, 7 invalid numbers and 6 source/scope corruptions.')
