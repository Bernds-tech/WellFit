# WERK Next Best Action

- Project: `WERK Österreich`
- Selected action: `WERK-AI-SYNTH-001`
- Catalog entry: `NBA-WERK-AI-SYNTHESIS`
- Status: `EXECUTABLE`
- Risk: `R3`
- Gate: `ai_synthesis`
- Title: KI-Synthese aus Bürgerideen, Experteninput und bestehenden WERK-Modellen bauen

## Why this is next
`WERK-IDEENWERK-IMPACT-BRIDGE-001` und `WERK-EXPERT-001` sind beide unabhängig `COUNTERCHECKED_STAGING`. Der Expert-Closeout ist kanonisch konsumiert: Task/Started Work/Lock/Open Loop/Dependency/System Graph sind reconciliert, `WERK_EVIDENCE_FRESHNESS.json` wurde nach Migrationen 038/039 frisch revalidiert und `WERK_FINISHLINE_STATE.json` führt `expert_process=COUNTERCHECKED_STAGING`.

Damit sind die fachlichen Staging-Prerequisites für `WERK-AI-SYNTH-001` erfüllt. Der weiterhin offene Hosted-Supabase-Hinweis `pg_net extension_in_public` ist ein Production-Hardening-Limit, aber kein Blocker für reversible Staging-Feature-Arbeit.

## Exact bounded work
1. Bestehende Bürgerproblem-/Cluster-Daten, Impact-Bridge-Referenzen und counterchecked Experten-/Betroffeneninput konsumieren; keine parallelen Daten- oder Rechenquellen bauen.
2. Mehrere nachvollziehbare Lösungsvarianten erzeugen, jeweils mit Quellen-/Version-Provenienz, Gegenpositionen, Unsicherheiten und offenen Gates.
3. Vorhandene WERK-Rechen-/Reformartefakte nur referenzieren; keine ungesicherten fiskalischen Wirkungen erfinden und keine bedingten Szenarien als verifizierte Wirkung ausgeben.
4. Keine politische Rangfolge, kein automatisches Annehmen/Ablehnen, kein Expertenveto und keine politische Entscheidung durch die KI.
5. Bestehende IDEENWERK/API/V71-Flächen wiederverwenden; keine Parallelplattform.
6. Deterministische Source-/Version-Bindung, negative/stale/fail-closed Tests, Auditspur und reversible Staging-Verifikation vor jedem Downstream-Claim.

## Current evidence
- Impact Bridge functional head: `01f9f7cb927334cdd6abd4ddcc1fdfea48e147be`, `COUNTERCHECKED_STAGING`.
- Expert functional head: `c851f9248d297d6d7bdaf4f06d746d68c6bae4d5`, `COUNTERCHECKED_STAGING`.
- Expert countercheck receipt: `project-memory/werk-supervisor-receipts/WERK_SUPERVISOR_2026-09-21T023924Z.json`.
- Expert CI: WERK Expert Input Check #4, WERK Data Contract Registry Check #59 und WERK Frontend Check #182 erfolgreich.
- Staging: `ACTIVE_HEALTHY`, `werk-ideenwerk-api` v7, aktuelle Migration `20260921013039 expert_input_operator_index`, 15 geprüfte Tabellen auf Zero-Baseline.
- Freshness revalidated: `2026-09-21T03:26:40Z` nach Migrationen 038/039.

## Do not rebuild
Impact Bridge, Expert Input, Kompetenzprüfung, Existing-Measure-Review, Privacy, Clarification, öffentliche Cluster und FAST/STANDARD/DEEP nicht erneut implementieren. Diese Bausteine sind Inputs für die Synthese und werden nur über ihre bestehenden Verträge konsumiert.

## Acceptance boundary
Der Builder darf nach Implementierung nur einen evidenzgebundenen Builder-Claim erzeugen. Unabhängiger Supervisor-Gegencheck bleibt Pflicht. Kein `ACCEPTED` oder `PRODUCTION_CONFIRMED` aus Repository-/Staging-Evidence allein.