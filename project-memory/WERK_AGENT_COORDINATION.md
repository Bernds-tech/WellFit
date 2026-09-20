# WERK Agent Coordination

Stand: 20.09.2026

WERK verwendet mehrere spezialisierte Automationen, aber **nur ein gemeinsames Arbeitsgedächtnis**. Die Rollen dürfen kein eigenes konkurrierendes TODO-System erzeugen.

## Rollen

- **Builder:** einzige normale Implementierungsrolle.
- **Supervisor:** unabhängige Gegenprüfung; keine Reparatur.
- **Finishline Navigator:** Gesamtweg und Gate-Reihenfolge.
- **Owner Action Manager:** ausschließlich echte Owner-/externe Aktionen.
- **Integration Hunter:** sucht fehlende Verbindungen zwischen bestehenden Komponenten.
- **Evidence Reaper:** invalidiert veraltete Current-State-Evidence nach Policy.
- **Orphan & Zombie Hunter:** reconciliert hängende/verwaiste Arbeit.
- **Calculation Integrity Guardian:** prüft mathematische und Datenvertrags-Konsistenz.
- **Milestone Closer:** schließt Meilensteine ausschließlich mit vollständigem Quorum.

Maschinenlesbar: `project-memory/WERK_AUTOMATION_ROLES.json`.

## Schreibdisziplin

Spezialrollen dürfen keine Produktfeatures implementieren. Sie dürfen nur ihre festgelegten Governance-/Auditregister aktualisieren. Normale technische Änderungen bleiben beim Builder.

## Systemgraph

`werk-data/werk-system-graph.json` bildet bekannte WERK-Komponenten und ihre Abhängigkeiten ab. Er ist kein politisches Wirkungsurteil. Er dient dazu, fehlende technische/fachliche Verbindungen sowie die Ausbreitung veralteter Evidence zu erkennen.

## Kollisionsregel

Vor jedem Write:
1. Bestehende Task-/Loop-/Dependency-ID suchen.
2. Bestehenden Eintrag aktualisieren statt Duplikat erzeugen.
3. Bei widersprüchlicher Evidence zuerst `CONTRADICTIONS.md` aktualisieren.
4. Stärkere/aktuellere Evidence darf Status ändern; bloßer Agenten-Claim nicht.
5. Keine Rolle darf eine politische Option priorisieren, annehmen oder ablehnen.

## Ereignisfluss

Builder Claim
→ Supervisor Gegencheck
→ Receipt/Finding
→ Integration/Evidence/Zombie/Calculation Spezialkontrollen
→ Finishline Navigator
→ Next Best Action
→ Builder.

Milestone Closer läuft nur auf bereits ausreichend belegten Gate-Wechseln. Owner Action Manager meldet nur READY_NOW-Aktionen.
