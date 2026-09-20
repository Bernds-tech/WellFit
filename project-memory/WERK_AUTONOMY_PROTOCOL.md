# WERK Autonomie-Protokoll

Stand: 20.09.2026

Dieses Protokoll verbindet den autonomen WERK-Builder, den unabhängigen Stundenkontrolleur und das bestehende Project-Memory-System zu einem geschlossenen Arbeitskreislauf. Es ist **kein neues TODO-System**. Aufgaben bleiben ausschließlich in den bestehenden Registern.

## Ziel

WERK soll kontinuierlich weitergebaut werden, ohne bestätigte Arbeit doppelt zu erzeugen, ohne offene Arbeit zu verlieren und ohne bereits vorhandene Bausteine unverbunden nebeneinander stehen zu lassen.

## Kanonische Register und Bedeutung

1. `project-memory/EXECUTION_RECEIPTS.md`
   - Was wurde unabhängig verifiziert oder gegengeprüft?
   - Bestätigte Arbeit darf der Builder nicht neu bauen, außer neue Evidence macht sie stale.

2. `project-memory/CONTRADICTIONS.md`
   - Wo widersprechen Claim, Code, CI, Runtime, Daten oder politische/Rechenverträge einander?
   - Offene WERK-Widersprüche haben Vorrang vor neuer Feature-Arbeit.

3. `project-memory/OPEN_LOOPS.md`
   - Welche bekannten Lücken, fehlenden Gegenchecks oder unvollständigen Wirkpfade bleiben offen?

4. `project-memory/STARTED_WORK.md`
   - Welche Arbeit wurde bereits begonnen und muss fortgesetzt statt neu gestartet werden?

5. `project-memory/WORK_LOCKS.md`
   - Wer/was besitzt den aktiven Scope? Kein zweiter paralleler Aufbau desselben Sachgebiets.

6. `project-memory/DEPENDENCIES.md`
   - Was hängt wovon ab?
   - Jede neue oder bestätigte Funktion muss auf ihre Upstream-/Downstream-Verbindungen geprüft werden.

7. `project-memory/TASK_LEDGER.md`
   - Historischer und aktueller Aufgabenstatus. Append-only; supersede statt löschen.

8. `project-memory/NEXT_BEST_ACTION.md`
   - Abgeleitete nächste Aktion, **nicht** eigenständige Source of Truth.
   - Muss bei jedem Lauf gegen 1–7 reconciliert werden.

9. `project-memory/WERK_SUPERVISOR_STATE.json`
   - Letzter unabhängiger Kontrollzustand zur Delta-Erkennung.

## Der geschlossene Kreislauf

### A. Builder-Preflight
Vor jeder technischen oder fachlichen Änderung:

1. Supervisor-State lesen.
2. Neue ROT/GELB-Befunde aus CONTRADICTIONS/OPEN_LOOPS prüfen.
3. EXECUTION_RECEIPTS lesen und bereits bestätigte Arbeit als erledigt behandeln.
4. STARTED_WORK + WORK_LOCKS abgleichen.
5. DEPENDENCIES prüfen.
6. TASK_LEDGER prüfen.
7. NEXT_BEST_ACTION nur dann verwenden, wenn sie mit 1–6 übereinstimmt.
8. **Connection Sweep:** Für den gewählten Bereich prüfen:
   - Welche bestätigten Upstream-Bausteine liefern Inputs?
   - Welche Downstream-Bausteine sollten das Ergebnis konsumieren?
   - Gibt es bereits zwei verifizierte Bausteine, deren Integration noch unbewiesen ist?
   - Gibt es Daten-/API-/UI-/Rechenverträge, die denselben Zustand unterschiedlich benennen?
   - Gibt es eine bestehende Funktion, die erweitert werden kann, statt neu gebaut zu werden?

### B. Priorität des Builders
Reihenfolge:
1. ROT-Widerspruch / Sicherheits- oder Datenintegritätsproblem.
2. GELB-Befund, der aktuelle Arbeit blockiert oder bestätigte Claims entwertet.
3. Begonnene Arbeit mit gültigem Lock.
4. Fehlende Verbindung zwischen bereits verifizierten Bausteinen.
5. Offene Abhängigkeit, deren Voraussetzungen inzwischen erfüllt sind.
6. Aktuelle NEXT_BEST_ACTION.
7. Erst danach neue sinnvolle Erweiterung.

### C. Builder-Postflight
Nach jeder substantiellen Änderung:
- Tests/CI/negative Pfade ausführen.
- Runtime/Staging verifizieren, wenn betroffen.
- TASK_LEDGER aktualisieren.
- STARTED_WORK aktualisieren oder schließen.
- WORK_LOCK freigeben/fortschreiben.
- DEPENDENCIES aktualisieren.
- OPEN_LOOPS schließen, öffnen oder präzisieren.
- NEXT_BEST_ACTION neu ableiten.
- Erfolgsclaim erzeugen, aber **nicht selbst als supervisor-bestätigt markieren**.

### D. Supervisor
Der Supervisor:
1. prüft den Builder-Claim unabhängig;
2. bestätigt ihn nur bei passender Evidence;
3. schreibt VERIFIED/COUNTERCHECKED nach EXECUTION_RECEIPTS;
4. schreibt Widersprüche nach CONTRADICTIONS;
5. schreibt verbleibende Lücken nach OPEN_LOOPS;
6. aktualisiert WERK_SUPERVISOR_STATE.json;
7. ändert niemals Produktcode oder politische Inhalte.

