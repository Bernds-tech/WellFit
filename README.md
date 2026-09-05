# WellFit – Landingpage & visuelle Produktwelt

Dieses Repository enthält ausschließlich die öffentliche WellFit-Landingpage und ihre visuelle Designwelt. Es ist der Arbeitsbereich für Layout, Grafiken, Inhalte, responsive Darstellung und Frontend-Interaktionen.

Aktuelle Referenz: [wellfit-bewegt.bernd-guggenberger.chatgpt.site](https://wellfit-bewegt.bernd-guggenberger.chatgpt.site)

## Klare Projektgrenze

Dieses Repository enthält **nicht** die eigentliche WellFit-Anwendung und **keine** produktive Geschäftslogik.

Nicht enthalten sind insbesondere:

- Benutzerkonten, Anmeldung oder Rollen
- Firebase, Firestore, Cloud Functions oder Datenmigrationen
- produktive Missionen, XP-, WFXP-, WFP- oder Token-Konten
- Buddy-, Checkpoint- oder Belohnungslogik
- Kamera-, Standort-, AR- oder Gesundheitsdatenverarbeitung
- Admin-, Partner- oder Zahlungsfunktionen

Die bereits begonnene Anwendung und ihre technische Autorität bleiben im getrennten Repository `Bernds-tech/WellFit-now`. Änderungen an dieser Landingpage dürfen die dortige Anwendung nicht ersetzen oder überschreiben.

## Inhalt

- die vollständige WellFit-Landingpage
- responsive Desktop-, Tablet- und Mobilgestaltung
- Themen- und Farbwechsel
- grafische Konzeptwelten, Buddys und Checkpoints
- rein lokale UI-Interaktionen
- Impressum und Datenschutzhinweise der Informationsseite
- Build- und Qualitätstests für die Landingpage

Kontaktflächen öffnen lediglich das E-Mail-Programm des Besuchers. Es wird kein Formular an eine WellFit-Datenbank gesendet.

## Lokal starten

Voraussetzung: Node.js `>=22.13.0` sowie eine Linux-Umgebung für die vorhandenen Build-Hilfsskripte.

```bash
npm ci
npm run dev
```

Qualitätsprüfungen:

```bash
npm run lint
npm test
```

## Technischer Rahmen

- Next.js / React
- Vinext / Vite für die bestehende ChatGPT-Sites-Bereitstellung
- Tailwind CSS
- keine Datenbankbindung
- keine geheimen Schlüssel im Repository

## Nächster gemeinsamer Schritt

Die Landingpage wird hier visuell weiterentwickelt. Eine Verbindung zur Anwendung erfolgt später bewusst und routeweise über klar definierte Schnittstellen. Bis dahin bleiben Design und Programm technisch getrennt.

## Lizenz

Derzeit ist keine Open-Source-Lizenz vergeben. Alle Rechte bleiben vorbehalten.
