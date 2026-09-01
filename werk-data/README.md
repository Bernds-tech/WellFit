# WERK Österreich – Website-Datenmodell

**Marke:** WERK Österreich  
**Haupttagline:** Erst rechnen. Dann entscheiden.

Diese Dateien trennen politische Inhalte, Datenstände und Website-Layout voneinander. Reformen, Bürgerfragen, Regionen und Partnerlisten sollen nicht als schwer prüfbare Werbetexte gepflegt werden, sondern als nachvollziehbare Datensätze mit Reife-, Rechts-, Quellen- und Berechnungsstatus.

## Dateien

- `core.json` – verbindlicher WERK-Kern, Säulen und Entscheidungslogik
- `reforms.json` – öffentliches Reformregister und Pflichtfelder
- `regions.json` – Bund/Land/Gemeinde-Modell, neun Bundesländer und Zentralisierungscheck
- `votes.json` – WERK-VOTE-Demomodelle, Abstimmungs-Guardrails und Rechtsvorbehalte
- `partners.json` – Bürgerlisten-Pakt, Aufnahmeprozess und öffentliches Partnerregister
- `legal.json` – zentrale Primärquellen für Verfassung, Parteienrecht, E-Voting, TNRSG und Schuldenstand

## Veröffentlichungsregeln

1. Keine unbekannte Zahl als Fakt veröffentlichen.
2. Ausgangsdaten mit Datum und Primärquelle versehen.
3. Politisches Ziel, Szenario und geltendes Recht sichtbar unterscheiden.
4. Jede große Reform enthält mindestens Problem, Ziel, Transformationskosten, laufende Kosten, Finanzierung, 1-/5-/10-Jahreswirkung, heutige und gewünschte Zuständigkeit, Rechtsstatus, Bürgerentscheid, KPI und Review.
5. Regionale Varianten nur dort ausweisen, wo sie rechtlich tatsächlich möglich oder ausdrücklich als Reformziel gekennzeichnet sind.
6. `WERK VOTE` nie als amtliches Verfahren darstellen, solange dafür keine entsprechende Rechtsgrundlage und technische Freigabe bestehen.
7. Partnerlisten dürfen regionale Programme ergänzen; der WERK-Grundkodex bleibt verbindlich.
8. Keine Bürgerliste als WERK-Partner veröffentlichen, bevor Identität/Rechtsform, Grundkodex, Compliance und rechtliche Einordnung geprüft wurden.
9. Rechtsquellen möglichst zentral aus `legal.json` beziehen, damit dieselbe Rechtslage nicht widersprüchlich auf mehreren Seiten gepflegt wird.
10. Beispielabstimmungen müssen eindeutig als Demo gekennzeichnet sein und dürfen keine echte Stimme speichern.

## Stand

- **V52:** Datengetriebene Grundarchitektur aus `core.json`, `reforms.json` und `regions.json`.
- **V53:** Regional Explorer, Bürgerfragen aus `votes.json`, Partnerregister aus `partners.json`, rechtliche Guardrails und neun Bundesländer dynamisch eingebunden.

## Nächster Website-Ausbau

- **V54:** Entscheidungsakte je Reform (`Problem → Rechnung → Recht → Entscheidung → KPI → Review`) plus zentrale Rechtsquellen aus `legal.json`.
- **V55:** Quellen-/Datenstand-Komponente mit Aktualitätsdatum, Prüfflag und Änderungsverlauf.
- **V56:** WERK-VOTE-Demo mit neutraler Frageakte, Argumenten pro/contra, Rechts-/Budgetcheck und modellierter Doppelmehrheit.
- **V57:** Bürgerlisten-Profilseiten mit lokalem Programm plus sichtbar getrenntem verbindlichem WERK-Kern.
- **V58:** Barrierefreie/mobile Abnahme und Druckansicht.
- **V59:** Performance, SEO, strukturierte Metadaten und öffentliche Quellenprüfung.
- **V60:** Publikationskandidat nach juristischer, finanzieller und redaktioneller Abnahme.
