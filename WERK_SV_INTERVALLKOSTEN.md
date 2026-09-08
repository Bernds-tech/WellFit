# WERK — ALV-Kosten aus Intervallen und Beitragssummen

Stand: 8. September 2026. Der Rechner kann nun aus **Anzahl und Betragsintervall** belastbare Grenzen ableiten und mit einer passenden **Beitragsgrundlagensumme** exakte Modellkosten berechnen. 72 Intervallfälle, neun lückenlose Intervallraster und 18 summierte Beispieltabellen sind reproduzierbar hinterlegt.

Die Beispiele sind konstruierte Prüfbestände, keine österreichische Beschäftigtenstatistik. Berechnet wird ausschließlich der zusätzliche ALV-Beitragsausfall einer noch nicht beschlossenen Glättung. Die allgemeine 50%-Senkung von Arbeitnehmer-KV/PV/ALV ist separat zu finanzieren.

## Konkrete Rechnung

2026-Regeln, Glättung über 100 Euro, jeweils 1.000 rechtlich getrennte Bemessungsfälle. Alle Fälle sind reguläre Arbeitnehmerfälle mit identischer Grundlage für Satzwahl und Beitragsberechnung. Die Eingaben bezeichnen keine Anzahl von Personen.

| Verfügbare Information | Glättung ohne allgemeine Senkung | Glättung zusätzlich zur 50%-Senkung |
|---|---:|---:|
| Nur Anzahl; Grundlagen zwischen 1.500 und 3.500 € | 0,00 bis 24 982,51 € | 0,00 bis 12 491,26 € |
| Anzahl; Grundlagen zwischen 2.230 und 2.250 € | 16 687,50 bis 21 137,50 € | 8 343,75 bis 10 568,75 € |
| Zusätzlich: Grundlagensumme 2.240.000 € | 18 912,50 € exakt im Modell | 9 456,25 € exakt im Modell |

Die Summe bedeutet hier einen Mittelwert von 2.240 Euro innerhalb des vollständig linearen Intervalls. Es wird keine Gleichverteilung unterstellt. Jede beliebige Verteilung mit derselben Anzahl, demselben Intervall und derselben exakten Summe hat hier dieselben Modellkosten. Beiträge und Nettolohn sind verschiedene Größen; eine Steuer- oder Haushaltswirkung wird daraus noch nicht abgeleitet.

## Warum eine Intervallsumme nicht immer reicht

Im Übergang oberhalb einer Grenze t und bis t+w lautet der Zusatzrabatt pro Fall:

Rabatt = t × Satzdifferenz / 100 × (t+w−Beitragsgrundlage) / w × (1−allgemeine Senkung).

Für N Fälle mit Summe S innerhalb desselben linearen Abschnitts ersetzt **N×(t+w)−S** die Summe der einzelnen Klammern. So lässt sich der gesamte Bruttoausfall ohne Einzeldaten genau berechnen.

An der gesetzlichen Grenze selbst ist der Zusatzrabatt null; einen Cent darüber ist er positiv. Ein Intervall, das diese Stelle überschreitet, darf daher nicht einfach mit seinem Mittelwert berechnet werden. Für 1.000 Fälle zwischen 2.225 und 2.275 Euro ergibt selbst die bekannte Grundlagensumme 2.250.000 Euro in dieser Version nur die sichere Grenze aus Anzahl und Intervall. Die Summe wird dort ausdrücklich als ungenutzt gekennzeichnet; sie könnte zusätzliche Einschränkungen erlauben, identifiziert aber allein keine genaue Summe.

Ein direktes Gegenbeispiel: Zwei Fälle mit je 2.250 Euro und zwei Fälle mit 2.225 bzw. 2.275 Euro ergeben jeweils 4.500 Euro Grundlagensumme. Ihr Zusatzrabatt bei 100 Euro Übergang beträgt jedoch **33,375 Euro bzw. 11,125 Euro** vor Rundung. Bei allgemeiner Halbierung halbieren sich beide Beträge.

Die Cent-Raster trennen deshalb die erste Stelle oberhalb jeder gesetzlichen Grenze und das Ende des jeweiligen Übergangs. Jedes Raster deckt 1.500 bis 3.500 Euro genau einmal ab. Grenzen aus ganzen Intervallen sind ohne Zusatzannahmen scharf; bei ungenutzter Summe werden sie nur als sichere, möglicherweise weitere Grenzen bezeichnet. Untergrenzen werden nach unten, Obergrenzen nach oben gerundet; die Rechendatei enthält die exakten rationalen Werte. Abrechnungsrundungen bleiben ein gesonderter Implementierungsschritt.

## Amtlich belegte Abgrenzung der Fälle

