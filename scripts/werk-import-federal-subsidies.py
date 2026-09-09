#!/usr/bin/env python3
"""Reproduce the full BMF CSV snapshot and account-level results; no workbook authoring."""
import csv, gzip, hashlib, io, json, re, sys
from collections import defaultdict, Counter
from decimal import Decimal
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'werk-data/sources/bmf-foerderungen-bund-2026-08.csv.gz'
SPEC=ROOT/'werk-data/subsidy-federal-account-source.json'
CENT_PER_MIO=100_000_000
HEADER=['HH','AE','ÖkonGliederung_Ebene1','ÖkonGliederung_Ebene2','UGNr','Untergliederung','Globalbudget','Detailbudget1','Detailbudget2','Budgetposition','UG_Themenbereich','FixVar','C19Flag','Förderungen','Krisenmaßnahme','Geschäftsjahr','Monat','Kennzahl','Betrag']
DIMS=HEADER[:15]
def must(ok,message):
 if not ok:raise ValueError(message)
def money(raw):
 must(isinstance(raw,str) and re.fullmatch(r'-?\d+(?:,\d{1,8})?',raw) is not None,'Invalid monetary token')
 n=Decimal(raw.replace(',','.'))*CENT_PER_MIO
 must(n==n.to_integral_value(),'Fractional cent')
 return int(n)
def parse(raw):
 reader=csv.DictReader(io.StringIO(raw.decode('utf-8-sig'),newline=''),delimiter=';')
 must(reader.fieldnames==HEADER,'CSV schema changed')
 rows=[]; seen=set()
 for index,r in enumerate(reader,2):
  must(None not in r and all(isinstance(v,str) and v!='' for v in r.values()),'Missing CSV field')
  year=int(r['Geschäftsjahr']);month=int(r['Monat']);kind=r['Kennzahl']
  must(r['HH']=='FH' and r['AE']=='1','Unexpected household/flow scope')
  must(kind in ['Erfolg','BVA','Monatserfolg'],'Unknown period kind')
  must((kind=='Erfolg' and 2014<=year<=2025 and month==16) or (kind=='BVA' and 2026<=year<=2028 and month==0) or (kind=='Monatserfolg' and year in [2025,2026] and 1<=month<=14),'Invalid period scope')
  must(r['Förderungen'][:2] in ['06','16','17'],'Unknown funding class')
  code=r['Budgetposition'].split(' ',1)[0]
  must(re.fullmatch(r'\d{2}\.\d{2}\.\d{2}\.\d{2}-1/\d{4}\.\d{3}',code) is not None,'Invalid account code')
  must(int(code[:2])==int(r['UGNr']),'UG/account mismatch')
  key=tuple(r[k] for k in HEADER[:-1]);must(key not in seen,'Duplicate complete source dimensions');seen.add(key)
  rows.append({'source_record':index,'source_line_end':reader.line_num,'dimension':tuple(r[k] for k in DIMS),'year':year,'kind':kind,'month':month,'amount_cents':money(r['Betrag'])})
 return rows

