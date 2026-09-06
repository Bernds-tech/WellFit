"""Reconcile the existing regional baseline to the pinned AMS August workbook.

No source rows are synthesized from national residuals. Counts are separate
overlapping views of unemployment, not additive matching/activation groups.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'werk-data/sources/ams-eckdaten-2026-08.xlsx'
TARGET = ROOT / 'werk-data/labour-matching-baseline-2025-2026.json'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
FIELDS = {'registered_unemployed': 'B', 'unemployed_men_and_alternative_gender': 'C',
          'unemployed_women': 'D', 'unemployed_age_15_24': 'E',
          'unemployed_age_50_plus': 'G', 'unemployed_duration_over_one_year': 'I',
          'registered_vacancies': 'M', 'apprenticeship_seekers': 'N',
          'registered_apprenticeship_vacancies': 'O'}
REGIONS = ['Burgenland', 'Kärnten', 'Niederösterreich', 'Oberösterreich',
           'Salzburg', 'Steiermark', 'Tirol', 'Vorarlberg', 'Wien', 'Österreich']
LABELS = ['Burgenland', 'Kärnten', 'NÖ', 'OÖ', 'Salzburg', 'Steiermark',
          'Tirol', 'Vorarlberg', 'Wien', 'ÖSTERREICH']


def extract():
    with zipfile.ZipFile(SOURCE) as z:
        strings = [''.join(t.text or '' for t in si.findall('.//s:t', NS))
                   for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        sheets = ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', NS)
        sheet = next(s for s in sheets if s.attrib['name'] == 'August 2026')
        rels = {r.attrib['Id']: r.attrib['Target'] for r in
                ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        path = rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        path = path.lstrip('/') if path.startswith('/') else 'xl/' + path
        cells = {}
        for c in ET.fromstring(z.read(path)).findall('.//s:sheetData/s:row/s:c', NS):
            v = c.find('s:v', NS)
            if v is None:
                continue
            value = strings[int(v.text)] if c.attrib.get('t') == 's' else float(v.text)
            cells[c.attrib['r']] = value
        if cells['A2'] != 'Arbeitsmarktdaten 08/2026' or cells['K6'] != '08/2026***':
            raise ValueError('Regional source period mismatch')
        if cells['D22'] != '*) 15 bis unter 25 Jahre' or cells['G22'] != '**) Länger als 1Jahr arbeitslos':
            raise ValueError('Regional subgroup definitions changed')
        records = []
        for row, region, label in zip(range(7, 17), REGIONS, LABELS):
            if cells.get(f'A{row}') != label:
                raise ValueError(f'Regional row label mismatch {row}')
            record = {'region': region}
            for field, col in FIELDS.items():
                value = cells.get(f'{col}{row}')
                if not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0 or value != int(value):
                    raise ValueError(f'Invalid source count {col}{row}')
                record[field] = int(value)
            rate = cells.get(f'K{row}')
            if not isinstance(rate, (int, float)) or not math.isfinite(rate) or not 0 <= rate <= 1:
                raise ValueError('Invalid source rate')
            record['registered_unemployment_rate_pct'] = round(rate * 100, 1)
            record['source_locator'] = {'source_id': 'AMS-ECKDATEN-AUG-2026',
                'sheet': 'August 2026', 'row': row,
                'cells': {**{f: f'{c}{row}' for f, c in FIELDS.items()},
                          'registered_unemployment_rate_pct': f'K{row}'}}
            records.append(record)
    for field in FIELDS:
        if sum(r[field] for r in records[:-1]) != records[-1][field]:
            raise ValueError(f'Regional source national sum mismatch {field}')
    for r in records:
        if r['unemployed_men_and_alternative_gender'] + r['unemployed_women'] != r['registered_unemployed']:
            raise ValueError('Regional source gender sum mismatch')
    return records


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--write', action='store_true')
    args = parser.parse_args()
    data = json.loads(TARGET.read_text())
    records = extract()
    actual = {r['region']: r for r in data['regional_ams_snapshots_august_2026']}
    if set(actual) != set(REGIONS[:-1]):
        raise ValueError('Regional baseline coverage mismatch')
    evidence = {'source_file': str(SOURCE.relative_to(ROOT)),
        'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
        'reference_period': '2026-08', 'count_columns': FIELDS,
        'national_record': records[-1],
        'subgroup_rule': 'Geschlecht, Alter und Dauer sind überlappende Sichten; keine addierbaren Aktivierungsgruppen. Langzeitarbeitslosigkeit ist nicht Langzeitbeschäftigungslosigkeit.',
        'rate_status': 'geschätzt; veröffentlichte Quote auf eine Dezimalstelle gerundet'}
    if args.write:
        for r in records[:-1]:
            actual[r['region']].update(r)
        data['regional_source_evidence'] = evidence
        TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    else:
        for r in records[:-1]:
            for key, value in r.items():
                if actual[r['region']].get(key) != value:
                    raise SystemExit(f'Regional source mismatch: {r["region"]} {key}')
        if data.get('regional_source_evidence') != evidence:
            raise SystemExit('Regional source metadata mismatch')
    print('Regional source reconciliation OK: 9 states + national row; 9 count columns and rates; source locators and SHA256 verified.')


if __name__ == '__main__':
    main()
