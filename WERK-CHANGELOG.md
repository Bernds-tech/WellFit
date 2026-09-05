# WERK Österreich – Website Changelog

## V71 – 12 Leitfelder vollständig & Layout-Härtung
- Acht verbindliche WERK-Säulen und zwölf politische Leitfelder konzeptionell sauber getrennt.
- Alle zwölf Leitfelder als eigene vollständige Programmübersicht auf der Startseite sichtbar; kein Leitfeld wird aus Platzgründen ausgeblendet.
- `core.json` um die strukturierte `policy_fields`-Ebene erweitert, ohne den verbindlichen Acht-Säulen-Kern zu verändern.
- Neue V71-Frontend-Schicht für robuste Grids, Langtextumbrüche, Stagebars, Tabellen und mobile Typografie.
- Eigener `site-v71-loader.js` mit konsistenten V71-Cache-Keys, damit keine alten V70-Modulstände aus dem Browsercache übernommen werden.
- Stable Preview `index.html` auf `werk-v71.html` umgeschaltet; V70 bleibt als Rollback erhalten.
- Technischen Integritätscheck vom veralteten V69-Manifest auf das aktuelle `preview-manifest.json` umgestellt und V71-Pflichtdateien ergänzt.
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
**Keine unbekannte Zahl als Fakt. Kein Reformziel als geltendes Recht. Keine Bürgerliste als Partner ohne Prüfung. Keine Demo-Abstimmung als echte Stimme.**
