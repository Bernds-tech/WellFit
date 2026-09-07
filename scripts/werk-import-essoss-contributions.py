"""Auditable ESSOSS display-value extract; official allocation is not cash receipts."""
import hashlib
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
URL = 'https://www.statistik.at/fileadmin/pages/341/22_ESSOS_Tabellen_isg_Ausgaben_ods.zip'
OUT = Path('werk-data/employee-essoss-contribution-bridge-2024.json')
REPORT = Path('WERK_SV_BEITRAGSBASIS.md')
CONFIG = [
 ('01', 'Gesetzliche Pensionsversicherung', 4, '59be7dd3f1762f7d1e555d98e8ebb114f9a99e7ed6cf837330ec0f3aa999ba44', 'social_insurance_allocated', 'Dachverband-Sonderauswertung; DN-Aufteilung berücksichtigt Beitragssätze. Kein Einzelbeitragskonto.'),
 ('02', 'Pensionen öffentliche Rechtsträger', 3, 'ec6c649f110ba649b4be4148a9dfa5bb323a517a211a6dcc0295c983b9e70c6a', 'mixed_active_and_retired_public_service', 'Enthält laut Methodik auch Pensionssicherungsbeiträge aus Ruhebezügen; Arbeitnehmerklassifikation ist keine reine Aktivlohnsumme.'),
 ('05', 'Betriebliche Pensionsvorsorge', 5, 'f5326aba599d26eda9c5f5685c507d176b2167680ed985ad3a923c0fce7328b6', 'occupational_pension', 'Beiträge zu Pensionskassen; außerhalb KV/PV/ALV-Kern.'),
 ('08', 'Gesetzliche Krankenversicherung', 5, 'b7d51ed8f9f81b57d9062a83db6bbf68d5188a1096dd3aeec2dad8938998939c', 'social_insurance_reported', 'Dachverband-Sonderauswertung trennt Arbeitnehmer, Selbständige und Pensionisten; ASVG-Untergruppe nicht separat ausgewiesen.'),
 ('12', 'Krankenfürsorgeanstalten', 4, 'a48955e69fb6f3b32a13512b24fce2e4af6ee99d29380fc21d90db0ccaa206ef', 'public_service_health_allocated', 'Aktive Beamte; eigene Methodik mit 50%-Beitragsaufteilung und Einschränkungen der Datenverfügbarkeit.'),
 ('14', 'Arbeitslosenversicherung', 4, 'aaa6cdfd5ae47c66ea3c54c9716443023d67d38d58a156b1f26f10f8dc4d3140', 'assumed_half_of_total', 'Arbeitnehmeranteil wird mangels getrennter Daten als Hälfte der ALV-Beiträge angenommen. Kein gemessener DN-Kasseneingang.'),
 ('17', 'Schlechtwetterentschädigung', 4, '3e3aa1fb61f410f8ffaf45274ad76f5d3ebfa4b79716ef2c51a2ebfb373258e5', 'separate_levy_allocated', 'Hälfte der Schlechtwetterbeiträge; außerhalb KV/PV/ALV-Kern.'),
]

def require(ok, message):
    if not ok:
        raise ValueError(message)

def sheet(path, name, sha):
    require(hashlib.sha256(path.read_bytes()).hexdigest() == sha, f'Source hash drift: {path}')
    root = ET.fromstring(ZipFile(path).read('content.xml'))
    found = [s for s in root.findall('.//{' + NS + '}table') if s.get('{' + NS + '}name') == name]
    require(len(found) == 1, f'Sheet missing or duplicated: {name}')
    rows, i = {}, 1
    for row in found[0].findall('{' + NS + '}table-row'):
        cells = []
        for c in row:
            cells.extend([' '.join(c.itertext()).strip()] * min(45, int(c.get('{' + NS + '}number-columns-repeated', '1'))))
        rows[i] = cells
        i += int(row.get('{' + NS + '}number-rows-repeated', '1'))
    return rows

def number(text):
    require(bool(re.fullmatch(r'(\d+|\d{1,3}(?:,\d{3})+|\d{1,3}(?: \d{3})+)', text)), f'Invalid displayed integer: {text}')
    return int(text.replace(',', '').replace(' ', ''))

