"""Reconcile published survey estimates and childcare opening-time categories.

Only displayed ODS values are interpreted. Hidden numeric values behind (x)
are never promoted into canonical evidence. No survey-to-AMS matching is inferred.
"""
import argparse
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'werk-data/labour-time-care-constraints-2025.json'
T = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0'
SEX = ['all', 'men', 'women']
REGIONS = ['Österreich', 'Burgenland', 'Kärnten', 'Niederösterreich', 'Oberösterreich',
           'Salzburg', 'Steiermark', 'Tirol', 'Vorarlberg', 'Wien']


def require(ok, message):
    if not ok:
        raise ValueError(message)


def sheet(source, name):
    path = ROOT / source['file']
    require(hashlib.sha256(path.read_bytes()).hexdigest() == source['sha256'], 'Time/care source hash mismatch')
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read('content.xml'))
    matches = [s for s in root.findall('.//{' + T + '}table') if s.get('{' + T + '}name') == name]
    require(len(matches) == 1, 'Time/care source sheet missing or duplicated')
    result, number = {}, 1
    for row in matches[0].findall('{' + T + '}table-row'):
        values, column = {}, 1
        for cell in row:
            if cell.tag not in ['{' + T + '}table-cell', '{' + T + '}covered-table-cell']:
                continue
            text = ''.join(cell.itertext()).strip()
            repeat = int(cell.get('{' + T + '}number-columns-repeated', 1))
            if text:
                require(repeat < 100, 'Unexpected repeated nonempty ODS cell')
                for offset in range(repeat):
                    values[column + offset] = text
            column += repeat
        repeat = int(row.get('{' + T + '}number-rows-repeated', 1))
        if values:
            require(repeat < 100, 'Unexpected repeated nonempty ODS row')
            for offset in range(repeat):
                result[number + offset] = values.copy()
        number += repeat
    return result


def cell_ref(sheet_name, row, col):
    return f'{sheet_name}!{chr(64 + col)}{row}'


def estimate(rows, sheet_name, row, col, unit='thousand_persons'):
    display = rows[row].get(col, '')
    require(display, 'Missing time/care published estimate')
    quality = 'published'
    if display == '(x)':
        value, quality = None, 'not_interpretable'
    else:
        normalized = re.sub(r'\s+', '', display)
        if normalized.startswith('(') and normalized.endswith(')'):
            quality, normalized = 'high_sampling_uncertainty', normalized[1:-1]
        require(re.fullmatch(r'\d+(,\d)?', normalized), 'Invalid displayed survey estimate')
        value = float(Decimal(normalized.replace(',', '.')))
    return {'value': value, 'unit': unit, 'quality': quality,
            'display': display, 'cell': cell_ref(sheet_name, row, col)}


def rounded_identity(total, parts, label):
    # Published survey estimates are rounded independently to 0.1 thousand.
    # A hidden/uninterpretable component is never reconstructed by subtraction.
    if total['value'] is None or any(p['value'] is None for p in parts):
        return
    tolerance = Decimal('0.05') * (len(parts) + 1)
    difference = abs(Decimal(str(total['value'])) - sum(Decimal(str(p['value'])) for p in parts))
    require(difference <= tolerance, f'Time/care rounded identity: {label}')


