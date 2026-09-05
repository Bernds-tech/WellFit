# Unabhängige Analyse der öffentlichen WellFit-Informationsseiten

Datum: 2026-09-05
Task: WFG-PUBLIC-INFO-AUDIT-20260905
Status: PARTIAL (Desktop-Inhalt/visuelle Stichproben und ausgewählte Interaktionen geprüft; mobile Geräte, Screenreader und Performance-Messung offen)
Risk: R1
Auftrag: Komplette Analyse aus Sicht eines neuen Besuchers; kein Loginbereich, keine Umsetzung.
Verwandt: WFG-VIS-001, WF-LOOP-005. Neue Bestandsaufnahme, keine Fortsetzung oder Abnahme alter Implementierungsversuche.

## Prüfgrundlage und Grenzen

Live geprüft: https://wellfit-bewegt.bernd-guggenberger.chatgpt.site/
Informationswelten: ?welt=wellfit, ?welt=missions (alle fünf Unteransichten), ?welt=tech, ?welt=impact, ?welt=partner.
Zusätzlich gelesen: /impressum, /datenschutz und /agb.
Browser: Chrome, gemessener Viewport 1363 × 936 CSS-Pixel. Sichtbare Seitenzustände, DOM-Inhalte und ausgewählte Navigationsaktionen; Screenshots der Startansichten und wichtiger Abschnitte intern visuell beurteilt.
Kein Login, keine Registrierung, keine Konten, keine Kontaktübermittlung und keine Produktänderung.
Nicht behauptet: vollständige WCAG-Konformität, echter Smartphone-/Touch-Test, Screenreader-Test, Core Web Vitals, technische App-Funktionsreife oder vollständiger externer Linkcheck. Ein Tastenkürzel-Versuch lieferte keine messbare Viewportverkleinerung und zählt nicht als Mobil- oder Zoomnachweis.

Vorgeschriebene Repository-Prüfung: PROTOCOL, PROJECT_COORDINATION, CURRENT_STATE, FINISHLINE_STATE, NEXT_BEST_ACTION, AUTO_HANDOFF, OWNER_ACTION_INBOX, SESSION_HANDOFF, STARTED_WORK, WORK_LOCKS, OPEN_LOOPS, TASK_LEDGER, DEPENDENCIES, DECISIONS sowie AGENTS, PROJECT_FINISHLINE, FAILED_ATTEMPTS, CHANGE_REQUESTS, DO_NOT_ASSUME, ASSUMPTIONS, CONTRADICTIONS, EVIDENCE_TTL und DRIFT_BASELINE gelesen.
Aktuelles main: 649a3b647dd6162f402663f2d84b8ca201f45400.
Offene PRs: #2 und #21, beide Drafts. Aktuelle abgefragte Memory Quality/Stale Scan/Status Runs auf main erfolgreich. Diese Checks belegen keine öffentliche Sites-Abnahme.
Die öffentliche Website ist eine eigene Laufzeit. Die damalige Aussage der Übergabe vom 29.08. zu fehlendem Puppet-Verhalten wird hier NICHT wiederholt: Heute sind eine kleine überlagerte Figur und wechselnde Sprechblasen sichtbar. Artikulierte Bewegung und die Identität/Designkonformität dieser Figur wurden nicht abgenommen.

## Gesamturteil

Die Website vermittelt eine attraktive Vision mit konsistenter dunkler Farbwelt, großen redaktionellen Überschriften und emotionalen Bildern. Sie macht Bewegung, Entdecken und einen digitalen Begleiter schnell sichtbar. Als verständliche Produktinformation verliert sie dagegen an Klarheit: Ein konkretes Spielerlebnis, der aktuelle Entwicklungsstand und der nächste sinnvolle Schritt für Interessenten sind weniger präzise als die Atmosphäre.

Priorität haben überprüfbare Informationslücken, Kontraste, Navigation und Überlagerungen. Eine weitere komplette Neugestaltung ist aus diesem Audit nicht begründet.

