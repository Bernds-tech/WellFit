"""Extract the published Q2 2026 workbook using stdlib only; never infer missing cells.

Run with --check in CI; --write updates only the source-derived fields of the
existing canonical artifact. Workbook bytes and SHA256 are retained for audit.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'werk-data/sources/ams-bmasgpk-fachkraefte-2026-q2.xlsx'
TARGET = ROOT / 'werk-data/labour-occupation-region-matching-matrix.json'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
EXPECTED = {'Österreich': 51, 'Burgenland': 16, 'Kärnten': 50,
            'Niederösterreich': 39, 'Oberösterreich': 77, 'Salzburg': 55,
            'Steiermark': 49, 'Tirol': 58, 'Vorarlberg': 46, 'Wien': 11}


def extract():
    records, regions = [], []
    with zipfile.ZipFile(SOURCE) as z:
        strings = [''.join(t.text or '' for t in si.findall('.//s:t', NS))
                   for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']: r.attrib['Target'] for r in
                ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = ET.fromstring(z.read('xl/workbook.xml')).find('s:sheets', NS)
        for sheet in sheets:
            name = sheet.attrib['name']
            if 'Top Engpassberufe' not in name:
                continue
            path = rels[sheet.attrib[REL]]
            path = path.lstrip('/') if path.startswith('/') else 'xl/' + path
            cells = {}
            for c in ET.fromstring(z.read(path)).findall('.//s:sheetData/s:row/s:c', NS):
                if c.find('s:f', NS) is not None:
                    raise ValueError(f'{name} {c.attrib["r"]}: unexpected formula')
                v = c.find('s:v', NS)
                value = None if v is None else v.text
                if c.attrib.get('t') == 's' and value is not None:
                    value = strings[int(value)]
                elif c.attrib.get('t') == 'inlineStr':
                    value = ''.join(t.text or '' for t in c.findall('.//s:t', NS))
                elif value is not None:
                    value = float(value)
                    if not math.isfinite(value):
                        raise ValueError('Non-finite source number')
                cells[c.attrib['r']] = value
            region = cells['B5']
            assert region in EXPECTED and region not in regions
            assert '2026_Q2' in cells['B1'] and cells['C6'] == 'Q2_2026'
            assert cells['C4'] == 'Hinweis: AMS OS ohne AKÜ Abschlag'
            regions.append(region)
            count = 0
            for cell, label in cells.items():
                if not re.fullmatch(r'B\d+', cell) or int(cell[1:]) < 7 or label is None:
                    continue
                match = re.fullmatch(r'(\d{4}|\d{6}) - (.+)', str(label))
                if not match:
                    raise ValueError(f'Unrecognized occupation row {name}:{cell}: {label}')
                row = int(cell[1:])
                values = [cells.get(f'{col}{row}') for col in 'CDEFGHI']
                stock, score, flag, t1, t2, t3, direction = values
                assert isinstance(stock, (int, float)) and stock > 0
                assert score in (1, 2) and all(v in (-2, -1, 0, 1, 2) for v in (t1, t2, t3))
                assert flag in ('', '+', None) and direction in ('↑', '↔', '↓')
                count += 1
                records.append({'region': region, 'occupation_code': match[1],
                    'occupation_label': match[2], 'ams_vacancies_quarter_average': stock,
                    'reported_shortage_score': int(score),
                    'reported_pressure_below_one_flag': flag == '+',
                    'reported_t1': int(t1), 'reported_t2': int(t2), 'reported_t3': int(t3),
                    'reported_yoy_direction': {'↑': 'up', '↔': 'unchanged', '↓': 'down'}[direction],
                    'source_sheet': name, 'source_row': row})
            assert count == EXPECTED[region], (region, count)
    assert set(regions) == set(EXPECTED)
    assert len({(r['region'], r['occupation_code']) for r in records}) == len(records)
    return {'source_sha256': hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
            'published_rows_by_region': EXPECTED, 'published_row_count': len(records),
            'records': records}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--write', action='store_true')
    args = parser.parse_args()
    data = json.loads(TARGET.read_text())
    extracted = extract()
    if args.write:
        data.update(extracted)
        TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    else:
        for key, value in extracted.items():
            if data.get(key) != value:
                raise SystemExit(f'Source extraction mismatch: {key}')
    print(f'Occupation source reconciliation OK: {len(extracted["records"])} rows, 10 geographic scopes, SHA256 verified.')