Die [ÖGK-Regeln für mehrere Beschäftigungen](https://www.oegk.at/cdscontent/?contentid=10007.908591&portal=oegkdgportal) zeigen: Ein Tarifblock einer mBGM ist nicht automatisch ein eigenständiger Bemessungsfall. Ob Einkünfte zusammenzurechnen sind, hängt unter anderem davon ab, ob das Dienstverhältnis durchgehend oder eigenständig ist. Erst die rechtlich aufbereiteten Fälle dürfen in Intervalle eingehen.

Die [ÖGK-Sonderregeln](https://www.oegk.at/cdscontent/?contentid=10007.910372&portal=oegkdgportal) erfordern außerdem zwei getrennte Merkmale: die Grundlage für die Wahl des ALV-Satzes und die tatsächlich belastete Grundlage. Bei Altersteilzeit können diese auseinanderfallen. In bestimmten Fällen trägt der Arbeitgeber gesetzlich auch den Arbeitnehmeranteil. Ein Beitragsausfall ist dann nicht automatisch ein gleich hoher Vorteil für Beschäftigte.

Der Standardrechner weist daher Lehrlings-, abweichende Bemessungs-, Arbeitgebertragungs- und andere nicht geklärte Sonderfälle zurück. Das ist eine klar begrenzte Standardrechnung; diese Fallgruppen bleiben für die Gesamtbewertung zusätzlich aufzuarbeiten.

## Konkrete Spezifikation für die fehlenden Verwaltungsdaten

Die maschinenlesbare Spezifikation [employee-alv-interval-spec.json](werk-data/employee-alv-interval-spec.json) verlangt ausschließlich aggregierte Tabellen:

| Merkmal | Benötigte Information |
|---|---|
| Zeitraum und Rechtsstand | Beitragsmonat/-jahr; 2027 Bestands- und Neuverhältnisse getrennt |
| Einheit | Rechtlich getrennte Bemessungsfälle je laufendem Bezug bzw. Sonderzahlungszeitraum |
| Geltungsbereich | Beschäftigtengruppe, Ausnahmegrund, tatsächlicher Träger des Arbeitnehmeranteils |
| Zwei Grundlagen | Grundlage der Satzwahl und Grundlage des verrechneten Beitrags; Abweichungen separat |
| Intervallwerte | Inklusive Cent-Grenzen, genaue Anzahl, exakte Summe der belasteten Grundlagen oder ausdrücklich unbekannt |
| Beitragsabgleich | Vorgeschriebene Arbeitnehmer-/Arbeitgeber-ALV, getrennte Zahlungseingänge soweit vorhanden, Korrekturen und Erstattungen |
| Vollständigkeit | Eindeutige, überschneidungsfreie Gruppen; Summenabgleich; unterdrückte oder fehlende Werte sichtbar |

Die ausführliche JSON-Spezifikation und die neun generierten Intervallraster sind ein vorbereiteter Datenbedarf; es wurde keine Anfrage versandt. Für amtliche Daten ist vor Import zusätzlich ein geprüfter Quellen-/Einheitenadapter erforderlich. Die aktuelle ausführbare Schnittstelle akzeptiert ausdrücklich bedingte Szenarien. Eine bekannte Null wird akzeptiert; unbekannte oder unterdrückte Anzahlen werden nicht als null Euro gerechnet. Gerundete veröffentlichte Summen dürfen nicht als exakte Cent-Summen eingegeben werden.

Die gezielte Suche in öffentlich zugänglichen Parlaments- und Sozialversicherungsunterlagen hat die benötigte vergleichbare Monatstabelle nicht geliefert. Das beweist nicht, dass die Verwaltungsdaten nicht existieren. Die [bereits importierten amtlichen Jahresquartile](WERK_SV_VERTEILUNG_KOSTENGRENZEN.md) ersetzen sie nicht.

## Einordnung in die gesamte SV-Reform

Die 2027-Bestands-/Neuverhältnis-Szenarien bleiben mit dem vorläufigen ÖGK-Wertestand getrennt; es entsteht keine 2027-Nettoprognose. Die 31,95 Mrd. Euro einbehaltenen Beiträge sind weiterhin bestehende Einnahmen mit breiterem Geltungsbereich, kein zusätzlich verfügbarer Schuldentilgungsbetrag. Bereits gebundene Zinsersparnisse sind nicht erneut für Glättung oder Beitragshalbierung verfügbar.

Dein Ziel bleibt: Arbeitnehmer-KV/PV/ALV mit finanziertem Schuldenabbau schrittweise relativ um bis zu 50 % senken, bei erhaltenen Ansprüchen und tragfähiger Ersatzfinanzierung. Der nationale Brutto- und Nettofinanzierungsbedarf bleibt offen; die verifizierte zusätzliche Finanzierung beträgt **0 Euro**. Die Glättung ist ein ergänzender Gestaltungskandidat, kein bereits beschlossenes Element oder belegter Beschäftigungseffekt.

Reproduktion: `node scripts/werk-alv-interval-contract.mjs` und `node scripts/werk-alv-interval-negative-check.mjs`. Daten, Bibliothek und Bericht sind in FISCAL-DATA integriert. Zurück zur [Gesamtrechnung](WERK_GESAMTRECHNUNG.md).