## Befunde

### A01 – Hoch: Untere Weltnavigation ist gedrängt und abgeschnitten
Auf mehreren Desktop-Screenshots stoßen Nachbarwelt, aktive Welt und nächste Welt in einer sehr schmalen unteren Leiste zusammen. Lange Bezeichnungen werden abgeschnitten und überlagern sich optisch. Auch bei 1363 Pixeln Breite ist die Orientierung schwach.
Empfehlung: genügend Platz, klare Trennung, gut erkennbare Vor-/Zurück-Steuerung oder eine einheitliche dauerhafte Navigation. Abnahme: alle fünf Weltzustände ohne Überdeckung/ungeklärte Kürzung.

### A02 – Hoch: Weltmenü liegt über dem Logo
Der dauerhaft sichtbare Schalter „Mehr über WellFit“ überdeckt oben links Teile des Logos. Ein Versuch, das Logo als Rückkehr zur Hauptwelt zu verwenden, öffnete das darüberliegende Menü.
Empfehlung: getrennte Trefferflächen und ein klar erkennbarer Home-Link. Abnahme: Logo, Menü und erster Abschnittslink überlappen weder optisch noch in ihren Klickflächen.

### A03 – Hoch: Direktbutton „Technik →“ reagiert nicht wie erwartet
Reproduktion: Missionswelt öffnen, Unteransicht „05 Gemeinsam“, „Technik →“ klicken. In zwei Prüfungen blieb URL bei ?welt=missions und aktives Panel bei missions-panel. Über „Mehr über WellFit“ → „04 Technik & Entwicklung“ wurde ?welt=tech erfolgreich geöffnet.
Empfehlung: Event-/Navigationsverhalten gezielt prüfen. Kein pauschaler Defekt aller Weltwechsel behauptet.

### A04 – Mittel: Wiedereinstieg beginnt nicht zwingend beim Missionsanfang
Nach vorherigem Besuch von „05 Gemeinsam“ führte „Mission vollständig erleben →“ aus der Hauptwelt erneut zu „05 Gemeinsam“. Die letzte Unteransicht bleibt offenbar erhalten.
Empfehlung: Ein Einstiegsbutton, der eine vollständige Mission verspricht, sollte den Anfang gezielt öffnen oder die Fortsetzung eindeutig benennen.

### A05 – Hoch: Kontrastarme Akzentüberschrift auf hellem Hintergrund
Technik → „Einfach erklärt“: „Die Technik bleibt im Hintergrund.“ ist gelbgrün auf fast weißem Hintergrund und schwer lesbar. DOM-Farbe des em: rgb(232,255,99). Keine exakte Kontrastzahl behauptet, da der gerenderte Hintergrund aus mehreren Ebenen besteht.
Empfehlung: dunkler Akzent für helle Flächen. Vergleichsmaßstab WCAG 2.2: https://www.w3.org/TR/WCAG22/ . Keine vollständige Konformitätsprüfung.

### A06 – Hoch: Rudi/Sprechblasen überdecken Informationsinhalt
Sprechblasen lagen im Test über einer Karte der einfachen Technikerklärung, über dem Einleitungstext des Wirkungs-Pilotabschnitts und über Partnereinstiegen. Die kleine Figur überlagert ebenfalls Fließtext und Karten. Zwischen Figur und Blase besteht großer räumlicher Abstand; als neuer Besucher ist die Zuordnung schwach. Stil und Maßstab der kleinen humanoiden Figur wirken gegenüber den großen illustrierten Wesen uneinheitlich.
Empfehlung: feste freie Fläche oder einklappbare Begleitung, Schließen/Pausieren zugänglich machen, keine Abdeckung von Text oder Buttons. Kein Urteil zur Übereinstimmung mit dem freigegebenen Original-Rudi, weil das Original nicht Gegenstand dieses Vergleichs war.

