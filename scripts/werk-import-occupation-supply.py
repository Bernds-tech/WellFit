"""Aggregate pinned, unmodified August AMS CSV slices; compare all derived data in CI.

Only observed rows are grouped. Absent sides remain null, explicit zero stocks
remain zero. Monthly occupation wishes are not joint qualification or Q2 signals.
"""
import argparse
from collections import defaultdict
import csv
import gzip
import hashlib
import io
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'werk-data/labour-occupation-supply-2026-08.json'
REGIONS = dict(zip('123456789', ['Burgenland', 'Kärnten', 'Niederösterreich',
    'Oberösterreich', 'Salzburg', 'Steiermark', 'Tirol', 'Vorarlberg', 'Wien']))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def integer(value):
    require(isinstance(value, str) and re.fullmatch(r'\d+', value), 'Invalid occupation source count')
    return int(value)


def extract(data):
    require(data['reference_period'] == '2026-08' and data['source_date'] == '2026-08-31', 'Occupation supply period mismatch')
    require([s['id'] for s in data['sources']] == ['al', 'os'], 'Occupation supply sources mismatch')
    stocks, labels, rowcounts, rgs = {}, {}, {}, {}
    counts = {}
    for source in data['sources']:
        kind = source['id']
        compressed = (ROOT / source['snapshot_file']).read_bytes()
        require(hashlib.sha256(compressed).hexdigest() == source['snapshot_gzip_sha256'], 'Occupation snapshot gzip hash mismatch')
        raw = gzip.decompress(compressed)
        require(hashlib.sha256(raw).hexdigest() == source['snapshot_raw_sha256'], 'Occupation snapshot raw hash mismatch')
        require(source['encoding'] == 'cp1252' and source['delimiter'] == ';', 'Occupation CSV dialect mismatch')
        reader = csv.DictReader(io.StringIO(raw.decode('cp1252')), delimiter=';')
        expected = ['Datum', 'RGSCode', 'RGSName']
        if kind == 'al':
            expected += ['Geschlecht', 'Nationalitaet']
        expected += ['Berufs4Steller', 'Berufs4StellerBez']
        expected += ['BESTAND', 'ZUGANG', 'ABGANG', ''] if kind == 'al' else ['Bestand', '']
        require(reader.fieldnames == expected, 'Occupation CSV header mismatch')
        stocks[kind], labels[kind], rowcounts[kind], rgs[kind] = defaultdict(int), {}, defaultdict(int), {}
        seen, occupations = set(), set()
        count = 0
        for row in reader:
            count += 1
            require(row['Datum'] == data['source_date'], 'Mixed occupation source period')
            district = row['RGSCode']
            require(re.fullmatch(r'[1-9]\d{2}', district), 'Invalid AMS RGS code')
            require(district not in rgs[kind] or rgs[kind][district] == row['RGSName'], 'Conflicting AMS RGS label')
            rgs[kind][district] = row['RGSName']
            code = row['Berufs4Steller']
            require(re.fullmatch(r'\d{4}' if kind == 'al' else r'B\d{4}', code), 'Invalid occupation source code')
            code = code if kind == 'al' else code[1:]
            label = row['Berufs4StellerBez']
            if kind == 'os':
                require(label.startswith('B' + code + ' - '), 'OS occupation label prefix mismatch')
                label = label[8:]
            require(label and (code not in labels[kind] or labels[kind][code] == label), 'Conflicting occupation label')
            labels[kind][code] = label
            key = (district, code)
            if kind == 'al':
                require(row['Geschlecht'] in ['M', 'W'] and row['Nationalitaet'] in ['Inländer_innen', 'Ausländer_innen'], 'Unexpected supply group')
                key += (row['Geschlecht'], row['Nationalitaet'])
                integer(row['ZUGANG']); integer(row['ABGANG'])
            require(key not in seen, 'Duplicate occupation source row')
            seen.add(key)
            aggregate = (REGIONS[district[0]], code)
            stocks[kind][aggregate] += integer(row['BESTAND' if kind == 'al' else 'Bestand'])
            rowcounts[kind][aggregate] += 1
            occupations.add(code)
        acquisition = source['acquisition']
        require(count == acquisition['row_count'], 'Occupation source row count mismatch')
        require(acquisition['period'] == data['source_date'], 'Occupation acquisition period mismatch')
        require(acquisition['last_line'] - acquisition['first_line'] + 1 == count, 'Noncontiguous source slice locator')
        counts[kind] = {'source_rows': count, 'rgs_count': len(rgs[kind]), 'occupation_count': len(occupations), 'stock_total': sum(stocks[kind].values())}
    records = []
    for region, code in sorted(set(stocks['al']) | set(stocks['os'])):
        key = (region, code)
        observed = [kind for kind in ['al', 'os'] if key in stocks[kind]]
        u, v = stocks['al'].get(key), stocks['os'].get(key)
        records.append({'region': region, 'occupation_code': code,
            'supply_label': labels['al'].get(code) if 'al' in observed else None,
            'vacancy_label': labels['os'].get(code) if 'os' in observed else None,
            'registered_unemployed_occupation_wish': u, 'registered_immediate_vacancies': v,
            'observation_status': 'both_observed' if len(observed) == 2 else observed[0] + '_only',
            'source_rows': {k: rowcounts[k].get(key, 0) for k in ['al', 'os']}})
    totals = []
    baseline = json.loads((ROOT / 'werk-data/labour-matching-baseline-2025-2026.json').read_text())
    for region in REGIONS.values():
        rows = [r for r in records if r['region'] == region]
        u = sum(r['registered_unemployed_occupation_wish'] for r in rows if r['registered_unemployed_occupation_wish'] is not None)
        v = sum(r['registered_immediate_vacancies'] for r in rows if r['registered_immediate_vacancies'] is not None)
        base = next(r for r in baseline['regional_ams_snapshots_august_2026'] if r['region'] == region)
        require(base['reference_period'] == data['reference_period'], 'Regional/source period mismatch')
        require((u, v) == (base['registered_unemployed'], base['registered_vacancies']), f'Occupation/regional total mismatch {region}')
        totals.append({'region': region, 'registered_unemployed': u, 'registered_vacancies': v,
                       'observed_occupation_pairs': len(rows)})
    counts['occupation_region_pairs'] = len(records)
    counts['both_observed'] = sum(r['observation_status'] == 'both_observed' for r in records)
    counts['supply_only'] = sum(r['observation_status'] == 'al_only' for r in records)
    counts['vacancy_only'] = sum(r['observation_status'] == 'os_only' for r in records)
    return {'counts': counts, 'regional_totals': totals,
        'rgs_catalog': {k: [{'code': c, 'name': n, 'region': REGIONS[c[0]]} for c, n in sorted(v.items())] for k, v in rgs.items()},
        'records': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--write', action='store_true')
    args = parser.parse_args()
    data = json.loads(TARGET.read_text())
    result = extract(data)
    if args.write:
        data.update(result)
        TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    else:
        for key, value in result.items():
            if data.get(key) != value:
                raise SystemExit(f'Occupation supply extraction mismatch: {key}')
    print(f'Occupation supply reconciliation OK: {result["counts"]}')


if __name__ == '__main__':
    main()
