# WERK – Zusätzlichen Steuer-Vollzug belastbar rechnen

Stand 8. September 2026. TAX-001 ergänzt TAX-02 um Quellenabgleich und eine überprüfbare Finanzierungsschwelle. Der Reformfokus auf Gewinnverlagerung bleibt bestehen. Die gesamte ABB-Tätigkeit belegt keinen spezifischen Verrechnungspreisertrag.

## Was die amtliche Quelle trägt

Der [ABB-Jahresbericht 2025](https://www.bmf.gv.at/dam/jcr:bb22ebfe-784d-47f5-9e82-23467916e588/Jahresbericht%20ABB%202025.pdf) unterscheidet auf Seite 38 fünf Ergebnisarten:

| Ergebnisart | Euro | Einordnung |
|---|---:|---|
| Verhängte Finanzstrafen | 44 925 494 | verhängt, Einzahlung nicht nachgewiesen |
| Steuerliche Mehrergebnisse der Fahndung | 84 323 122 | Mehrergebnis, Einzahlung nicht nachgewiesen |
| Beantragte Strafen im Beschäftigungsbereich | 20 932 646 | beantragt |
| Beantragte GSP-Strafen | 2 111 500 | beantragt |
| Eingebrachte Finanzstrafen durch Finanzpolizei | 1 758 972 | eingebrachte Teilkategorie |

Die rechnerische Summe ist **154 051 734 Euro**. Sie liegt nahe der [Presseangabe von mehr als 154 Mio. Euro](https://www.bmf.gv.at/presse/pressemeldungen/2026/februar-2026/abb-bilanz.html). Das ist eine arithmetische Beobachtung, kein Beleg für die Zusammensetzung der Pressezahl oder für überschneidungsfreie Steuereinzahlungen. Die 1,76 Mio. eingebrachter Geldstrafen sind eine Teilkategorie und könnten sich mit verhängten Strafen überschneiden. Sie sind weder das gesamte ABB-Cash-Ergebnis noch reine Steuereinnahmen.

Seiten 39–40: 884 ausgewiesene VZÄ; 79,543 Mio. Euro veranschlagt, 78,180 Mio. tatsächlich ausgezahlt. Die 7.319 Euro Einzahlungen des Verwaltungs-Detailbudgets messen nicht die gesamte Steuer-Einbringung. Plan-Personalkosten dürfen nicht als tatsächlicher Personalaufwand eingesetzt werden; Behördendurchschnitte identifizieren keine Kosten oder Erträge eines zusätzlichen Prüfers.

Auch die Quelle hat eine offene Rechendifferenz: Aus Ansatz minus Auszahlungen folgen **1 363 233 Euro** und **98,2862 %** Ausnutzung. Gedruckt sind 98,35 % und der fehlerhaft formatierte Zahlenwert „1.311.2365“. Die Originalangaben bleiben erhalten; die Differenz wird nicht künstlich verteilt. Daraus wird keine neue Einsparung gebucht.

## Welche Schwelle ein zusätzlicher Ausbau erreichen müsste

Bedingte Annahmen: jährlich 20 Mio. Euro zusätzliche Gesamtkosten (bisheriger TAX-02-Szenariowert), einmalig 10 Mio. zu Beginn; Nachforderungsaufbau 25/75/100 % in den ersten drei Jahren. Alle Kostenbeträge, Einbringungsquoten und Verzögerungen sind **unbelegte Sensitivitätsannahmen**, kein angenommener Ist-Ertrag. Die Quote umfasst endgültigen Bestand und Nettoeinbringung nach Erstattungen. Kosten umfassen auch zusätzlich ausgelöste Daten-, Rechtsmittel- und Einbringungsarbeit; ihre tatsächliche Höhe ist offen.

Bei einem Jahr Zahlungsverzögerung müssen innerhalb von fünf Jahren insgesamt 110 Mio. Euro Kosten gedeckt werden. Vier Nachforderungskohorten kommen bis dahin zur Zahlung; deren Rampenfaktoren summieren sich auf 3.

| Dauerhaft netto einbringbarer Anteil | Jährliche zusätzliche Nachforderung bei Vollausbau für laufende Kostendeckung | Für kumulative Kostendeckung bis Jahr 5 | Mit 3 % Abzinsung bis Jahr 5 |
|---|---:|---:|---:|
| 50 % | 40,00 Mio. € | 73,33 Mio. € | 76,01 Mio. € |
| 75 % | 26,67 Mio. € | 48,89 Mio. € | 50,67 Mio. € |
| 100 % | 20,00 Mio. € | 36,67 Mio. € | 38,01 Mio. € |

Formeln: laufende Schwelle = Jahreskosten / Quote. Kumulative Schwelle = (Startkosten + Jahre × Jahreskosten) / (Quote × Summe der bis dahin zahlenden Kohortenfaktoren). NPV diskontiert Jahresendkosten und -zahlungen, Startkosten liegen bei t0. Es gibt keine Anfangsforderungen oder erfundenen Restwerte; später eingehende Kohorten zählen erst im späteren Zeitraum. Null Einzahlungsfaktor wird als innerhalb des Horizonts nicht finanzierbar ausgewiesen, nicht als Nullbedarf.

**27 Kombinationen** für 1/5/10 Jahre, 50/75/100 % Quote und 0/1/2 Jahre Verzögerung sind vollständig in tax-enforcement-break-even-results.json gerechnet. Die frühere KÖSt-Prozentsensitivität bleibt separat bestehen; ein angenommener Aufkommensanteil ist kein beobachteter Mehrertrag.

## Konkreter Nachweis vor einer Finanzierungsbuchung

Die neue Messspezifikation fordert aggregierte Nachforderungskohorten mit Bescheid-, Rechtskraft-, Zahlungs-, Erstattungs- und Kostenbrücke. Ein vorab definierter, rechtlich zulässiger Vergleich ähnlicher Fälle oder gestaffelter Einführung muss zusätzliche Wirkung gegenüber der bestehenden Fallauswahl und dem Regierungsprogramm nachweisen. Unterschiede der Fallauswahl und Unsicherheit werden berichtet. Einmaleffekte und bloße Vorverlagerungen decken keine dauerhafte SV-Senkung.

P25-REV-FRAUD, REV-BBG-TAX und REV-OPEN-FRAUD3 bleiben Regierungsbaseline. Die breite Steuer-Maßnahmengruppe ist kein reines Vollzugsbudget; Aggregate und Teilmaßnahmen werden nicht addiert. Bereits erzieltes ABB-Ergebnis, Zoll-Mehrergebnisse, Geldstrafen und zusätzliche SV-Beiträge werden nicht als neue KÖSt-WERK-Einnahmen eingesetzt.

Die nächste fachliche Freigabe braucht tatsächliche zusätzliche Nettoeinzahlungen, bereinigte Überschneidungen, Rechtskraft-/Erstattungsnachweis, Vollkosten und wiederholte Wirkung über mehrere Kohorten. Der Pilot ist ein prüfbarer Vorschlag; seine Ausgaben sind noch nicht finanziert. **Verifiziertes zusätzliches Finanzierungsvolumen bleibt 0 Euro.** Das Ziel, Arbeitnehmerbeiträge mit tragfähigem Schuldenabbau schrittweise um relativ 50 % zu senken, bleibt bestehen; diese Rechnung aktiviert weder Tilgung noch Beitragssenkung.

## Reproduzieren

`node scripts/werk-tax-enforcement-contract.mjs` prüft Originalhash, festgehaltene Transkription, Regierungsbaseline, Annahmen und generierte Ergebnisse. `node scripts/werk-tax-enforcement-negative-check.mjs` prüft unabhängige Rechenanker, Zahlungszeitpunkte und Fehlerfälle. Änderungen an der Rechnung werden mit `--write` neu erzeugt.