### A07 – Hoch: Kein vollständiges konkretes Missionsbeispiel
Die Hauptwelt nennt vier allgemeine Schritte. Die fünf Missionsansichten vermitteln Ablauf, Glitch, Buddy, Orte und Zusammenarbeit jeweils in wenigen Sätzen. Es fehlt ein zusammenhängendes Beispiel mit tatsächlicher Aufgabe, Dauer, Strecke/Intensität, Checkpoint-Nachweis und verständlichem Ergebnis. Die Partnerseite ist mit Museum/Burg in dieser Hinsicht konkreter.
Empfehlung: ein ausdrücklich fiktives Beispiel durchgehend zeigen. Vorgeschlagene Zahlen dürfen nicht als bereits verfügbare Route erscheinen.

### A08 – Hoch: Aktueller Stand und Zukunft nicht überall gleich deutlich
Positiv: „Produktvorschau“, „noch nicht öffentlich verfügbar“, „geplant“, „später“ und Wirkungs-Hypothesen sind vorhanden.
Gleichzeitig sind viele Funktionssätze im Präsens: „Dein Buddy geht wirklich mit“, „Rudi erscheint im Raum“, „Keine Führung über Fahrbahnen ...“. Eine kleine Phasenkennzeichnung reicht nicht immer aus, um starke Aussagen beim Überfliegen einzuordnen.
Empfehlung: ein konsistentes Schema „Heute auf dieser Website / Für die geschlossene Alpha geplant / Später“. Dieses Audit prüft die Verständlichkeit der Aussagen, nicht den tatsächlichen Backend-/Unity-Stand.

### A09 – Hoch: Erwachsenen-Alpha versus Familienbilder
Die erste Alpha ist klar mit 18+ bezeichnet; zugleich dominieren Kinder/Familien die Start- und Technikbilder. Kinder-, Schul- und Familienangebote sind teilweise als spätere Phase markiert, auf der Wirkungsseite aber nicht an jeder Zielgruppenkarte.
Empfehlung: langfristige Familienvision behalten, Erwachsene als aktuelle Testzielgruppe im ersten Blick klarer hervorheben.

### A10 – Hoch: Ein sinnvoller nächster Schritt für Spieler fehlt
Die Hauptwelt endet vor allem mit Registrierungsvorschau und Login. Die Registrierungsvorschau ist ehrlich benannt, aber kein klarer Weg, um Interesse an einem späteren Test zu hinterlassen. Ein Pilotkontakt ist auf der Partnerseite vorhanden.
Empfehlung: „Alpha-Interesse melden“ oder ein anderer tatsächlich funktionierender Interessentenweg, mit wahrheitsgemäßer Beschreibung. Kein Formular vortäuschen. Zunächst reicht ein klarer, passend benannter Kontaktweg.

### A11 – Mittel: FAQ fehlt als gut auffindbare Entscheidungshilfe
Auf den gelesenen Informationswelten fehlt ein gebündelter Bereich für: geplanter Start/Region, geeignetes Android-Gerät, iPhone-Zeitpunkt, Kosten für Spieler, Internetbedarf, Alleinspielen, Pausen, Glitch-Nichterreichen, Punkteverwendung.
Teilantworten existieren verteilt. Zum Beispiel erklärt erst der AGB-Entwurf deutlich, dass WFXP interne Punkte ohne Geldwert und ohne Auszahlung sind.
Empfehlung: vorhandene Antworten konsolidieren; Unentschiedenes ausdrücklich so benennen.

### A12 – Hoch: Glitch-Regeln und Ruhe-/Sicherheitsversprechen verbinden
Hauptwelt: automatischer Start für alle, fünf Minuten, bei 00:00 im Radius. Missionswelt: „seltener Glitch“, knapper Countdowntext. Wirkung: Pausen, Abbruch und Nichterreichen dürfen nie bestraft werden.
Das kann zusammenpassen, wird aber nicht ausreichend erklärt: Ereignis verpassen versus vorhandenen Fortschritt verlieren; Geltungsbereich von „alle“; Verhalten bei Arbeit, Verkehr, eingeschränkter Mobilität, gesperrtem Handy oder schlechtem GPS.
Empfehlung: Mechanik nicht eigenmächtig ändern, sondern diese offenen Besucherfragen direkt am Glitch beantworten. Sicherheitstext nicht räumlich von der Zeitdruckmechanik trennen.