def build():
    systems = []
    for code, name, row, sha, quality, note in CONFIG:
        path = Path(f'werk-data/sources/stat-essoss-system-{code}-2024.ods')
        sn = f'3_{int(code)}_2_'
        rows = sheet(path, sn, sha)
        require(rows[2][39] == '2024' and 'Arbeitnehmer - Private Haushalte' in rows[row][2], 'Year/payer scope drift')
        method = sheet(path, f'3_{int(code)}_4_', sha)
        if code == '14':
            require('Annahme mangels Datenverfügbarkeit' in method[row][4], 'ALV allocation-method drift')
        history = [{'year': number(rows[2][col]),
                    'employee_contributions_mio_eur': None if rows[row][col] == '-' else number(rows[row][col]),
                    'source_display': rows[row][col], 'cell': f'{column(col + 1)}{row}'} for col in range(5, 40)]
        systems.append({'system_id': code, 'system_name': name, 'source': {'url': URL,
                        'archive_member': f'{code}_{name}.ods', 'local_file': str(path), 'sha256': sha,
                        'sheet': sn, 'method_sheet': f'3_{int(code)}_4_', 'method_row': row,
                        'checked_at': '2026-09-07'}, 'quality': quality, 'method_summary': note, 'history': history})
    overview_path = Path('werk-data/sources/stat-essoss-financing-1990-2024.ods')
    overview_sha = '103f17d8918c820011f9d8d274fdecf64fbb16591fbd26fea4881c3e3f565f5a'
    overview = sheet(overview_path, 'Tabelle1', overview_sha)
    require(overview[37][0] == overview[38][0] == '2023', 'Review changed overview year labels')
    published = number(overview[38][4])
    values = {s['system_id']: s['history'][-1]['employee_contributions_mio_eur'] for s in systems}
    core = sum(values[c] for c in ['01', '08', '14'])
    residual = published - sum(values.values())
    require(core == 29600 and residual == 1, 'Review component or rounding reconciliation')
    broad = json.loads(Path('werk-data/employee-payroll-withholding-2024.json').read_text())['totals']['withheld_contributions_and_levies_thousand_eur'] / 1000
    cases = []
    for debt in [431.4, 525.2]:
        for rate in [1, 2.5, 4]:
            for recapture in [0, .3]:
                gross = core / 1000 * .5
                cost = gross * (1 - recapture)
                interest = debt * rate / 100
                cases.append({'debt_anchor_bn': debt, 'assumed_avoided_rate_pct': rate,
                              'assumed_tax_recapture_share': recapture, 'gross_reference_half_bn': gross,
                              'net_reference_cost_bn': round(cost, 9), 'full_run_rate_avoided_interest_bn': round(interest, 9),
                              'funding_gap_bn': round(max(0, cost - interest), 9),
                              'break_even_rate_pct': round(cost / debt * 100, 9)})
    return {'version': '2026-09-07-v1', 'year': 2024,
            'status': 'official_statistical_employee_system_split_with_assumed_alv_allocation',
            'unit': 'million_eur_displayed_rounded', 'systems': systems,
            'overview': {'url': 'https://www.statistik.at/fileadmin/pages/341/6_Finanzierung_1990-2024.ods',
                         'local_file': str(overview_path), 'sha256': overview_sha, 'sheet': 'Tabelle1',
                         'employee_total_cell': 'E38', 'displayed_year_cell': 'A38', 'displayed_year': '2023',
                         'contextual_year': 2024, 'year_status': 'inferred_from_title_shares_and_correctly_labelled_system_columns_not_silently_corrected',
                         'employee_total_mio_eur': published, 'component_total_mio_eur': sum(values.values()),
                         'published_minus_components_mio_eur': residual},
            'bridge': {'core_statistical_employee_pv_kv_alv_mio_eur': core,
                       'other_employee_classified_systems_mio_eur': sum(values[c] for c in ['02','05','12','17']),
                       'broad_payroll_withholding_mio_eur': broad,
                       'broad_minus_core_mio_eur': round(broad-core, 6),
                       'difference_interpretation': 'Different statistical scope and allocation; not an identified AK/WF levy total.',
                       'exact_policy_eligible_cash_contribution_total_eur': None,
                       'current_budget_credit_eur': 0, 'future_reform_cost_eur': None},
            'sensitivity_scope': 'Static comparison using rounded 2024 ESSOSS reference, debt anchors from other periods, assumed rates/recapture; no forecast, growth, maturity schedule, service-cost reserve or proven funding. Existing canonical payroll/debt scenarios are not rebased.',
            'static_reference_cases': cases,
            'open_gates': ['ALV actual employee receipts after reduced DN rates', 'PV/KV statutory regime and contribution-category bridge',
                           'Future nominal contribution growth and demographic/service costs', 'Representative net tax recapture',
                           'Funded primary surpluses and dated avoided-refinancing interest schedule']}

def column(n):
    out = ''
    while n:
        n, rem = divmod(n-1, 26)
        out = chr(65+rem) + out
    return out

