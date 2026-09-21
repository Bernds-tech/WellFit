# WERK Owner Action Inbox

Diese Datei enthält ausschließlich Aktionen, die wirklich Bernd/Owner, externe Rechts-/Providerstellen oder geschützte Freigaben benötigen. Der Builder darf normale Coding-, Analyse-, CI-, Staging- und Dokumentationsarbeit nicht hierher verschieben.

## WERK-OWNER-AI-PROVIDER-001 — KI-Provider für echte Varianten
- Status: NOT_READY
- Gate: ai_synthesis
- Trigger: Erst wenn `WERK-AI-PROVIDER-EVAL-001` ein konkretes vergleichbares Provider-/Datenschutz-/Kostenpaket mit Secret-Grenze und target-bound Verify-Plan vorlegt.
- Owner decision needed: Auswahl/Freigabe eines konkreten Providers, Kostenrahmens und zulässigen Datenflusses.
- Boundary: Vor READY_NOW keine Secrets, keine kostenpflichtige Aktivierung und keine externe Verarbeitung realer Bürger-/Expertendaten.

## WERK-OWNER-ID-001 — Identitätsmodell für verifizierte Unterstützung
- Status: NOT_READY
- Gate: verified_support
- Trigger: Erst wenn `WERK-ID-ARCH-001` mindestens zwei realistische Identitäts-/Verifikationsmodelle samt Threat Model, Datenminimierung, Recovery, Kosten und offenen Rechts-/Datenschutzfragen vergleichbar ausgearbeitet hat.
- Owner decision needed: Auswahl/Freigabe des Zielmodells und gegebenenfalls externer Anbieter/Rechtsprüfung.
- Boundary: Support ist keine geheime amtliche Stimme.

## WERK-OWNER-VOTE-001 — Zielrahmen für WERK VOTE
- Status: NOT_READY
- Gate: werk_vote
- Trigger: Erst nach verifizierter Unterstützung, Threat Model, Datenschutz-/Geheimhaltungsmodell und rechtlicher Abgrenzung.
- Owner decision needed: Freigabe des konkreten Zielrahmens nach fachlicher/rechtlicher Vorlage.
- Boundary: Keine amtliche Wahlfunktion oder Verfassungswirkung behaupten.

## WERK-OWNER-PROD-001 — Produktionsfreigabe
- Status: BLOCKED_UNTIL_GATES
- Gate: production_readiness
- Trigger: Website, Open Democracy, Security/Privacy und notwendige rechtliche/externe Gates vollständig gegengeprüft.
- Owner decision needed: ausdrückliche Produktivfreigabe.
- Boundary: Kein automatischer Production-Deploy.

## Regel
Nur READY_NOW-Aktionen aktiv an Bernd melden. NOT_READY/BLOCKED_UNTIL_GATES nicht wiederholt erinnern.