### A13 – Mittel: Technikseite länger und fachlicher als angekündigt
Gemessene Panelhöhe rund 10.383 Pixel bei 936 Pixel Viewporthöhe. „Technik ohne Fachsprache“ enthält dennoch LiteRT, AR Foundation, Depth API, Ledger, Cloud Anchors, BLE und Vendor-Lock-in.
Vier schmale Datenflusskarten führen zu vielen kurzen Zeilen und unnötiger vertikaler Länge. Dekorative Speziessektionen stehen vor der einfachen Erklärung.
Empfehlung: Nutzerfrage zuerst, Fachdetails optional, 2×2 oder breitere Karten. Spezies mit konkreter Erklärung verbinden oder später platzieren.

### A14 – Mittel: Drei Partnereinstiege sind noch keine drei ausführlichen Wege
Die Karten „Kultur & Tourismus“, „Bildung & Gesellschaft“, „Unternehmen & Marken“ funktionieren als Sprünge. Alle sechs überprüften Partner-Anker haben existierende Ziele.
Der Kultur-Einstieg landet aber auf der kurzen Karte „Museen & Kultur“, nicht auf einer eigenständigen ausgearbeiteten Zielgruppenstrecke.
Empfehlung: pro Zielgruppe Problem, Beispielmission, Beitrag des Partners, Ergebnis und Kontakt kurz zusammenführen. Vorhandene Museum-/Burgabläufe wiederverwenden.

### A15 – Hoch: Datenschutz enthält noch Platzhalter zur öffentlichen Website
/datenschutz erklärt, konkrete Rechtsgrundlage, Speicherdauer und Auftragsverarbeiter würden erst vor öffentlicher Freigabe ergänzt. Die Seite ist bereits öffentlich erreichbar. Das ist eine sichtbare redaktionelle Unvollständigkeit; hier wird kein Rechtsverstoß festgestellt.
Empfehlung: aktuelle Hosting-Angaben sauber von späteren App-Datenschutzregeln trennen und sachlich vervollständigen.

### A16 – Mittel: Betreiberidentität und wiederkehrender Footer
Impressum nennt „WellFit Global Operations“ und eine Adresse, aber keine klar erläuterte verantwortliche Person/Rechtsform. Dazu wird www.wellfit-now.io genannt, während die geprüfte Seite auf chatgpt.site liegt; E-Mail ist eine private Gmail-Adresse. Das wirft für neue Interessenten Identitätsfragen auf.
Kontakt/Impressum/Datenschutz stehen in der Hauptwelt; die Partnerwelt enthält keine eigenen Impressum-/Datenschutzlinks.
Empfehlung: klare Betreiber-/Projektbeschreibung, verständliche Domainzuordnung und überall erreichbarer Footer. Kein rechtliches Vollständigkeitsurteil ohne gesonderte Prüfung.

### A17 – Mittel: Öffentliche Auffindbarkeit und Teilbarkeit
Gemessen in der Missionswelt: title „WellFit – Bewegung, die verbindet“, generische Meta-Description, canonical zur Root-URL und lang=de. Weltwechsel besitzen ?welt=-Adressen; die einzelnen Missions-Unteransichten waren in der URL nicht getrennt erkennbar.
Empfehlung: prüfen, ob jede Informationswelt eigene Titel/Beschreibung und eine bewusst gewählte Indexierungsstrategie erhalten soll. Gemeinsamer Canonical ist nicht automatisch ein Fehler; Suchmaschinenpositionen wurden nicht gemessen.

