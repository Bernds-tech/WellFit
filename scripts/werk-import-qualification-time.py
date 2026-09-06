"""Re-extract education and vacancy-time marginals, preserving observed scope.

The July AL slice independently explains the existing 869-person residual;
it does not allocate unclear education to known qualifications.
"""
import argparse
from collections import Counter, defaultdict
import csv
import gzip
import hashlib
import io
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'werk-data/labour-qualification-working-time-2026-08.json'
REGIONS = dict(zip('123456789', ['Burgenland', 'Kärnten', 'Niederösterreich',
    'Oberösterreich', 'Salzburg', 'Steiermark', 'Tirol', 'Vorarlberg', 'Wien']))
IMMEDIATE = 'Bestand_sofort_verfuegbar'
AVAILABILITY = [IMMEDIATE, 'Bestand_nicht_sofort_verfuegbar', 'nicht_relevant']


def require(condition, message):
    if not condition:
        raise ValueError(message)


def integer(value):
    require(isinstance(value, str) and re.fullmatch(r'\d+', value), 'Invalid qualification/time source count')
    return int(value)


def read_source(source):
    compressed = (ROOT / source['snapshot_file']).read_bytes()
    require(hashlib.sha256(compressed).hexdigest() == source['snapshot_gzip_sha256'], 'Qualification/time gzip hash mismatch')
    raw = gzip.decompress(compressed)
    require(hashlib.sha256(raw).hexdigest() == source['snapshot_raw_sha256'], 'Qualification/time raw hash mismatch')
    require(source['encoding'] == 'cp1252' and source['delimiter'] == ';', 'Qualification/time CSV dialect mismatch')
    reader = csv.DictReader(io.StringIO(raw.decode('cp1252')), delimiter=';')
    kind = source['id']
    dims = ['Geschlecht', 'AusbCode', 'HoeAbgAusbildung'] if kind.startswith('al_') else (
        ['Bestand_Verfuegbarkeit', 'Beschaeftigungsart', 'Arbeitszeit'] if kind == 'os_time' else
        ['Bestand_Verfuegbarkeit', 'AusbCode', 'HoeAbgAusbildung'])
    require(reader.fieldnames == ['Datum', 'RGSCode', 'RGSName', *dims, 'BESTAND', 'ZUGANG', 'ABGANG', ''], 'Qualification/time CSV header mismatch')
    rows, seen = [], set()
    for row in reader:
        require(row['Datum'] == source['reference_date'], 'Mixed qualification/time source period')
        require(re.fullmatch(r'[1-9]\d{2}', row['RGSCode']), 'Invalid qualification/time RGS code')
        key = (row['RGSCode'], *(row[d] for d in dims if d != 'HoeAbgAusbildung'))
        require(key not in seen, 'Duplicate qualification/time source row')
        seen.add(key)
        for f in ['BESTAND', 'ZUGANG', 'ABGANG']:
            row[f] = integer(row[f])
        if kind.startswith('al_'):
            require(row['Geschlecht'] in ['M', 'W'], 'Unknown education gender category')
        else:
            require(row['Bestand_Verfuegbarkeit'] in AVAILABILITY, 'Unknown vacancy availability')
            require(row['Bestand_Verfuegbarkeit'] != 'nicht_relevant' or row['BESTAND'] == 0, 'Flow-only row has positive stock')
        rows.append(row)
    a = source['acquisition']
    require(len(rows) == a['row_count'] and a['last_line'] - a['first_line'] + 1 == len(rows), 'Qualification/time slice row count mismatch')
    require(a['period'] == source['reference_date'], 'Qualification/time acquisition period mismatch')
    return rows


