# WERK — Beitragsverteilung und belastbare Kostengrenzen

Stand: 8. September 2026. **1.161 amtliche Verteilungswerte ergänzt; eine nationale Kostensumme ist damit noch nicht identifiziert.** Zusätzlich sind 18 bedingte Kostengrenzen und 18 Gegenbeispiele zur Verwendung von Jahresdurchschnitten berechnet.

## Neue amtliche Datenbasis

Das [Statistische Handbuch 2025 des Dachverbandes](https://www.sozialversicherung.at/cdscontent/load?contentid=10008.799419&version=1762761801) enthält für 2024 neun Tabellen mit 129 Zeilen und 1.161 Quartilswerten: Wirtschaftszweige, Bundesländer und Altersgruppen, jeweils für Arbeiter und Angestellte zusammen sowie getrennt, und nach Geschlecht. Lehrlinge sind ausgeschlossen. Jede Zahlenzeile ist auf Tabellenblatt und Zellbereich der gespeicherten Originaldatei zurückführbar; die mehrfach veröffentlichten Österreich-Gesamtwerte stimmen überein.

Die Quelle verwendet personenbezogene Jahresdaten, normiert auf 30 Versicherungstage, einschließlich Sonderzahlungen. Die Werte sind somit keine Verteilung tatsächlich einzelner Monatsabrechnungen. Mediane der Gruppen dürfen weder addiert noch ohne Gruppengrößen zu einem Gesamtmedian gemittelt werden.

| Gruppe, Österreich insgesamt | Unteres Quartil | Median | Oberes Quartil |
|---|---:|---:|---:|
| Arbeiter und Angestellte | 2 444,00 € | 3 501,00 € | 4 845,00 € |
| Arbeiter | 2 249,00 € | 3 084,00 € | 3 956,00 € |
| Angestellte | 2 643,00 € | 3 940,00 € | 5 646,00 € |

Die genannten Werte dürfen weder unmittelbar mit den 2026-ALV-Monatsgrenzen verglichen noch durch eine pauschale Umrechnung in eine tatsächliche Zahl Betroffener verwandelt werden. Die Datenbasis ist historisch 2024; eine Fortschreibung auf 2026 oder 2027 ist nicht belegt.

## Warum derselbe Jahresdurchschnitt unterschiedliche Reformkosten ergibt

Ein konstruiertes Gegenbeispiel, keine beobachteten Beschäftigten: Beide Personen haben 360 Versicherungstage, ein Dienstverhältnis, 31.500 Euro Jahresbrutto und denselben normierten Monatswert von 2.625 Euro. Beide erhalten zwei Sonderzahlungen von je 2.250 Euro in getrennten Beitragszeiträumen. Person A erhält zwölfmal 2.250 Euro laufend; Person B sechsmal 2.200 und sechsmal 2.300 Euro.

Für die 2026-Glättung über 100 Euro, ohne allgemeine Beitragshalbierung:

| Zahlungsprofil | Jährlich entfallende ALV-Beiträge durch Glättung |
|---|---:|
| A: gleichmäßiges Monatsgehalt | 233,63 € |
| B: wechselndes Monatsgehalt | 66,75 € |

Damit ist rechnerisch belegt: Selbst ein vollständiger personenbezogener Jahresdurchschnitt würde diese beiden Kosten nicht unterscheiden. Quartile können es erst recht nicht. Die Steuer-/Nettowirkung der wechselnden Gehälter wird hier nicht mit der bisherigen Funktion für konstante Gehälter berechnet.

## Was sich trotzdem verbindlich begrenzen lässt

Für eine bekannte Zahl M geeigneter, einzeln abzurechnender Zahlungen ist die zusätzliche Bruttoentlastung höchstens M mal der größte Einzelrabatt. Die Rechnung gilt innerhalb des geprüften Standardbereichs von 1.500 bis 3.500 Euro je Zahlung und vor Abrechnungsrundung. Der höchste Rabatt liegt beim ersten Cent oberhalb einer Grenze; seine Formel lautet:

Maximum je Zahlung = max über alle Grenzen { t × (r₁−r₀) × (1−0,01/w) × (1−Entlastungsquote) }.

Es wird das Maximum verwendet, nicht die Summe der drei Grenzrabatte: Eine Zahlung kann nur in einem der getrennten Übergangsbereiche liegen. Die Untergrenze ist null, weil ohne Verteilungsinformation sämtliche Zahlungen außerhalb der Übergangsbereiche liegen können. Diese Grenzen sind bedingte mathematische Grenzen, keine Schätzung und kein statistisches Konfidenzintervall.

| 2026, Übergang über 100 € | Höchstens pro Zahlung | Höchstens für 14.000 Zahlungen pro Jahr |
|---|---:|---:|
| Ohne allgemeine Beitragshalbierung | 24,99 € | 349 755,03 € |
| Zusätzlich zu 50 % weniger KV/PV/ALV | 12,50 € | 174 877,52 € |

14.000 Zahlungen entsprechen nur im ausdrücklich angenommenen Modell 1.000 ganzjährig Beschäftigten mit genau 14 getrennten Zahlungen. In echten Daten sind Personen, Beschäftigungsverhältnisse, laufende Monatsabrechnungen und Sonderzahlungs-Beitragszeiträume verschiedene Zähleinheiten. Gemeint ist jeweils eine getrennt zu beurteilende Beitragsgrundlage, kein einzelner Banktransfer; zusammengehörige Sonderzahlungen im selben Beitragszeitraum sind entsprechend zusammenzufassen. Die Rechnung setzt keine tatsächliche Betroffenenzahl ein. Die Tabellenobergrenzen sind vorsichtig nach oben auf Cent gerundet; die JSON-Datei enthält die genaueren Modellwerte.

Die Grenze neben einer Beitragshalbierung umfasst ausschließlich die zusätzliche Glättung. Die Finanzierung der 50%-Senkung selbst kommt hinzu. Die ALV braucht bei unveränderten Leistungen Ersatz für die gesamten entfallenden Beiträge; individuelle Steuerrückflüsse, Verwaltungskosten und Verhaltenswirkungen sind keine hier belegte nationale Gegenfinanzierung. Bereits zugeteilte Zinsersparnisse dürfen nicht nochmals verwendet werden.

Die JSON-Ergebnisse enthalten dieselben Grenzen auch für 50 und 150 Euro sowie die beiden getrennten vorläufigen [2027-Referenzgruppen](WERK_SV_STETIGE_BEITRAEGE.md). Diese sind weiterhin Beitragsszenarien, keine 2027-Nettolohnprognose.

## Präziser nächster Datenbedarf

Benötigt werden Häufigkeiten der tatsächlich getrennt abzurechnenden laufenden und besonderen Beitragsgrundlagen, mit Beitragszeitraum, gültigem ALV-Satz, Beschäftigungsgruppe und künftig Bestands-/Neuverhältnis. Für die schmalen Übergänge braucht es feine Betragsintervalle oder ausreichende Intervallsummen; Jahresbruttogruppen und Quartile genügen nicht. Region und Haushaltsmerkmale werden zusätzlich für Steuer- und Nettoverteilung benötigt.

Die öffentliche Dashboard-Darstellung blieb beim Abruf an einem technischen Ladefehler hängen. Die Original-Excel-Tabellen wurden unabhängig über den amtlichen Handbuchdownload bezogen. Es wurden keine personenbezogenen Daten abgerufen und keine Datenanfrage an Dritte versandt.

Gesamtkosten Österreich: **offen**. Verifizierte Finanzierungsgutschrift: **0 Euro**. Alle drei Artefakte erweitern die [Gesamtrechnung](WERK_GESAMTRECHNUNG.md), ohne die bisherigen Schulden-/Zinsszenarien umzubasieren.

Reproduktion: `python3 scripts/werk-import-contribution-distribution.py`, `node scripts/werk-alv-cost-bounds-contract.mjs` und beide zugehörigen Negative-Checks. Generierung jeweils mit `--write`; Originaldatei, Quelldaten und Rechenbibliotheken sind gehasht.