def build(raw,spec):
 rows=parse(raw);must(len(rows)==15802,'Source record count changed')
 dims=sorted(set(r['dimension'] for r in rows));di={v:i for i,v in enumerate(dims)}
 records=[[r['source_record'],r['source_line_end'],di[r['dimension']],r['year'],r['kind'],r['month'],r['amount_cents']] for r in rows]
 normalized={'version':'2026-09-09-v1','source_sha256':hashlib.sha256(raw).hexdigest(),'dimension_columns':DIMS,'dimensions':[list(d) for d in dims], 'record_columns':['csv_record_including_header','physical_line_end','dimension_index','year','period_kind','month_code','amount_eur_cents'],'records':records,'rules':spec['rules']}
 sums=defaultdict(int);account_sums=defaultdict(int);ug=defaultdict(int);monthly=defaultdict(int);account_details={};annualkeys=set()
 for r in rows:
  d=dict(zip(DIMS,r['dimension']));cl=d['Förderungen'][:2];y=r['year'];v=r['amount_cents'];code=d['Budgetposition'].split(' ',1)[0];key=(code,cl)
  if r['kind']=='Monatserfolg':monthly[(y,r['month'],cl)]+=v;continue
  sums[(y,r['kind'],cl)]+=v;ug[(y,int(d['UGNr']),cl)]+=v
  account_sums[(key,y)]+=v;annualkeys.add(key)
  item=account_details.setdefault(key,{'account_code':code,'funding_class':cl,'ug':int(d['UGNr']),'labels':set(),'themes':set(),'crisis_tags':set(),'source_records_by_year':defaultdict(list)})
  item['labels'].add(d['Budgetposition']);item['themes'].add(d['UG_Themenbereich']);item['crisis_tags'].add(d['Krisenmaßnahme']);item['source_records_by_year'][y].append(r['source_record'])
 annual=[]
 for y in range(2014,2029):
  kind='Erfolg' if y<=2025 else 'BVA'
  vals={cl:sums.get((y,kind,cl)) for cl in ['06','16','17']}
  missing=[cl for cl,v in vals.items() if v is None]
  # Historical 2014–2016 lack classes16/17: keep null rather than invent zeros.
  must(missing==(['16','17'] if y<=2016 else []),'Annual class coverage changed')
  annual.append({'year':y,'kind':kind,'federal_06_cents':vals['06'],'external_16_cents':vals['16'],
   'funding_06_16_cents':vals['06']+vals['16'] if vals['06'] is not None and vals['16'] is not None else None,
   'sum_reported_funding_classes_cents':sum(v for cl,v in vals.items() if cl in ['06','16'] and v is not None),
   'administration_17_cents':vals['17'],'missing_source_classes':missing})
 # 2025 calendar and closing periods 13/14 together reconcile to annual 16.
 monthly_recon=[]
 for cl in ['06','16','17']:
  mv=sum(v for (y,mo,c),v in monthly.items() if y==2025 and c==cl);av=sums[(2025,'Erfolg',cl)]
  must(mv==av,'2025 monthly including closing periods differs from annual')
  monthly_recon.append({'funding_class':cl,'sum_all_booked_periods_cents':mv,'annual_cents':av,'difference_cents':mv-av})
 # Compare each legacy rounded UG independently to the exact CSV, not merely grand total.
 legacy=json.loads((ROOT/'werk-data/subsidy-federal-ug-2024.json').read_text());ug_recon=[]
 must({r['ug'] for r in legacy['rows']}=={u for y,u,c in ug if y==2024} and len(legacy['rows'])==24,'Incomplete legacy UG coverage')
 for r in legacy['rows']:
  actual=ug[(2024,r['ug'],'06')]+ug[(2024,r['ug'],'16')];published=Decimal(str(r['amount_mio']))*CENT_PER_MIO
  must(abs(Decimal(actual)-published)<=Decimal('0.05')*CENT_PER_MIO,'2024 UG differs beyond source rounding')
  ug_recon.append({'ug':r['ug'],'csv_funding_cents':actual,'published_rounded_mio':r['amount_mio'],'csv_less_published_cents':int(Decimal(actual)-published)})
 accounts=[]
 for key in sorted(annualkeys):
  d=account_details[key]
  if not any(y in d['source_records_by_year'] for y in range(2024,2029)):continue
  vals={str(y):account_sums[(key,y)] if y in d['source_records_by_year'] else None for y in range(2024,2029)}
  accounts.append({**{k:v for k,v in d.items() if k not in ['labels','themes','crisis_tags','source_records_by_year']},'labels':sorted(d['labels']),'themes':sorted(d['themes']),'crisis_tags':sorted(d['crisis_tags']),'amount_cents_by_year':vals,'source_records_by_year':{str(y):d['source_records_by_year'][y] for y in range(2024,2029) if y in d['source_records_by_year']},'delta_2028_bva_vs_2025_actual_cents':vals['2028']-vals['2025'] if vals['2028'] is not None and vals['2025'] is not None else None,'policy_review':'evaluation_open'})
 funding=[a for a in accounts if a['funding_class'] in ['06','16']]
 matched=[a for a in funding if a['amount_cents_by_year']['2025'] is not None and a['amount_cents_by_year']['2028'] is not None]
 only25=[a for a in funding if a['amount_cents_by_year']['2025'] is not None and a['amount_cents_by_year']['2028'] is None]
 only28=[a for a in funding if a['amount_cents_by_year']['2025'] is None and a['amount_cents_by_year']['2028'] is not None]
 bridge={'matched_account_count':len(matched),'matched_changes_cents':sum(a['delta_2028_bva_vs_2025_actual_cents'] for a in matched),'only_2025_count':len(only25),'only_2025_recorded_cents':sum(a['amount_cents_by_year']['2025'] for a in only25),'only_2028_count':len(only28),'only_2028_recorded_cents':sum(a['amount_cents_by_year']['2028'] for a in only28),'total_change_cents':annual[-1]['funding_06_16_cents']-annual[-4]['funding_06_16_cents'],'unmatched_rule':'Record absent in one period means unknown continuation/reclassification; not proven program launch/abolition. Missing values remain null.'}
 must(bridge['matched_changes_cents']+bridge['only_2028_recorded_cents']-bridge['only_2025_recorded_cents']==bridge['total_change_cents'],'Account bridge mismatch')
 top=sorted([a for a in funding if a['amount_cents_by_year']['2028'] is not None],key=lambda a:(-a['amount_cents_by_year']['2028'],a['account_code'],a['funding_class']))[:20]
 reductions=sorted(matched,key=lambda a:(a['delta_2028_bva_vs_2025_actual_cents'],a['account_code']))[:10]
 topids=lambda items:[a['account_code']+'|'+a['funding_class'] for a in items]
 result={'version':'2026-09-09-v1','status':'official_account_baseline_not_savings_estimate','source':spec['source'],'source_sha256':normalized['source_sha256'],'row_count':len(rows),'negative_row_count':sum(r['amount_cents']<0 for r in rows),'source_kind_counts':dict(Counter(r['kind'] for r in rows)),'dimension_count':len(dims),'all_year_account_class_count':len(annualkeys),'focus_account_class_count':len(accounts),'annual_series':annual,'monthly_totals':[{'year':y,'month_code':mo,'funding_class':cl,'amount_cents':v} for (y,mo,cl),v in sorted(monthly.items())],'monthly_2025_reconciliation':monthly_recon,'ug_2024_reconciliation':ug_recon,'ug_annual_series':[{'year':y,'ug':u,'funding_class':cl,'amount_cents':v} for (y,u,cl),v in sorted(ug.items())],'accounts_2024_2028':accounts,'account_bridge_2025_2028':bridge,'largest_2028_budget_accounts':topids(top),'largest_matched_reductions_2025_2028':topids(reductions),'top20_budget_2028_cents':sum(a['amount_cents_by_year']['2028'] for a in top),'verified_annual_werk_savings_cents':0,'program_mapping_complete':False,'cashflow_to_esvg_reconciled':False,'outcome_and_additionality_verified':False}
 return normalized,result

