# WERK Österreich – Website-Datenmodell

**Marke:** WERK Österreich  
**Haupttagline:** Erst rechnen. Dann entscheiden.

Diese Dateien trennen politische Inhalte, Datenstände und Website-Layout voneinander. Ziel ist, dass Reformen später nicht als hart codierte Werbetexte gepflegt werden, sondern als nachvollziehbare Datensätze mit Reife-, Rechts- und Berechnungsstatus.

## Dateien

- `core.json` – verbindlicher WERK-Kern, Säulen und Entscheidungslogik
- `reforms.json` – öffentliches Reformregister und Pflichtfelder
- `regions.json` – Bund/Land/Gemeinde-Modell sowie neun Bundesländer

## Veröffentlichungsregeln

1. Keine unbekannte Zahl als Fakt veröffentlichen.
2. Ausgangsdaten mit Datum und Quelle versehen.
3. Politisches Ziel, Szenario und geltendes Recht sichtbar unterscheiden.
4. Jede große Reform enthält mindestens Problem, Ziel, Transformationskosten, laufende Kosten, Finanzierung, 1-/5-/10-Jahreswirkung, heutige und gewünschte Zuständigkeit, Rechtsstatus, Bürgerentscheid, KPI und Review.
5. Regionale Varianten nur dort ausweisen, wo sie rechtlich tatsächlich möglich oder ausdrücklich als Reformziel gekennzeichnet sind.
6. `WERK VOTE` nie als amtliches Verfahren darstellen, solange dafür keine entsprechende Rechtsgrundlage und technische Freigabe bestehen.
7. Partnerlisten dürfen regionale Programme ergänzen; der WERK-Grundkodex bleibt verbindlich.

## Nächster Website-Ausbau

- V52: HTML lädt Reformkarten aus `reforms.json` statt aus hart codiertem Text.
- V53: Bundesland-Ansicht aus `regions.json` mit regionalen Reformen, Bürgerlisten und Abstimmungen.
- V54: Entscheidungsakte je Reform (`Problem → Rechnung → Recht → Entscheidung → KPI → Review`).
- V55: Quellen-/Datenstand-Komponente mit Aktualitätsdatum und Prüfflag.
- V56: WERK-VOTE-Demo mit neutraler Frageakte, Argumenten pro/contra und Rechts-/Budgetcheck.
- V57: Bürgerlisten-Profilseiten mit lokalem Programm plus sichtbar getrenntem WERK-Kern.
- V58: barrierefreie/mobile Abnahme und Druckansicht.
- V59: Performance, SEO, strukturierte Metadaten und öffentliche Quellenprüfung.
- V60: Publikationskandidat nach juristischer, finanzieller und redaktioneller Abnahme.