def extract(data):
    require([s['id'] for s in data['sources']] == ['ake_wishes', 'ake_parttime', 'kth_vif'], 'Time/care source set mismatch')
    src = {s['id']: s for s in data['sources']}
    r3, r1 = sheet(src['ake_wishes'], 'R3'), sheet(src['ake_wishes'], 'R1')
    t7, kth = sheet(src['ake_parttime'], 'T7'), sheet(src['kth_vif'], 'Tabelle1')
    for rows in [r3, r1, t7]:
        require('2025' in rows[1][1], 'Time/care survey source period mismatch')
    require('2024/25' in kth[1][1] and '1.9.2024' in kth[3][2], 'Childcare source period mismatch')
    wishes = []
    for sex, offset in zip(SEX, [0, 28, 56]):
        for base in [7, *range(9, 15), *range(25, 34)]:
            row = base + offset + 2  # R3 has a repeated blank header row in ODS.
            dimension = 'total' if base == 7 else 'age' if base < 15 else 'education'
            label = r3[row].get(1) or r3[row].get(2)
            parent = 'Höhere Schule' if base in [29, 30] else 'Hochschule und Akademie' if base in [32, 33] else None
            metrics = {key: estimate(r3, 'R3', row, col, unit) for key, col, unit in [
                ('employed', 3, 'thousand_persons'), ('parttime', 4, 'thousand_persons'),
                ('wants_more', 5, 'thousand_persons'), ('wants_more_pct_of_parttime', 6, 'percent'),
                ('available_within_two_weeks', 7, 'thousand_persons'), ('available_pct_of_parttime', 8, 'percent'),
                ('underemployment_pct_of_all_employed', 9, 'percent')]}
            wishes.append({'sex': sex, 'dimension': dimension, 'label': label, 'parent_label': parent, 'metrics': metrics})
            chain = [metrics[k]['value'] for k in ['available_within_two_weeks', 'wants_more', 'parttime', 'employed']]
            observed = [n for n in chain if n is not None]
            require(observed == sorted(observed), 'Time/care availability subset order')
    for sex in SEX:
        rows = [r for r in wishes if r['sex'] == sex]
        total = next(r for r in rows if r['dimension'] == 'total')
        for key in ['employed', 'parttime', 'wants_more', 'available_within_two_weeks']:
            for dimension in ['age', 'education']:
                parts = [r['metrics'][key] for r in rows if r['dimension'] == dimension and r['parent_label'] is None]
                rounded_identity(total['metrics'][key], parts, 'wish partition ' + dimension)
    for row in wishes:
        for numerator, denominator, pct in [('wants_more', 'parttime', 'wants_more_pct_of_parttime'),
                ('available_within_two_weeks', 'parttime', 'available_pct_of_parttime'),
                ('available_within_two_weeks', 'employed', 'underemployment_pct_of_all_employed')]:
            n, d, value = [row['metrics'][k]['value'] for k in [numerator, denominator, pct]]
            if None not in [n, d, value] and d > .05:
                low, high = 100 * max(n - .05, 0) / (d + .05), 100 * (n + .05) / (d - .05)
                require(value + .050001 >= low and value - .050001 <= high, 'Time-wish percentage denominator mismatch')
    slack = []
    for sex, row in zip(SEX, [6, 40, 74]):
        metrics = {k: estimate(r1, 'R1', row, c) for k, c in [
            ('total_slack', 2), ('ilo_unemployed', 3), ('reserve_unavailable', 5), ('reserve_available', 7), ('parttime_underemployed', 9)]}
        rounded_identity(metrics['total_slack'], [metrics[k] for k in ['ilo_unemployed', 'reserve_unavailable', 'reserve_available', 'parttime_underemployed']], 'slack components')
        match = next(r for r in wishes if r['sex'] == sex and r['dimension'] == 'total')
        require(metrics['parttime_underemployed']['value'] == match['metrics']['available_within_two_weeks']['value'], 'R1/R3 underemployment mismatch')
        slack.append({'sex': sex, 'metrics': metrics})
    reasons = []
    for sex, offset in zip(SEX, [0, 14, 28]):
        for base in range(7, 20):
            row = base + offset
            metrics = {key: estimate(t7, 'T7', row, c) for c, key in enumerate([
                'parttime_total', 'child_or_adult_care', 'no_fulltime_wanted', 'other_personal_family',
                'no_fulltime_found', 'education_training', 'other'], 2)}
            rounded_identity(metrics['parttime_total'], [v for k, v in metrics.items() if k != 'parttime_total'], 'parttime reasons')
            reasons.append({'sex': sex, 'age': t7[row][1], 'is_total': base == 7,
                            'overlapping_age_summary': base == 19, 'metrics': metrics})
    childcare = []
    categories = {'total': 7, 'half_day': 18, 'full_day': 29, 'vif': 40, 'below_threshold': 51}
    for region_index, region in enumerate(REGIONS):
        for col, age in [(2, '0-2'), (3, '3-5')]:
            counts, shares, refs = {}, {}, {}
            for category, start in categories.items():
                row = start + region_index
                require(kth[row][1] in [region, region + '5'], 'Childcare source region label mismatch')
                display = kth[row][col]
                require(re.fullmatch(r'[\d\s]+', display), 'Invalid childcare displayed count')
                counts[category] = int(re.sub(r'\s+', '', display))
                shares[category] = estimate(kth, 'Tabelle1', row, col + 8, 'percent')
                refs[category] = cell_ref('Tabelle1', row, col)
            require(counts['total'] == sum(v for k, v in counts.items() if k != 'total'), 'Childcare category partition mismatch')
            for category in categories:
                require(abs(100 * counts[category] / counts['total'] - shares[category]['value']) <= .050001, 'Childcare share denominator mismatch')
            childcare.append({'region': region, 'age': age, 'children': counts, 'shares_of_attending_children': shares,
                              'count_cells': refs, 'source_region_note': 'summer_open_weeks_included' if region == 'Steiermark' else None})
    for age in ['0-2', '3-5']:
        rows = [r for r in childcare if r['age'] == age]
        for category in categories:
            require(rows[0]['children'][category] == sum(r['children'][category] for r in rows[1:]), 'Childcare national/regional total mismatch')
    national = [r for r in childcare if r['region'] == 'Österreich']
    vif = sum(r['children']['vif'] for r in national)
    attending = sum(r['children']['total'] for r in national)
    headline = data['cross_source_controls']['childcare_press_release']
    require(round(100 * vif / attending, 1) == headline['vif_share_all_attending_under_six_pct'], 'Childcare press share mismatch')
    require(round(vif / 100) * 100 == headline['vif_children_rounded_to_hundreds'], 'Childcare press count mismatch')
    quality_counts = {}
    for name, records in [('wishes', wishes), ('slack', slack), ('reasons', reasons)]:
        qualities = [m['quality'] for r in records for m in r['metrics'].values()]
        quality_counts[name] = {q: qualities.count(q) for q in ['published', 'high_sampling_uncertainty', 'not_interpretable']}
    return {'working_time_wishes': wishes, 'slack_controls': slack, 'parttime_reasons': reasons,
            'childcare_opening_categories': childcare, 'quality_counts': quality_counts}