def extract(data):
    require(data['reference_period'] == '2026-08', 'Qualification/time reference period mismatch')
    require([s['id'] for s in data['sources']] == ['al_education', 'os_education', 'os_time', 'al_education_july'], 'Qualification/time source set mismatch')
    stocks, labels, rowcounts, controls = {}, {}, {}, {}
    for source in data['sources']:
        kind = source['id']
        require(source['reference_date'] == ('2026-07-31' if kind.endswith('july') else '2026-08-31'), 'Qualification/time source date mismatch')
        rows = read_source(source)
        stocks[kind], labels[kind], rowcounts[kind] = defaultdict(int), {}, Counter()
        availability_rows, availability_stocks = Counter(), Counter()
        for row in rows:
            region = REGIONS[row['RGSCode'][0]]
            avail = row.get('Bestand_Verfuegbarkeit', 'all_registered_unemployed')
            availability_rows[avail] += 1
            availability_stocks[avail] += row['BESTAND']
            if kind == 'os_time':
                employment, time = row['Beschaeftigungsart'], row['Arbeitszeit']
                require(employment in ['ARN - Arbeiter_in/Angestellte_r', 'SON - sonstige Dienstverhältnisse',
                    'GER - geringfügige Beschäftigung', 'FDV - freie Dienstnehmer'], 'Unknown employment-type label')
                require(time in ['V - Vollzeit', 'T - Teilzeit', 'B - Beides (Vollzeit oder Teilzeit)', ''], 'Unknown working-time label')
                require(time != '' or avail == 'nicht_relevant', 'Stock row lacks working-time category')
                key = (region, employment, time)
            else:
                code, label = row['AusbCode'], row['HoeAbgAusbildung']
                require(re.fullmatch(r'[A-Z][A-Z*]', code) and label, 'Invalid education code/label')
                require(code not in labels[kind] or labels[kind][code] == label, 'Conflicting education label')
                labels[kind][code] = label
                key = (region, code)
            if kind.startswith('os_') and avail != IMMEDIATE:
                continue
            stocks[kind][key] += row['BESTAND']
            rowcounts[kind][key] += 1
        controls[kind] = {'source_rows': len(rows), 'rows_by_availability': dict(availability_rows),
            'stocks_by_availability': dict(availability_stocks), 'included_rows': sum(rowcounts[kind].values()),
            'included_stock': sum(stocks[kind].values()), 'rgs_count': len({r['RGSCode'] for r in rows})}

    def education_records(al, os, al_rows, os_rows):
        result = []
        for region, code in sorted(set(al) | set(os)):
            key = (region, code)
            result.append({'region': region, 'education_code': code,
                'supply_label': labels['al_education'].get(code) if key in al else None,
                'vacancy_label': labels['os_education'].get(code) if key in os else None,
                'registered_unemployed': al.get(key), 'registered_immediate_vacancies': os.get(key),
                'source_rows': {'al': al_rows.get(key, 0), 'os': os_rows.get(key, 0)}})
        return result

    records = education_records(stocks['al_education'], stocks['os_education'], rowcounts['al_education'], rowcounts['os_education'])
    national, national_rows = {}, {}
    for kind in ['al_education', 'os_education']:
        national[kind], national_rows[kind] = defaultdict(int), Counter()
        for (region, code), n in stocks[kind].items():
            national[kind][('Österreich', code)] += n
            national_rows[kind][('Österreich', code)] += rowcounts[kind][(region, code)]
    national_education = education_records(national['al_education'], national['os_education'], national_rows['al_education'], national_rows['os_education'])
    time_records = [{'region': r, 'employment_type': e, 'working_time': t,
        'registered_immediate_vacancies': n, 'source_rows': rowcounts['os_time'][(r, e, t)]}
        for (r, e, t), n in sorted(stocks['os_time'].items())]
    time_totals = Counter()
    for row in time_records:
        time_totals[row['working_time']] += row['registered_immediate_vacancies']
    baseline = json.loads((ROOT / 'werk-data/labour-matching-baseline-2025-2026.json').read_text())
    regional = []
    for base in baseline['regional_ams_snapshots_august_2026']:
        r = base['region']
        counts = {k: sum(n for key, n in stocks[k].items() if key[0] == r) for k in ['al_education', 'os_education', 'os_time']}
        require(counts['al_education'] == base['registered_unemployed'], 'Education/regional unemployment mismatch')
        require(counts['os_education'] == counts['os_time'] == base['registered_vacancies'], 'Education/time/regional vacancy mismatch')
        regional.append({'region': r, 'registered_unemployed': counts['al_education'],
            'vacancies_education_total': counts['os_education'], 'vacancies_time_total': counts['os_time']})

    july = Counter()
    for (region, code), n in stocks['al_education_july'].items():
        july[code] += n
    old = json.loads((ROOT / 'werk-data/labour-matching-matrix-priority-groups.json').read_text())
    require(old['reference_period'] == '2026-07', 'Existing education period changed')
    mapping = data['july_supply_crosswalk']
    require(set(mapping) == {r['id'] for r in old['detailed_rows']}, 'July education crosswalk row coverage')
    used = [c for codes in mapping.values() for c in codes]
    require(len(set(used)) == len(used) and set(used) == set(july) - {'XX'}, 'July education crosswalk must exclude unclear category and partition known codes')
    for row in old['detailed_rows']:
        require(sum(july[c] for c in mapping[row['id']]) == row['registered_unemployed'], 'July education source/detail mismatch')
    require(july['XX'] == old['reconciliation']['unallocated_difference'], 'July unclear residual mismatch')
    require(sum(july.values()) == old['published_totals']['registered_unemployed'], 'July source national total mismatch')
    july_audit = {'reference_period': '2026-07', 'source_id': 'al_education_july', 'national_unemployed': sum(july.values()),
        'national_education_codes': [{'code': c, 'label': labels['al_education_july'][c], 'registered_unemployed': n} for c, n in sorted(july.items())],
        'residual_code': 'XX', 'residual_label': labels['al_education_july']['XX'], 'residual_count': july['XX'],
        'allocated_to_known_education': False, 'unexplained_source_difference': 0}
    return {'counts': controls, 'education_records': records, 'national_education': national_education,
        'working_time_records': time_records, 'national_working_time': dict(sorted(time_totals.items())),
        'regional_totals': regional, 'july_residual_audit': july_audit}


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
        for k, v in result.items():
            if data.get(k) != v:
                raise SystemExit(f'Qualification/time extraction mismatch: {k}')
    print(f'Qualification/time source check OK: {len(result["education_records"])} regional education rows; {len(result["working_time_records"])} working-time/type rows; July residual {result["july_residual_audit"]["residual_count"]} = XX (unallocated).')


if __name__ == '__main__':
    main()