### A18 – Mittel: Abschnittssprünge brauchen gezielten Layouttest
Bei einem wiederholten Hauptwelt-Klick „Mission“ blieb die obere Abschnittskante bei ca. -230 px, sodass die Überschrift oberhalb des sichtbaren Bereichs lag. Andere Sprünge (Technik „Einfach erklärt“, Wirkung „Pilot“) landeten korrekt ca. 62 px unter dem oberen Rand.
Empfehlung: Scrollcontainer, Layoutänderungen und Offset gemeinsam prüfen. Kein pauschales Urteil „Anker funktionieren nicht“.

## Was ausdrücklich erhalten bleiben sollte

- Unverwechselbare dunkle Türkiswelt, große Überschriften und emotionaler Bezug zu realen Orten.
- Einfache Grundidee „Die echte Welt wird zum Spiel“ und vierteiliger Missionseinstieg.
- Rudi als Guide versus persönlicher Buddy wird auf der Hauptwelt grundsätzlich unterschieden.
- Hinweise auf 18+, Produktvorschau, geplante Funktionen und spätere Familienphase.
- Partnerpilot mit Rollenverteilung, drei bis fünf Checkpoints und vorgeschlagenen sechs bis acht Wochen.
- Wirkungshypothesen werden ausdrücklich von noch fehlenden WellFit-Ergebnissen getrennt.
- WHO-Zahlen sind mit Quellen und Datenjahren versehen.
- Fachquellen statt erfundener Referenzen.

## Externe Gegenprüfung

Die auf der Seite genannte WHO-Angabe 31 % / 1,8 Milliarden Erwachsene / Datenjahr 2022 wird durch die WHO-Veröffentlichung 26.06.2024 gestützt:
https://www.who.int/news/item/26-06-2024-nearly-1.8-billion-adults-at-risk-of-disease-from-not-doing-enough-physical-activity

Die WHO-Quelle zu Jugendlichen wurde geöffnet; sie beschreibt mehr als 80 % und schulbasierte Daten 11–17 Jahre bis 2016. Die genaue Grundgesamtheit sollte auf der Website erhalten bzw. präzisiert werden:
https://www.who.int/news/item/22-11-2019-new-who-led-study-says-majority-of-adolescents-worldwide-are-not-sufficiently-physically-active-putting-their-current-and-future-health-at-risk

Quelle zu Einsamkeit geöffnet:
https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death

Keine Wirksamkeit von WellFit aus allgemeinen WHO-Daten abgeleitet. Nicht alle technischen oder wissenschaftlichen Fremdlinks einzeln validiert.

## Reihenfolge für eine spätere Umsetzung

1. Überlagerungen, untere Navigation, Logo-Trefferfläche, Technik-Direktwechsel und helle Kontraste korrigieren.
2. Ein konkretes Missionsbeispiel, einheitliche Phasenkennzeichnung und leicht auffindbare Fragen/Antworten.
3. Glitch-Regeln mit den vorhandenen Sicherheits- und Pausenversprechen verständlich verbinden.
4. Interessentenweg und aktuelle Hosting-/Betreiberinformationen vervollständigen.
5. Bestehende lange Technik-/Partnerinhalte verdichten und erst dann mobile Geräte, Tastatur, Screenreader, Kontraste und Performance systematisch abnehmen.

## Postflight / Handoff

Dokumentationszweig: codex/public-info-audit-20260905.
Keine öffentlichen Inhalte geändert und keine vorhandenen Work Locks übernommen oder freigegeben.
Die Befunde sind Analysebeobachtungen und Empfehlungen, keine abgeschlossenen Korrekturen.
Keine alten Puppet-/UI-Aufgaben als abgeschlossen markiert.
Nächste ausführbare Arbeit nur nach gewünschtem Umsetzungsscope: tatsächliche Sites-Quelle laden und einen eng begrenzten Korrektursatz der oben reproduzierten UI-Fehler erstellen.
Falsifikationsfrage: Zeigt derselbe öffentliche Stand bei gleichem Viewport keine Überlagerungen oder funktioniert der Technik-Direktbutton, müssen die betroffenen Beobachtungen reproduziert und ggf. als zustandsabhängig eingeordnet werden.
