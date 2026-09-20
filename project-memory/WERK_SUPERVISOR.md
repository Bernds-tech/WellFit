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
