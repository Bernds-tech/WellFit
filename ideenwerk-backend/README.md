# WERK IDEENWERK Backend

Status: **Scaffold / nicht produktiv betrieben**

Dieses Verzeichnis übersetzt die öffentliche IDEENWERK-Governance in einen technischen Backend-Ausgangspunkt.

## Kernprinzipien

- Idee einreichen **ohne Login**.
- Statuszugang über einen unguessbaren Token; serverseitig nur SHA-256-Hash.
- Anonyme Einreichung, verifizierte Unterstützung und WERK VOTE sind drei getrennte Vertrauensstufen.
- KI-Verarbeitung läuft asynchron. Das Absenden einer Idee darf bei KI-Ausfall nicht fehlschlagen.
- Originaleinreichungen bleiben erhalten, auch wenn sie einem Cluster zugeordnet werden.
- Keine geheime KI-Gesamtnote.
- Öffentliche Aufmerksamkeitssignale und fachliche Qualitätsgates bleiben getrennt.

## Lokaler Start

1. PostgreSQL bereitstellen.
2. `sql/001_init.sql` und `sql/002_jobs.sql` ausführen.
3. `DATABASE_URL` setzen.
4. `npm install`
5. `npm start`

Beispiel:

```bash
export DATABASE_URL='postgres://user:password@localhost:5432/werk'
npm install
npm start
```

## Bereits scaffolded

- `POST /api/ideenwerk/v1/submissions` – anonyme/pseudonyme Einreichung.
- `GET /api/ideenwerk/v1/submissions/:publicId` – nur moderierte öffentliche Fassung.
- `GET /api/ideenwerk/v1/status/:publicId` – privater Statuszugang mit Bearer-Token.
- `POST /api/ideenwerk/v1/moderation/report` – öffentliche Meldung.
- PostgreSQL-Schema für Einreichungen, Statuszugang, strukturierte Vorschläge, Cluster, Supports, Reviews, Audit Events, Abuse-Signale und Moderationsmeldungen.
- Job-Queue-Grundlage für asynchrone Strukturierung, PII-Prüfung, Clustering und Kompetenzvorcheck.

## Vor Produktivbetrieb zwingend

- Rate Limiting / progressive Bot-Challenge tatsächlich implementieren.
- Datenschutzfolge/DSGVO, Löschung, Auskunft, Aufbewahrungsfristen und Moderationsprozess rechtlich freigeben.
- Token-Threat-Model und Penetrationstest.
- CORS, Security Header, Reverse Proxy/WAF und Secret Management.
- PII-Redaktion und öffentliche Freigabe-Workflow implementieren.
- Embedding-/Clustering-Evaluation einschließlich False-Merge-Rate.
- Qualitätspfad für wenig populäre Einzelideen messen.
- Regionen-Bias und Kampagnen-/Astroturfing-Erkennung evaluieren.
- Backup/Restore und Audit-Export testen.
- Verifizierte Unterstützung technisch von anonymer Reaktion und späterer geheimer Stimme trennen.

## Wichtige Abgrenzung

Dieser Scaffold bedeutet **nicht**, dass IDEENWERK bereits serverseitig läuft. Die aktuelle V62-Website speichert Demo-Ideen weiterhin nur lokal im Browser. Das Backend wird erst dann als produktiv markiert, wenn Datenbank, API, Worker, Moderation, Datenschutz und Missbrauchsschutz tatsächlich betrieben und abgenommen sind.
