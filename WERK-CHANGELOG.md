# WERK Österreich – Website Changelog

## V71 – Datenarchitektur: Programm, BUD-01, Regierungsbaseline & Förderbaseline
- Acht verbindliche WERK-Säulen und zwölf politische Leitfelder konzeptionell sauber getrennt.
- Alle zwölf Leitfelder als vollständige Programmübersicht sichtbar; `policy-field-map.json` ordnet alle 41 Master-Analysebereiche genau einmal einem Leitfeld zu.
- Frontend-CI prüft 8/12-Trennung, 41/41-Abdeckung, JSON-/JS-Syntax, V71-Dateien und Manifestpfade.
- Beschlusskonformen BMF-Referenzpfad 2026–2031 in `budget-baseline-2026-2031.json` strukturiert: BIP, Einnahmen/Ausgaben, Zinsen, Gesamt-/Primärsaldo, Teilsektoren, Schuldenstand und Schuldenquote.
- Bestehende Saldo-Brücke mit amtlichem Referenzpfad synchronisiert; fehlende `bridge_to_target_surplus_eur_billion`-Werte ergänzt.
- GAP-FISC-01 geschlossen; GAP-FISC-02 bleibt wegen fehlender getrennt veröffentlichter Länder-/Gemeinde-Prognoseserie bis 2031 teilweise offen.
- `government-baseline-2025-2031.json` als kanonische Regierungsbaseline geschaffen. Unterschiedliche Scopes – ursprüngliches 2025-Paket, spätere Aktualisierung, neue Maßnahmen seit Juni 2025 und BBG – dürfen nicht additiv doppelt gezählt werden.
- Budgetdienst-Tabellen 11/12 vollständig in `government-new-measures-2026-2031.json` auf sechs Jahreswerte 2026–2031 normalisiert.
- Ursprüngliches Konsolidierungs-/Offensivpaket aus Budgetdienst-Tabellen 7/8 vollständig für den veröffentlichten Detailhorizont 2025–2029 in `government-package-2025-2029.json` normalisiert.
- Für 2030/2031 des ursprünglichen Pakets werden mangels veröffentlichter Einzelzeilen keine künstlichen 2029-Anteile extrapoliert; nur der veröffentlichte Aggregatwert bleibt zulässig.
- Eigenen `WERK Fiscal Data Contract` als separates CI eingeführt. Er prüft BUD-01-Identitäten, Regierungsaggregate, Teilsektoren, alte und neue Maßnahmenmatrizen sowie die Nicht-Extrapolationsregel unabhängig vom Frontend.
- SUB-01 mit `subsidy-baseline-architecture.json` neu strukturiert: BHG-Direktförderungen, ESVG D.3/D.7/D.9, EU/RRF-Durchläufe und Transparenzdatenbank werden getrennt normalisiert und anschließend reconciliert.
- 7,7 Mrd. € gestaltbares Bundes-Fördervolumen explizit als Prüfbereich, nicht als Einsparpotenzial klassifiziert; bestehende Regierungs-Einsparungsziele sind Baseline und kein WERK-Zusatzeffekt.
- Datenlückenregister auf Subgates erweitert: BASE-A/B/C geschlossen; BASE-Rechts-/Wirksamkeitsklassifikation und SUB-Rohdaten-/Programmnormalisierung bleiben offen.

## V71 – 12 Leitfelder vollständig & Layout-Härtung
- Neue V71-Frontend-Schicht für robuste Grids, Langtextumbrüche, Stagebars, Tabellen und mobile Typografie.
- Eigener `site-v71-loader.js` mit konsistenten V71-Cache-Keys, damit keine alten V70-Modulstände aus dem Browsercache übernommen werden.
- Stable Preview `index.html` auf `werk-v71.html` umgeschaltet; V70 bleibt als Rollback erhalten.
- Technischen Integritätscheck vom veralteten V69-Manifest auf das aktuelle `preview-manifest.json` umgestellt und V71-Pflichtdateien ergänzt.
- Harte V70-Ribbon-/Footer-Überschreibung im Release-Dashboard entfernt.
- Projekt- und Website-Status auf V71 fortgeschrieben; manuelle Mobil-, Tastatur- und Screenreader-Abnahme bleibt ausdrücklich offen.

## V54 – Entscheidungsakten & zentrale Rechtsquellen
- HTML, CSS, JavaScript und politische Daten modular getrennt.
- Reformseite auf Entscheidungsakten umgestellt: Problem, Rechnung, Recht, Ebene, Bürgerentscheid, KPI und Review.
- Such- und Filterlogik für Reformen.
- `legal.json` als zentrales Primärquellen-Verzeichnis.
- Reformbezogene Quellenzuordnung für Schulden, Regionalität, WERK VOTE und Bürgerlisten.
- Stable Preview `index.html` auf V54 geschaltet.

## V53 – Regional Explorer & Bürgerlisten-Register
- Neun Bundesländer dynamisch eingebunden.
- Regionale Ansicht mit Partnerlisten-, Reform- und Bürgerfragen-Zähler.
- `votes.json` mit klar als Demo/Reformziel gekennzeichneten Bürgerfragen.
- Beispiele Zuwanderung und Rauchen mit Rechtsvorbehalt integriert.
- `partners.json` mit zwei Partnerschaftsmodellen, Grundkodex und Aufnahmeprozess.
- Keine unbestätigte Bürgerliste wird als WERK-Partner behauptet.

## V52 – Datengetriebene Grundarchitektur
- `core.json`, `reforms.json` und `regions.json` von Layout getrennt.
- Reformkarten und Bundesländer dynamisch aus Daten erzeugt.

## V51 – Öffentliches Reformregister
- Erste echte aufklappbare Reformkarten.
- DEBT-01, DEBT-02, ADM-01, REG-01, DIR-01 und ORG-01 integriert.
- Kosten, Finanzierung, 1-/5-/10-Jahreswirkung, Zuständigkeit, Recht, KPI und Review sichtbar.

## V50 – WERK-Pakt
- Zielbild `Schuldenfrei. Fair. Gleichberechtigt. Sicher.` sichtbar gemacht.
- Acht verbindliche Säulen und Bürgerlisten-Grundkodex gestärkt.

## V49 – Neue Grundarchitektur
- `WERK Österreich` / `Erst rechnen. Dann entscheiden.` als feste Marken-Hierarchie.
- Regionalitätsmodell, WERK VOTE, Bürgerlisten und Transparenz als Hauptbereiche aufgebaut.

## Grundregel für alle folgenden Versionen
**Keine unbekannte Zahl als Fakt. Kein Reformziel als geltendes Recht. Keine Bürgerliste als Partner ohne Prüfung. Keine Demo-Abstimmung als echte Stimme. Keine Baseline-Maßnahme doppelt als WERK-Effekt. Kein Fördervolumen ohne Wirkungsevidenz als Einsparpotenzial.**