def report(d):
    rows = '\n'.join(f"| {s['system_name']} | {s['history'][-1]['employee_contributions_mio_eur'] / 1000:.3f} | {s['quality']} |" for s in d['systems'])
    return f'''# WERK — Arbeitnehmerbeiträge: engere amtliche Bezugsgröße

Stand: 7. September 2026. Ziel bleibt die schrittweise relative Halbierung der Arbeitnehmer-KV/PV/ALV, finanziert aus realisierten Zinsersparnissen bei gesicherten Leistungsansprüchen.

Die ESSOSS-Einzelzeilen ergeben für 2024 **29,600 Mrd. Euro** Arbeitnehmerbeiträge zu gesetzlicher Pension, Krankenversicherung und Arbeitslosenversicherung. Die Hälfte beträgt **14,800 Mrd. Euro**. Dies ist eine statistische Vergleichsbasis mit methodischer ALV-Aufteilung, kein exakt gemessenes Beitragsaufkommen des WERK-Reformkreises und keine künftige Kostenzusage.

| System | Arbeitnehmerklassifikation 2024, Mrd. € | Datenart |
|---|---:|---|
{rows}

Quelle: [Statistik Austria, amtliche Detailarbeitsmappen samt Methodik]({URL}), Einnahmenblätter jeweils 2024; sichtbare gerundete Millionenwerte. Die gespeicherten Originale und alle 245 Jahreswerte (sieben Systeme × 1990–2024) werden per Datei-Hash und Zelladresse geprüft. Verborgene Nachkommastellen werden nicht als zusätzliche Genauigkeit verwendet.

Besonders relevant: Die ALV-Methodik setzt den Arbeitnehmeranteil mangels getrennter Daten auf die Hälfte des Beitragsaufkommens. Reduzierte Arbeitnehmerbeiträge sind damit nicht als eigene tatsächliche Zahlungssumme belegt. Die KV trennt Arbeitnehmer, Selbständige und Pensionisten; die PV verwendet eine beitragssatzbezogene Aufteilung. Der Reformkreis muss noch mit diesen statistischen Abgrenzungen abgeglichen werden.

## Abstimmung der Gesamtsumme

Die sieben gerundeten Arbeitnehmerzeilen ergeben **31,937 Mrd. Euro**; die [ESSOSS-Übersicht](https://www.statistik.at/fileadmin/pages/341/6_Finanzierung_1990-2024.ods) weist **31,938 Mrd. Euro** aus. Die Differenz von **1 Mio. Euro** bleibt als Rundungsrest unverteilt. Bei der letzten Übersichtszeile steht in A38 erneut „2023“; Titel, 2024-Anteilszeile und korrekt datierte Detailspalten sprechen für 2024. Diese Zuordnung bleibt als begründete Interpretation dokumentiert; die Quelldatei wird nicht korrigiert.

Die übrigen vier Systeme summieren sich auf **2,337 Mrd. Euro**. Darunter fallen auch Beamtenpensionsbeiträge einschließlich Pensionssicherungsbeiträgen aus Ruhebezügen: Die statistische Arbeitnehmerkategorie ist deshalb nicht überall gleichbedeutend mit Abzügen vom aktiven Gehalt.

Zur bisherigen Lohnzettelgröße von **31,952625 Mrd. Euro** beträgt der Abstand der engeren Dreiergruppe **2,352625 Mrd. Euro**. Dieser Abstand ist **keine ermittelte AK-/Wohnbauförderungsabgabe**; beide Statistiken unterscheiden sich in Umfang und Berechnung. Bereits vereinnahmte Beiträge werden nicht als neue Staatseinnahmen gebucht.

## Was die engere Bezugsgröße an der Vergleichsrechnung ändert

Bei vollständigem Abbau des als Szenario verwendeten Schuldenankers von **525,2 Mrd. Euro** und angenommenen **2,5 %** vermiedenen Zinsen wären langfristig **13,13 Mrd. Euro jährlich** frei. Gegenüber der statischen Hälfte von 14,80 Mrd. Euro verbleiben ohne Steuer-Rückfluss **1,67 Mrd. Euro** jährliche Lücke. Der erforderliche vermiedene Zinssatz wäre rund **2,818 %**.

Bei zusätzlich angenommenem **30 % Steuer-Rückfluss** läge der Nettobedarf bei **10,36 Mrd. Euro**, rechnerisch **2,77 Mrd. Euro** unter den 13,13 Mrd. Euro Zinsersparnis. Der Steuer-Rückfluss ist keine gemessene Populationswirkung. Ein positiver Vergleichssaldo belegt noch keine dauerhafte Finanzierung.

Die zwölf maschinenlesbaren Varianten kombinieren zwei Schuldenanker, drei Zinssätze und zwei Steuer-Rückflussannahmen. Sie verbinden unterschiedlich datierte Bezugsgrößen nur als statische Sensitivität. Sie enthalten weder einen Schuldenfreiheitstermin noch zukünftiges Beitragswachstum, demografische Zusatzkosten, Reserven oder einen konkreten Fälligkeitsplan. Die vorhandenen [Wachstumsrechnungen](WERK_SV_WACHSTUMSSTRESS.md) bleiben relevant und werden nicht durch diese historische Basis ersetzt.

## Nächster Nachweis

Tatsächliche ALV-Arbeitnehmerzahlungen, Beitragsarten und Versichertenkreise von PV/KV sowie repräsentative Steuer-Rückflüsse abgrenzen. Danach die Basis mit der Finanzierung im Zeitverlauf verknüpfen. Bis dahin bleiben exakte Reformkosten und Finanzierung offen; die aktuelle Budgetgutschrift ist **0 Euro**.
'''

if __name__ == '__main__':
    data = build()
    for path, content in [(OUT, json.dumps(data, ensure_ascii=False, indent=2)+'\n'), (REPORT, report(data))]:
        if '--write' in sys.argv:
            path.write_text(content)
        else:
            require(path.read_text() == content, f'Regenerate {path}')
    print('ESSOSS contribution bridge OK: 245 year/system cells, 7 methods, explicit year conflict and 1m rounding residual; 12 conditional cases; exact policy cost open.')