def report(r):
 fmt=lambda c:'–' if c is None else f'{c/CENT_PER_MIO:,.3f}'.replace(',','X').replace('.',',').replace('X','.')
 annual=r['annual_series'];by={a['account_code']+'|'+a['funding_class']:a for a in r['accounts_2024_2028']};bridge=r['account_bridge_2025_2028']
 lines=['# WERK – Förderkonten und Reformprüfung','', 'Stand: 9. September 2026. Die bisher offene BMF-CSV ist vollständig eingelesen. Sie enthält **15.802 Quelldatensätze** und wird bytegenau als komprimiertes Original archiviert. Beträge werden in ganzzahligen Eurocent gerechnet.','', '## Was die Jahresrechnung zeigt','', '| Jahr | Datenart | Fördermittel 06 + 16, Mio. € | Abwicklung 17, Mio. € |','|---|---|---:|---:|']
 for a in annual[-5:]:lines.append(f"| {a['year']} | {a['kind']} | {fmt(a['funding_06_16_cents'])} | {fmt(a['administration_17_cents'])} |")
 lines+=['',f"Von Ist 2025 zu BVA 2028 sinken die ausgewiesenen Fördermittel rechnerisch um **{fmt(-bridge['total_change_cents'])} Mio. Euro**. Das ist die Veränderung zwischen einer Ist-Auszahlung und einem bestehenden Budgetansatz. Sie ist weder garantierte Realisierung noch zusätzliche WERK-Einsparung.",'', 'Die 2025-Monatsbuchungen einschließlich der Abschlussperioden 13 und 14 stimmen für jede der drei Förderklassen centgenau mit dem Jahreserfolg überein. Sie werden nicht noch einmal zur Jahressumme addiert. Die 2026-Monatswerte enthalten Buchungsmonate 1 bis 8; sie werden weder als voller Jahreserfolg noch als gesichert vollständiger August interpretiert. Der Portalstand lautet August 2026; ein genauer Vollzugsstichtag ist im CSV nicht ausgewiesen.','', 'Alle 24 UG-Summen für 2024 stimmen innerhalb ihrer veröffentlichten Rundung auf 0,1 Mio. Euro mit dem bisherigen Förderungsbericht überein. Die Quelldatei enthält 730 negative Buchungen, die erhalten bleiben. Erstattungen und Korrekturen dürfen bei der Summenbildung nicht verschwinden.','', 'Für 2014–2016 enthält die Quelle keine Einträge der Klassen 16 und 17. Diese Komponenten und ein vollständig vergleichbarer 06+16-Gesamtwert bleiben unbekannt; die Summe der tatsächlich vorhandenen Förderzeilen wird separat erhalten. Daraus wird kein Nullaufwand für externe Abwicklung abgeleitet.','', 'Die ältere Taskforce-Angabe von 10,1 Mrd. Euro für 2026 wird als historische Referenz vom März 2026 weitergeführt. Ihre genaue Zeitstands-/Scope-Überleitung zum aktuellen CSV bleibt offen; die Differenz ist kein zusätzlicher WERK-Effekt.','', '## Große Positionen für die weitere Prüfung','', 'Die folgenden zehn Zeilen stammen aus den zwanzig größten Förderkonten im BVA 2028. Das ist eine Auswahl nach Betrag, keine Bewertung der Förderwirkung und keine Kürzungsliste. Ein Konto kann mehrere Programme enthalten; ein Programm kann mehrere Konten betreffen.','', '| Budgetkonto | Zweck laut Quelle | Ist 2025, Mio. € | BVA 2028, Mio. € | Differenz, Mio. € |','|---|---|---:|---:|---:|']
 for key in r['largest_2028_budget_accounts'][:10]:
  a=by[key];label=a['labels'][-1].split(' ',1)[1].replace('|','/');lines.append(f"| {a['account_code']} ({a['funding_class']}) | {label} | {fmt(a['amount_cents_by_year']['2025'])} | {fmt(a['amount_cents_by_year']['2028'])} | {fmt(a['delta_2028_bva_vs_2025_actual_cents'])} |")
 lines+=['',f"Die zwanzig größten Konten umfassen **{fmt(r['top20_budget_2028_cents'])} Mio. Euro** des BVA 2028. Die vollständige Liste einschließlich Quellenzeilen, Themen, Krisenkennzeichen und Beträgen 2024–2028 liegt in subsidy-federal-account-results.json.",'', '## Veränderungen richtig zuordnen','',f"Zwischen 2025 und 2028 sind {bridge['matched_account_count']} Förderkonto/Klassen-Kombinationen auf beiden Seiten vorhanden. Ihre Veränderungen summieren sich auf {fmt(bridge['matched_changes_cents'])} Mio. Euro. Nur 2028 verzeichnete Konten tragen {fmt(bridge['only_2028_recorded_cents'])} Mio. Euro bei; nur 2025 verzeichnete Konten enthalten {fmt(bridge['only_2025_recorded_cents'])} Mio. Euro. Zusammen ergibt das exakt die Gesamtveränderung.",'', 'Fehlende Konteneinträge bleiben unbekannt. Sie belegen weder das Ende einer Förderung noch einen neuen Förderzweck. Umgliederungen, geänderte Kontobezeichnungen, Auszahlungen alter Zusagen und Verlagerungen zu anderen Finanzierungsquellen müssen für jede Reform gesondert geklärt werden. Das amtliche Krisenkennzeichen bleibt erhalten, wird aber nicht als Beweis verwendet, dass alle übrigen Zahlungen dauerhaft sind.','', '## Nächste Reformentscheidungen','', 'Für jede priorisierte Position sind das zugehörige Programm und seine Rechtsgrundlage, bestehende Bindungen und Auszahlungspläne, EU-/RRF-/Kofinanzierung, Begünstigte, gemessene Wirkung, zusätzliche Verwaltungskosten und bereits beschlossene Regierungsänderungen zuzuordnen. Die neue Prüfliste subsidy-account-review-priorities.json enthält zwanzig konkrete Konten mit einer ersten fachlichen Prüffrage und hält diese Nachweisfelder offen. Erst dann lassen sich Beibehalten, Umgestalten, Zusammenlegen oder Auslaufenlassen seriös entscheiden.','', 'Abwicklungskosten sind eine eigene Kontenklasse und lassen sich ohne zusätzliche Zuordnung nicht einfach einem bestimmten Förderkonto zurechnen. Bundeszahlungen, Zahlungen externer Förderstellen und gesamtstaatliche ESVG-Förderungen werden nicht addiert. **Zusätzlich verifizierte WERK-Einsparung: weiterhin 0 Euro.**','', '## Quelle und Reproduktion','', '[BMF Förderdaten, Portalstand August 2026](https://www.bmf.gv.at/services/startseite-budget/Bundesbudget_und_oeffentliche_Finanzen/foerderungen.html). [Original-CSV]('+r['source']['url']+'). Historischer Gegencheck: Förderungsbericht 2024, UG-Tabelle.','', '`python3 scripts/werk-import-federal-subsidies.py` prüft Originalhash, Schema, alle Datensätze, Jahres-/Monatsabgleich und erzeugte Dateien. `python3 scripts/werk-federal-subsidies-negative-check.py` prüft davon unabhängig Rechenanker und Fehlerfälle. `--write` erzeugt die abgeleiteten Dateien erneut.','']
 return '\n'.join(lines)

