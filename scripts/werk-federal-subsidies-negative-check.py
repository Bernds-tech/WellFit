#!/usr/bin/env python3
import csv,gzip,importlib.util,io,json,subprocess,tempfile,shutil,sys
sys.dont_write_bytecode=True
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('subsidies',ROOT/'scripts/werk-import-federal-subsidies.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
r=json.loads((ROOT/'werk-data/subsidy-federal-account-results.json').read_text())
a={x['year']:x for x in r['annual_series']}
# Independent pinned source/report controls in cents, rather than reusing importer group functions.
assert a[2024]['funding_06_16_cents']==1258417694986
assert a[2025]['funding_06_16_cents']==1050902087452
assert a[2025]['administration_17_cents']==27421443825
assert a[2026]['funding_06_16_cents']==973019800000
assert a[2027]['funding_06_16_cents']==903458200000
assert a[2028]['funding_06_16_cents']==905479000000
assert r['account_bridge_2025_2028']['total_change_cents']==-145423087452
assert r['top20_budget_2028_cents']==462241800000
assert r['negative_row_count']==730
for y in [2014,2015,2016]:
 assert a[y]['external_16_cents'] is None and a[y]['administration_17_cents'] is None and a[y]['funding_06_16_cents'] is None
 assert a[y]['sum_reported_funding_classes_cents']>0
# Reverse mapping from normalized integer rows independently rebuilds both overlapping 2025 views.
n=json.loads((ROOT/'werk-data/subsidy-federal-account-normalized.json').read_text());clcol=n['dimension_columns'].index('Förderungen')
annual2025=0;monthly2025=0;source_ids=[]
for row in n['records']:
 source_ids.append(row[0]);cl=n['dimensions'][row[2]][clcol][:2]
 if row[3]==2025 and cl in ['06','16']:
  if row[4]=='Erfolg':annual2025+=row[6]
  if row[4]=='Monatserfolg':monthly2025+=row[6]
assert source_ids==list(range(2,15804))
assert annual2025==monthly2025==1050902087452
assert annual2025+monthly2025==2*a[2025]['funding_06_16_cents']
# Matched/unmatched accounts reconcile independently; null is not a claimed zero-program amount.
focus=r['accounts_2024_2028']
for y in range(2024,2029):
 for classes,field in [(['06','16'],'funding_06_16_cents'),(['17'],'administration_17_cents')]:
  assert sum(x['amount_cents_by_year'][str(y)] for x in focus if x['funding_class'] in classes and x['amount_cents_by_year'][str(y)] is not None)==a[y][field]
assert any(x['amount_cents_by_year']['2025'] is None and x['amount_cents_by_year']['2028'] is not None and x['delta_2028_bva_vs_2025_actual_cents'] is None for x in focus)
assert module.money('-0,00000001')==-1
badmoney=['',None,'NaN','1.23','1,000000001','1e3',' 2','1,2,3']
for value in badmoney:
 try:module.money(value)
 except ValueError:pass
 else:raise AssertionError('Invalid amount accepted')
raw=gzip.decompress((ROOT/'werk-data/sources/bmf-foerderungen-bund-2026-08.csv.gz').read_bytes())
rows=list(csv.reader(io.StringIO(raw.decode('utf-8-sig')),delimiter=';'))
def encoded(rows):
 s=io.StringIO();csv.writer(s,delimiter=';',lineterminator='\r\n').writerows(rows);return s.getvalue().encode('utf-8')
invalid=0
for col,value in [('HH','EH'),('AE','2'),('Kennzahl','Other'),('Monat','0'),('Betrag',''),('Förderungen','99 - other'),('UGNr','99')]:
 copy=[row[:] for row in rows[:2]];copy[1][copy[0].index(col)]=value
 try:module.parse(encoded(copy))
 except ValueError:invalid+=1
 else:raise AssertionError('Invalid CSV scope accepted')
try:module.parse(encoded(rows[:2]+[rows[1]]))
except ValueError:invalid+=1
else:raise AssertionError('Duplicate CSV accepted')
with tempfile.TemporaryDirectory(prefix='werk-subsidy-check-') as td:
 td=Path(td)
 files=['werk-data/subsidy-account-review-priorities.json','scripts/werk-import-federal-subsidies.py','werk-data/subsidy-federal-account-source.json','werk-data/subsidy-federal-account-normalized.json','werk-data/subsidy-federal-account-results.json','werk-data/subsidy-federal-ug-2024.json','werk-data/sources/bmf-foerderungen-bund-2026-08.csv.gz','WERK_FOERDERKONTEN_RECHNUNG.md']
 for f in files:(td/f).parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/f,td/f)
 def run():return subprocess.run(['python3','scripts/werk-import-federal-subsidies.py'],cwd=td,capture_output=True).returncode
 assert run()==0
 corruptions=[('werk-data/subsidy-account-review-priorities.json',lambda x:x.update(verified_annual_werk_savings_cents=1)),('werk-data/subsidy-account-review-priorities.json',lambda x:x['priorities'][0].update(decision='cut')),('werk-data/subsidy-federal-account-results.json',lambda x:x.update(verified_annual_werk_savings_cents=145423087452)),('werk-data/subsidy-federal-account-results.json',lambda x:x.update(program_mapping_complete=True)),('werk-data/subsidy-federal-account-results.json',lambda x:x['annual_series'][-4].update(funding_06_16_cents=2101804174904)),('werk-data/subsidy-federal-account-normalized.json',lambda x:x['records'][0].__setitem__(6,0)),('werk-data/subsidy-federal-account-results.json',lambda x:x['accounts_2024_2028'][0]['amount_cents_by_year'].update({'2028':0}))]
 for f,mutate in corruptions:
  original=(td/f).read_bytes();d=json.loads(original);mutate(d);(td/f).write_text(json.dumps(d));assert run()!=0;(td/f).write_bytes(original)
 p=td/'werk-data/sources/bmf-foerderungen-bund-2026-08.csv.gz';p.write_bytes(gzip.compress(raw+b'changed',mtime=0));assert run()!=0
print(f'SUB001 counterchecks: 8 numerical anchors, 15 account/year/class reconciliations, duplicate annual/monthly trap, {len(badmoney)+invalid} invalid inputs, 8 source/output corruptions passed')
