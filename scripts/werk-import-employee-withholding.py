"""Read published ODS display values; never infer a pure KV/PV/ALV total."""
import hashlib
import json
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

SOURCE = Path('werk-data/sources/stat-lohnsteuer-employment-2024.ods')
OUT = Path('werk-data/employee-payroll-withholding-2024.json')
SHA = '1490c42a3a4e8576ddeb951fe94914a0c940d0c27914d3198566650bad4ba900'
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == SHA, 'Source hash drift'
NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
root = ET.fromstring(ZipFile(SOURCE).read('content.xml'))
sheet = root.find('.//{' + NS + '}table')
assert sheet.attrib['{' + NS + '}name'] == 'Tab_16_1'
rows = {}
number = 1
for row in sheet.findall('{' + NS + '}table-row'):
    cells = []
    for c in row:
        cells.extend([' '.join(c.itertext()).strip()] * min(30, int(c.attrib.get('{' + NS + '}number-columns-repeated', 1))))
    if any(cells):
        rows[number] = cells
    number += int(row.attrib.get('{' + NS + '}number-rows-repeated', 1))

def num(row, col):
    text = rows[row][col - 1].replace(' ', '').replace('\u00a0', '')
    assert text.isdigit(), f'Non-integer displayed source value at {row}/{col}: {text}'
    return int(text)

assert rows[30][9].startswith('Einbehaltene Sozialversicherungs')
assert rows[31][10] == '1 000 Euro'
assert rows[27][1] == rows[52][1] == 'Insgesamt'
detail = []
for i in range(19):
    upper, lower = 8 + i, 33 + i
    assert rows[upper][0] == rows[lower][0] == str(i + 1)
    detail.append({'bracket': ' '.join(rows[upper][1:5]).strip(), 'persons': num(upper, 6),
                   'gross_thousand_eur': num(upper, 7), 'withheld_contributions_and_levies_thousand_eur': num(lower, 11),
                   'withheld_wage_tax_thousand_eur': num(lower, 13),
                   'cells': {'persons': f'F{upper}', 'gross': f'G{upper}', 'contributions': f'K{lower}', 'tax': f'M{lower}'}})
totals = {'persons': num(27, 6), 'gross_thousand_eur': num(27, 7),
          'withheld_contributions_and_levies_thousand_eur': num(52, 11), 'withheld_wage_tax_thousand_eur': num(52, 13)}
residual = {key: totals[key] - sum(r[key] for r in detail) for key in totals}
assert residual['persons'] == 0
assert all(abs(v) <= 10 for k, v in residual.items() if k != 'persons'), 'Excessive rounded row residual'
d = {'version': '2026-09-06-v1', 'year': 2024, 'status': 'official_employment_payroll_withholding_not_core_insurance_total',
     'source': {'authority': 'STATISTIK AUSTRIA', 'url': 'https://www.statistik.at/fileadmin/pages/243/Tabellen_16.1-16.1.2.zip',
                'archive_member': 'Tabellen 16.1-16.1.2/Tab.16.1.ods', 'local_file': str(SOURCE), 'sha256': SHA, 'sheet': 'Tab_16_1',
                'checked_at': '2026-09-06', 'publication_url': 'https://www.statistik.at/fileadmin/publications/Lohnsteuer_2024_barr.pdf'},
     'scope': 'Table 16: employment wage slips grouped by person, including employment of people also receiving pensions; pension wage slips excluded. Withholding includes chamber/housing levies and mixed employee regimes, not just standard ASVG KV/PV/ALV.',
     'method': 'Published displayed integers in thousand EUR, no hidden spreadsheet precision; adapted source extract with explicit rounding residuals.',
     'totals': totals, 'total_cells': {'persons': 'F27', 'gross': 'G27', 'contributions': 'K52', 'tax': 'M52'},
     'brackets': detail, 'published_total_minus_bracket_sum': residual,
     'classification_warning': 'Overview table classifies persons by dominant income and reports 31,955.0m employee withholding; this employment-slip-only table reports 31,952.625m. These are different populations and amounts, not a correction to one another.',
     'pure_employee_kv_pv_alv_total_eur': None, 'future_post_debt_reform_cost_eur': None,
     'rules': ['Do not add pension withholding or employer contributions.', 'Do not treat this 2024 broad payroll aggregate as the future SV-01 cost.', 'No bracket average payroll simulation: employment duration and special regimes are not jointly identified.']}
content = json.dumps(d, ensure_ascii=False, indent=2) + '\n'
if '--write' in sys.argv:
    OUT.write_text(content)
else:
    assert OUT.read_text() == content, 'Regenerate employee withholding source extract'
print(f'Employee source OK: {len(detail)} brackets, {totals["persons"]} employment recipients, {totals["withheld_contributions_and_levies_thousand_eur"]} thousand EUR withholding; core SV total unknown.')