def validate_scope(data):
    require(data['periods'] == {'labour_survey': '2025', 'childcare': '2024/25', 'child_age_reference': '2024-09-01'}, 'Time/care periods must stay separate')
    scope = data['scope']
    for key in ['hidden_ods_numbers_used', 'suppressed_values_reconstructed', 'survey_added_to_ams_stocks',
                'wishes_equal_feasible_hours', 'child_counts_equal_free_places', 'children_equal_parents',
                'synthetic_household_region_join', 'care_reason_split_into_child_and_adult']:
        require(scope[key] is False, f'Unsupported time/care inference: {key}')
    require(scope['survey_values'] == 'published_display_only' and scope['suppressed_value'] is None, 'Survey display/suppression guard changed')
    require(scope['wish_population'] == 'ILO_parttime_employed_15_74_private_households_2025', 'Wrong time-wish population')
    require(scope['reason_population'] == 'ILO_parttime_employed_15_plus_private_households_2025', 'Wrong parttime-reason population')
    require(scope['childcare_denominator'] == 'attending_children_same_age_excluding_hort_groups', 'Childcare denominator guard changed')
    require(scope['childcare_geography'] == 'facility_location_not_parent_residence', 'Childcare geography guard changed')
    require(scope['education_parent_rows_nonadditive'] is True and scope['parttime_15_64_summary_nonadditive'] is True, 'Time/care overlapping totals guard changed')
    gate = data['effect_gate']
    require(gate['status'] == 'blocked' and all(gate[k] is None for k in ['employment_effect_persons', 'budget_effect_eur', 'feasible_additional_hours', 'available_childcare_places']), 'Time/care effects and free places must remain null')
    require(data['joint_matching_cells'] == [], 'Time/care synthetic joint cells forbidden')
    require(data['childcare_definition']['vif'] == {'weeks_per_year_min': 47, 'hours_per_week_min': 45, 'weekdays': 5, 'days_with_9_5_hours_min': 4, 'lunch_offered': True}, 'VIF source definition changed')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--write', action='store_true')
    args = p.parse_args()
    data = json.loads(TARGET.read_text())
    validate_scope(data)
    extracted = extract(data)
    if args.write:
        data.update(extracted)
        TARGET.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
    else:
        for key, value in extracted.items():
            require(data.get(key) == value, f'Time/care extraction mismatch: {key}')
    print(f'Time/care source check OK: {len(extracted["working_time_wishes"])} wish rows, {len(extracted["parttime_reasons"])} reason rows, {len(extracted["childcare_opening_categories"])} region/age childcare rows; suppressed estimates remain null; effects blocked.')


if __name__ == '__main__':
    main()
