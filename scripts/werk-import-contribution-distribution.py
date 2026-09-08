"""Read-only import of original DVSV XLSX cells; Python standard library only."""
import hashlib
import json
import math
from pathlib import Path
import sys
import xml.etree.ElementTree as ET
import zipfile

SOURCE = Path('werk-data/sources/dvsv-contribution-distribution-2024.xlsx')
EXPECTED_HASH = 'a931d01404b2b7047d3092a2e5da55c6cf74f6e89c72a408d5c6c0912f023dc1'
OUTPUT = Path('werk-data/employee-contribution-distribution-2024.json')
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
        raise ValueError('Missing, nonnumeric or invalid source number')
    return value


def import_source():
    digest = hashlib.sha256(SOURCE.read_bytes()).hexdigest()
    if digest != EXPECTED_HASH:
        raise ValueError('Source checksum changed; review a new source version')
    with zipfile.ZipFile(SOURCE) as book:
        strings = [''.join(si.itertext()) for si in ET.fromstring(book.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(book.read('xl/_rels/workbook.xml.rels'))}
        sheets = {}
        for sheet in ET.fromstring(book.read('xl/workbook.xml')).find('s:sheets', NS):
            target = rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            file = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            cells = {}
            for c in ET.fromstring(book.read(file)).findall('.//s:c', NS):
                v = c.find('s:v', NS)
                if v is None:
                    continue
                cells[c.attrib['r']] = strings[int(v.text)] if c.get('t') == 's' else float(v.text)
            sheets[sheet.attrib['name']] = cells
    rows = []
    groups = ['workers_and_employees', 'workers', 'employees']
    for index in range(12, 21):
        sheet = f'1.{index}'
        c = sheets[sheet]
        dimension = 'industry' if index <= 14 else 'region' if index <= 17 else 'age'
        group = groups[(index - 12) % 3]
        first, last, header = (8, 29, 5) if dimension == 'industry' else (9, 18 if dimension == 'region' else 19, 6)
        assert 'einschließlich Sonderzahlungen' in c['A1'] + str(c.get('C1', ''))
        assert c.get('C2') == 2024 if dimension == 'industry' else c['A3'] == 'im Jahre 2024'
        foot = c['A30'] if dimension == 'industry' else c['B20'] if dimension == 'region' else c['B21']
        assert 'Zahl der Versicherungstage x 30' in foot
        for col, p in zip('CDEFGHIJK', [.25, .5, .75] * 3):
            assert c[f'{col}{header}'] == p
        for row in range(first, last + 1):
            label = 'all' if row == first else str(c[f'A{row}']).strip()
            if dimension == 'industry' and row > first:
                label += ': ' + c[f'B{row}'].replace('\n', ' ')
            quantiles = {}
            for sex, cols in [('all', 'CDE'), ('male', 'FGH'), ('female', 'IJK')]:
                vals = [number(c.get(f'{col}{row}')) for col in cols]
                assert vals == sorted(vals), f'Unordered source quantiles {sheet}:{row}'
                quantiles[sex] = dict(zip(['p25_eur', 'p50_eur', 'p75_eur'], vals))
            rows.append({'dimension': dimension, 'employment_group': group, 'label': label,
                         'quantiles': quantiles, 'source_sheet': sheet, 'source_range': f'C{row}:K{row}'})
    assert len(rows) == 129
    for group in groups:
        totals = [r['quantiles'] for r in rows if r['employment_group'] == group and r['label'] == 'all']
        assert len(totals) == 3 and totals[0] == totals[1] == totals[2]
    return {'version': 1, 'checked_on': '2026-09-08', 'data_year': 2024,
            'source': {'publisher': 'Dachverband der Sozialversicherungsträger', 'publication': 'Statistisches Handbuch 2025',
                       'url': 'https://www.sozialversicherung.at/cdscontent/load?contentid=10008.799419&version=1762761801',
                       'archive_member': 'Kapitel 1_25.xlsx', 'local_file': str(SOURCE), 'sha256': digest,
                       'sheets': [f'1.{i}' for i in range(12, 21)]},
            'observation_unit': 'person_annual_contributions_normalized_to_30_insurance_days',
            'includes_special_payments': True, 'includes_apprentices': False,
            'definition': 'Sum of monthly incomes of a calendar year divided by insurance days, multiplied by 30; includes special payments.',
            'actual_monthly_payment_distribution': False, 'quantile_values': 1161,
            'person_count': None, 'actual_alv_eligible_payment_count': None,
            'national_transition_cost_identified': False, 'verified_budget_credit_eur': 0, 'rows': rows}


def main():
    content = json.dumps(import_source(), ensure_ascii=False, indent=2) + '\n'
    if '--write' in sys.argv:
        OUTPUT.write_text(content)
    elif OUTPUT.read_text() != content:
        raise ValueError('Contribution distribution changed; regenerate after source review')
    print('DVSV distribution OK: 9 tables, 129 rows, 1161 quantile cells; repeated totals reconcile; normalized annual persons are not monthly payments.')


if __name__ == '__main__':
    main()
