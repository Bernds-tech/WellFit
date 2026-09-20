# WERK Stundenkontrolleur

Stand: 20.09.2026

Der WERK-Stundenkontrolleur ist bewusst vom autonomen Builder getrennt. Er arbeitet **read-only**, repariert nichts selbst und verändert weder Repository noch Staging.

## Aufgabe
Jede Stunde den tatsächlichen WERK-Zustand gegen die verbindlichen Verträge prüfen: Repository/Scope, CI, Supabase-Staging, Edge Runtime, API-Vertrag, Migrationen, Queues, Reviews, öffentliche Sichtbarkeit, Datenschutz-/Statuspfade, Testreste, Backup/Restore/Security und zentrale WERK-Rechen-/Datenverträge.

## Ampel
- **ROT:** Sicherheit, Datenintegrität, öffentliche Sichtbarkeit, Runtime-Ausfall oder widersprüchlicher politischer/Rechenvertrag.
- **GELB:** Drift, Testrest, veralteter Nachweis, Queue-/Review-Stau oder fehlender Gegencheck.
- **INFO:** relevante Zustandsänderung ohne akuten Fehler.

## Unabhängigkeit
Der Supervisor darf Fehler melden, aber nicht selbst beheben. Der autonome Builder darf den Supervisor nicht als Ersatz für CI, Runtime-Evidence oder fachliche Gegenprüfung verwenden.

## Benachrichtigung
ROT sofort. GELB nur neu oder wesentlich verändert. Wenn alles gesund und unverändert ist: keine Nachricht.

Kanonische maschinenlesbare Policy: `werk-data/werk-supervisor-policy.json`.


## Dauerhafte Protokollierung

Der Supervisor darf Produktcode, Runtime, Staging-Daten und politische Inhalte **nicht** verändern. Er darf ausschließlich sein Audit-Gedächtnis fortschreiben.

- **Verifizierte Builder-Erfolgsmeldung:** als Gegenprüfungs-Receipt in `project-memory/EXECUTION_RECEIPTS.md`. Ein Erfolg gilt erst dann als supervisor-bestätigt, wenn Claim, exakter Head/Version, CI und – falls relevant – Runtime/Staging-Evidence zusammenpassen.
- **Widerspruch zwischen Claim und Evidence:** Eintrag bzw. Aktualisierung in `project-memory/CONTRADICTIONS.md`.
- **Offener Mangel / fehlender Gegencheck / Stau:** Eintrag bzw. Aktualisierung in `project-memory/OPEN_LOOPS.md`.
- **Fehlgeschlagener Prüfweg, der nicht wiederholt werden soll:** `project-memory/FAILED_ATTEMPTS.md`.
- **Aktueller maschinenlesbarer Kontrollzustand:** `project-memory/WERK_SUPERVISOR_STATE.json`.

Eine bloße Erfolgsmeldung des Builders ist **keine Evidence**. Der Supervisor prüft sie unabhängig. Wird sie bestätigt, erzeugt er ein Receipt. Wird sie nicht bestätigt, erzeugt er keinen Erfolgs-Receipt, sondern einen passenden GELB/ROT-Befund.

### Receipt-Mindestinhalt
Jeder bestätigte WERK-Erfolg enthält mindestens:
- geprüfter Claim,
- exakter Repository-Head bzw. Runtime-/Migration-/Edge-Stand,
- herangezogene Evidence,
- Gegencheck/Falsifikationsfrage,
- Ergebnis `VERIFIED` oder `COUNTERCHECKED`,
- noch offene Grenzen.

Der Supervisor darf diese Auditdateien aktualisieren, aber daraus niemals selbst eine Produktfreigabe oder politische Annahme ableiten.