def main():
 spec=json.loads(SPEC.read_text());raw=gzip.decompress(SOURCE.read_bytes())
 must(hashlib.sha256(raw).hexdigest()==spec['raw_sha256'],'Original source hash mismatch')
 must(spec['raw_sha256']=='eaf7a8436ae3289f3b232f72b3026a2dbbd83e683378d6bf0d3a3959e35235f1','Pinned original source changed')
 normalized,result=build(raw,spec)
 review=json.loads((ROOT/'werk-data/subsidy-account-review-priorities.json').read_text())
 must([p['account_key'] for p in review['priorities']]==result['largest_2028_budget_accounts'],'Review priorities stale')
 must(review['verified_annual_werk_savings_cents']==0,'Unverified review funding')
 by={a['account_code']+'|'+a['funding_class']:a for a in result['accounts_2024_2028']}
 for p in review['priorities']:
  must(p['budget_2028_cents']==by[p['account_key']]['amount_cents_by_year']['2028'],'Review source amount stale')
  must(p['review_status']=='evaluation_open' and p['decision'] is None and p['verified_additional_annual_net_savings_cents'] is None,'Unverified policy decision or savings')
  must(all(k in p for k in ['program_ids','legal_basis','committed_payment_schedule','eu_rrf_cofinancing_share','existing_government_measure_ids','outcome_evidence','incremental_administration_and_transition_costs','distribution_and_employment_effects']),'Missing review field')
 # Compact row arrays keep the full source normalization reviewable without expanding each scalar.
 norm=json.dumps({k:v for k,v in normalized.items() if k not in ['dimensions','records']},ensure_ascii=False,indent=2)[:-2]+',\n  "dimensions": [\n'+',\n'.join('    '+json.dumps(x,ensure_ascii=False,separators=(',',':')) for x in normalized['dimensions'])+'\n  ],\n  "records": [\n'+',\n'.join('    '+json.dumps(x,separators=(',',':')) for x in normalized['records'])+'\n  ]\n}\n'
 outputs={'werk-data/subsidy-federal-account-normalized.json':norm,'werk-data/subsidy-federal-account-results.json':json.dumps(result,ensure_ascii=False,indent=2)+'\n','WERK_FOERDERKONTEN_RECHNUNG.md':report(result)}
 for f,content in outputs.items():
  p=ROOT/f
  if '--write' in sys.argv:p.write_text(content)
  else:must(p.read_text()==content,f+' stale or corrupted')
 print(f"SUB001 source contract: {len(normalized['records'])} records, {len(normalized['dimensions'])} dimensions, {result['focus_account_class_count']} focus account/classes; 2025 monthly and 24 UG controls passed")
if __name__=='__main__':main()
