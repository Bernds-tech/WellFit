# WERK — Mehr Brutto, zeitweise weniger Netto: ALV-Schwellen 2026

Stand: 7. September 2026. Die schrittweise relative Halbierung der Arbeitnehmer-KV/PV/ALV bleibt das WERK-Ziel bei gesicherter Finanzierung und unveränderten Leistungsansprüchen.

**Eine Beitragssenkung allein beseitigt nicht jede Schwelle, an der Mehrverdienst zunächst weniger Netto bringt.** Der vorhandene 2026-Regelkern wurde jetzt für drei ALV-Grenzen, zwei Regionen und vier Entlastungsstufen durchgerechnet: 24 Schwellenfälle und 192 Vergleiche kleiner Gehaltserhöhungen.

Die [ÖGK-Regeln 2026](https://www.oegk.at/cdscontent/?contentid=10007.904620&portal=oegkdgportal) sehen abhängig vom Monatsentgelt 0 %, 1 %, 2 % oder 2,95 % Arbeitnehmer-ALV vor. Der höhere Satz erfasst beim Grenzübertritt die gesamte Beitragsgrundlage. Laufende Bezüge und Sonderzahlungen werden getrennt beurteilt. Diese Berechnung verwendet ausschließlich diese 2026-Regeln.

## Ergebnis für den Standardfall außerhalb Wiens

Jeder Fall vergleicht zwei ganzjährige Gehälter: zwölf laufende Bezüge und zwei gleich hohe Sonderzahlungen. „Ein Cent mehr“ bedeutet einen Cent mehr bei jedem der 14 Bezüge; der ausgewiesene Verlust betrifft das gesamte Jahr nach Standard-Veranlagung. Es handelt sich nicht um die Wirkung einer einmaligen Gehaltserhöhung am Jahresende.

| Monatsbrutto an der Schwelle | Jahresnettoverlust bei +0,01 € ohne Reform | Monatsbrutto zur Wiederherstellung des Jahresnettos | Jahresnettoverlust bei +0,01 € mit 50 % weniger KV/PV/ALV | Monatsbrutto zur Wiederherstellung mit Reform |
|---|---:|---:|---:|---:|
| 2 225,00 € | 208,20 € | 2 251,47 € | 104,05 € | 2 237,14 € |
| 2 427,00 € | 227,11 € | 2 456,22 € | 113,51 € | 2 440,32 € |
| 2 630,00 € | 233,81 € | 2 660,43 € | 116,86 € | 2 643,78 € |

Die 50%-Spalte vergleicht innerhalb desselben Reformzustands das Gehalt an und knapp über der Grenze. Sie zeigt keinen Verlust durch die Reform gegenüber dem heutigen Netto: Die Reform erhöht im gerechneten Standardfall das Netto, während ein kleiner Bruttoschritt innerhalb des Reformtarifs weiterhin eine kleinere Nettoeinbuße auslösen kann.

Das erforderliche Monatsbrutto wird auf einem Cent-Raster gesucht. Der unmittelbar vorherige Cent muss das alte Jahresnetto noch unterschreiten. Die Steuer- und SV-Rechnung selbst erfolgt wie im bisherigen Regelkern vor Lohnzettel-Cent- und Bescheid-Euro-Rundung; die ausgegebenen Centbeträge sind Modellwerte, keine verbindlichen Lohnabrechnungen.

## Konsequenz für die weitere Reformrechnung

Eine gleichmäßige relative Beitragssenkung verkleinert die Sprünge. Solange der Beitragssatz beim Grenzübertritt auf das gesamte Entgelt angewandt wird, bleiben sie bestehen. Als nächster Gestaltungskandidat kommt ein stetiger Übergang der Beitragsbeträge in Betracht. Dafür müssten Verlauf, Verteilung und Einnahmenwirkung gesondert gerechnet werden; hier wird noch keine solche Regel beschlossen oder als finanziert ausgewiesen.

Familienleistungen, Wohnbeihilfen, Betreuungskosten, Pendeln, andere Absetzbeträge und einzelne Beschäftigungsgruppen sind nicht enthalten. Die Ergebnisse belegen weder individuelle Arbeitsaufnahmeentscheidungen noch eine Beschäftigungswirkung. Die tatsächliche ALV-Arbeitnehmer-Istsumme bleibt nach der Recherche getrennt offen; die [ESSOSS-Beitragsbasis](WERK_SV_BEITRAGSBASIS.md) verwendet weiterhin eine ausdrücklich gekennzeichnete statistische Aufteilung.

Ab 2027 ist die bereits in der Regierungsbaseline verzeichnete gesetzliche Übergangsregel REV-ALV-DN gesondert zu modellieren. Die hier gerechneten Schwellen sind kein Zukunftstarif. Prognostizierte Regierungseinnahmen sind außerdem keine zusätzlichen WERK-Einnahmen.

Reproduktion: `node scripts/werk-alv-threshold-contract.mjs`; Generierung mit `--write`. Quellen und verwendete Regeldateien sind gehasht. Aktuelle Finanzierungsgutschrift: **0 Euro**.
