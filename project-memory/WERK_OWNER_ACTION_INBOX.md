# WERK Owner Action Inbox

Diese Datei enthält ausschließlich Aktionen, die wirklich Bernd/Owner, externe Rechts-/Providerstellen oder geschützte Freigaben benötigen. Der Builder darf normale Coding-, Analyse-, CI-, Staging- und Dokumentationsarbeit nicht hierher verschieben.

## WERK-OWNER-ID-001 — Identitätsmodell für verifizierte Unterstützung
- Status: NOT_READY
- Gate: verified_support
- Trigger: Erst wenn die technische Bürger-/Privacy-Basis und ein konkreter Identitätsansatz vergleichbar ausgearbeitet sind.
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