### E. Rückkopplung
Der nächste Builder-Lauf beginnt wieder bei A und liest die Supervisor-Ergebnisse zuerst.

Damit gilt:
**Bauen → Belegen → Kontrollieren → Dokumentieren → Abhängigkeiten neu bewerten → nächste Aktion ableiten → weiterbauen.**

## Duplicate-Work-Regel

Ein Baustein mit aktuellem VERIFIED/COUNTERCHECKED-Receipt wird nicht neu implementiert.

Er darf nur wieder geöffnet werden, wenn mindestens eines zutrifft:
- neue Evidence widerspricht dem Receipt;
- zugrunde liegende Daten/Runtime/Rechtsgrundlage wurden materiell geändert;
- eine bislang fehlende Integration erfordert eine Erweiterung;
- ein offener Loop oder eine Dependency verlangt explizit Folgearbeit.

## Connection-Sweep-Regel

Nach jedem verifizierten Baustein muss geprüft werden, ob mindestens eine dieser Verbindungen offen ist:

- Datenquelle → Rechenmodell
- Rechenmodell → Reformakte
- Reformakte → IDEENWERK
- Bürgeridee → Kompetenz/Recht
- Bürgeridee → bestehende Maßnahme
- Bürgeridee → Rechen-/Wirkungsmodell
- Experteninput → KI-Synthese
- KI-Synthese → Varianten
- Varianten → Bürgerinformation
- Bürgerentscheidung → parlamentarischer Pfad
- Umsetzung → KPI/Wirkungsmessung
- Wirkungsmessung → Verbesserungsvorschlag
- Backend/API → Website
- Website-Claim → reale Runtime

Eine fehlende Verbindung wird als Dependency oder Open Loop dokumentiert, nicht durch einen parallelen Neubau umgangen.

## Stop-Regel

Wenn der Builder keinen neuen sicheren Schritt findet, darf er nicht künstlich Arbeit erzeugen. Er dokumentiert den Blocker bzw. die fehlende Evidence. Der Supervisor prüft den Zustand weiter.


## WERK-spezifische Steuerquellen

Für WERK dürfen die historisch vorhandenen WellFit-generischen Steuerdateien nicht als WERK-Finishline interpretiert werden. Der WERK-Kreislauf verwendet zusätzlich und vorrangig:

- `project-memory/WERK_FINISHLINE_STATE.json` — maschinenlesbarer WERK-Endzustand und Gate-Status.
- `project-memory/WERK_NEXT_BEST_ACTIONS.json` — priorisierter WERK-Aktionskatalog.
- `project-memory/WERK_EVIDENCE_TTL_POLICY.json` — Gültigkeits-/Invalidierungsregeln für mutable Evidence.
- `project-memory/WERK_EVIDENCE_FRESHNESS.json` — tatsächlich beobachtete aktuelle Evidence.
- `project-memory/WERK_MILESTONE_POLICY.json` — unveränderliche WERK-Meilenstein-Snapshots.
- `project-memory/WERK_OWNER_ACTION_INBOX.md` — ausschließlich echte Owner-/externe Freigaben.
- `project-memory/WERK_DEFERRED_OWNER_ACTIONS.md` — ausdrücklich auf später verschobene Owner-Aktionen.

### Ableitung der nächsten Aktion
`WERK_NEXT_BEST_ACTIONS.json` ersetzt nicht Task Ledger, Loops oder Dependencies. Es ist ein maschinenlesbarer Auswahlkatalog. Eine Aktion ist nur ausführbar, wenn Supervisor-State, Receipts, Locks, Dependencies und Finishline-Gates sie erlauben.

### Evidence Freshness
Vor Reliance auf mutable Staging-, Runtime-, Provider-, Rechts- oder amtliche Daten-Evidence muss die passende TTL-/Invalidierungsregel geprüft werden. Abgelaufene Evidence macht den zugrunde liegenden historischen Erfolg nicht falsch, darf aber keinen neuen Current-State-Claim tragen.

### Finishline-Navigation
Die Finishline wird nicht aus Prozenten oder Chatgefühl abgeleitet. Sie ergibt sich aus den Gates in `WERK_FINISHLINE_STATE.json`. Neue Arbeit muss mindestens einem offenen Gate oder einer dokumentierten Cross-Component-Dependency dienen.

### Owner-Aktionen
Normale Coding-, Analyse-, CI-, Staging-, Rechen- und Dokumentationsarbeit darf nie als Owner-Aktion ausgelagert werden. Owner-Aktionen werden erst READY_NOW, wenn alle automatisierbaren Voraussetzungen erfüllt sind.


## Spezialagenten-Netz

Die Rollen und erlaubten Writes stehen verbindlich in `project-memory/WERK_AUTOMATION_ROLES.json`; die Kollisionsregeln in `project-memory/WERK_AGENT_COORDINATION.md`.

Zusätzliche Kontrollen:
- Integration Hunter: fehlende Verbindungen und Systemgraph.
- Evidence Reaper: Evidence-TTL/Freshness.
- Orphan & Zombie Hunter: hängende/veraltete Tasks, Locks, Loops und Dependencies.
- Calculation Integrity Guardian: Doppelzählung, Baseline-/Szenario-Trennung, Datenstände und Cross-Model-Konsistenz.
- Milestone Closer: formaler Gate-/Snapshot-Abschluss.

Alle Rollen verwenden denselben `werk-data/werk-system-graph.json`. Spezialagenten bauen keine Produktfeatures; sie erzeugen oder reconciliieren nur vorhandene Governance-/Auditinformationen.
