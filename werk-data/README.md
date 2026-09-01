# WERK Österreich – Website- und Regierungsregister-Datenmodell

**Marke:** WERK Österreich  
**Haupttagline:** Erst rechnen. Dann entscheiden.

Die Website trennt politische Inhalte, Primärdaten, Rechtsquellen und Layout voneinander. Reformen werden als nachvollziehbare Entscheidungsakten gepflegt und nicht als unprüfbare Werbetexte.

## Zentrale Dateien

- `core.json` – verbindlicher WERK-Kern, Säulen und Entscheidungslogik
- `reforms.json` – Reformregister mit Problem, Ziel, Rechnung, Recht, KPI und Review
- `priorities.json` – Umsetzungsreihenfolge: Vorbereitung, erste 100 Tage, Legislatur, langfristiger Staatsumbau
- `regions.json` – Bund/Land/Gemeinde-Modell sowie neun Bundesländer
- `votes.json` – WERK-VOTE-Frageakten, Pro/Contra, Budget-/Rechtsstatus und Guardrails
- `partners.json` – Bürgerlisten-Pakt, Aufnahmeprozess und später verifizierte Partnerprofile
- `legal.json` – zentrale Rechtsquellen
- `source-audit.json` – Prüftag, Datenstand, Aktualitätsstatus und nächste Prüfung zentraler Quellen
- `corrections.json` – dokumentierte Korrekturen früherer Projektannahmen nach neuer Daten-/Rechtslage
- `publication-gates.json` – Freigabegates vor öffentlicher Veröffentlichung
- `project-status.json` – interne Arbeitsreifegrade
- `legal-pages.json` – Gerüst für Impressum/Datenschutz/Betreiberangaben
- `qa.json` – manuelle Mobil-, Tastatur- und Screenreader-Abnahme

## Veröffentlichungsregeln

1. Keine unbekannte Zahl als Fakt veröffentlichen.
2. Ausgangsdaten mit Datum und Primärquelle versehen.
3. Politisches Ziel, Szenario, geltendes Recht und Prognose sichtbar unterscheiden.
4. Jede große Reform enthält mindestens Problem, Ziel, Transformationskosten, laufende Kosten, Finanzierung, 1-/5-/10-Jahreswirkung, heutige und gewünschte Zuständigkeit, Rechtsstatus, Bürgerentscheid, KPI und Review.
5. Regionale Varianten nur dort ausweisen, wo sie rechtlich tatsächlich möglich oder ausdrücklich als Reformziel gekennzeichnet sind.
6. `WERK VOTE` nie als amtliches Verfahren darstellen, solange Rechtsgrundlage und technische Freigabe fehlen.
7. Partnerlisten dürfen regionale Programme ergänzen; der WERK-Grundkodex bleibt verbindlich.
8. Wenn eine frühere Projektannahme durch neue Primärdaten widerlegt oder überholt wird, wird sie korrigiert und im Korrekturprotokoll dokumentiert.
9. Keine Einsparung wird doppelt gezählt. Keine hypothetische Mehreinnahme finanziert eine Maßnahme, bevor die Rechnung belastbar ist.
10. Entscheidung und Finanzierung sollen möglichst auf derselben staatlichen Ebene liegen.

## Aktueller Registerstand – 01.09.2026

Das Reformregister umfasst 14 Entscheidungsakten. Neben Schuldenmanagement, Verwaltung, Regionalität, direkter Demokratie und Bürgerlisten sind nun Budgetpfad, 10-Mrd.-Tilgungsziel, Förderreform, Bundesbeteiligungen, RRF/EU-Mittel, Unternehmenssteuer-Neubewertung, Gewinnverlagerungsprüfung, Digital-Governance und Glücksspiel-Systemprüfung strukturiert erfasst.

Zwei ältere Annahmen wurden ausdrücklich korrigiert:

- Rund 14,25 Mrd. € im Beteiligungsbericht sind **Auszahlungen an Beteiligungen**, nicht ein Dividendeneinnahmen-Ziel des Bundes.
- Die frühere 33-%-KÖSt-Idee wird nach der Rechtsänderung 2026 **nicht als fertige WERK-Forderung** geführt; zuerst folgt eine aktualisierte Aufkommens-, Verteilungs-, Investitions- und Standortrechnung.

## Ausbaupfad

- Reformregister vollständig auf das gesamte Österreich-Sanierungsprogramm ausweiten.
- Prioritäre Reformen finanziell mit mindestens drei Szenarien rechnen.
- Jede Reform mit konkreten Rechtsquellen und Zuständigkeitsprüfung schließen.
- Aus `priorities.json` ein belastbares 100-Tage- und Legislaturprogramm ableiten.
- Erst danach Bürgerprogramm, Kurzfassung und öffentliche Kampagnendarstellung finalisieren.

**Leitregel:** Erst rechnen. Dann entscheiden.