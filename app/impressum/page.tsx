import type { Metadata } from "next";
import Link from "next/link";
import { LegalThemeShell } from "../ThemeControls";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum und Projektinformation zu WellFit.",
  alternates: { canonical: "/impressum" },
};

export default function Impressum() {
  return (
    <LegalThemeShell><main className="legal-page">
      <Link className="legal-back" href="/">← Zurück zu WellFit</Link>
      <p className="eyebrow">RECHTLICHE INFORMATION</p>
      <h1>Impressum</h1>
      <div className="legal-alert"><strong>Veröffentlichung bleibt gesperrt, bis alle Angaben vorliegen.</strong><p>Die rechtsverbindlichen Betreiberangaben fehlen noch und werden nicht erfunden. Die Website bleibt deshalb zugriffsbeschränkt und für Suchmaschinen gesperrt. Vor einer öffentlichen Freigabe müssen vollständiger Name beziehungsweise Firma, Rechtsform, ladungsfähige Anschrift und – falls vorhanden – Firmenbuch-, UID- und Aufsichtsangaben ergänzt und rechtlich geprüft werden.</p></div>
      <section><h2>Projekt</h2><p>WellFit – Bewegung, Lernen und Gemeinschaft mit einem persönlichen KI-Buddy und Augmented Reality.</p></section>
      <section><h2>Kontakt</h2><p><a href="mailto:hello@wellfit-now.io">hello@wellfit-now.io</a></p></section>
      <section><h2>Noch einzutragende Pflichtangaben</h2><p>Betreiber beziehungsweise Firma, Rechtsform, ladungsfähige Anschrift, vertretungsberechtigte Person, Firmenbuchnummer und Firmenbuchgericht, UID-Nummer sowie gegebenenfalls zuständige Aufsichtsbehörde und Berufsrecht.</p></section>
      <section><h2>Inhaltliche Einordnung</h2><p>Diese Website ist ausschließlich eine Informations- und Landingpage zu einem Produktkonzept in Entwicklung. Sie ist nicht die WellFit-Anwendung und bietet keine Konten, Missionen, Punkte, Checkpoint-Wertungen oder Bürgermeisterfunktionen. Konzeptvisualisierungen stellen das angestrebte Nutzererlebnis dar. WFT ist kein aktives öffentliches Angebot; es bestehen keine Preis-, Rendite-, Partner- oder Launchgarantien.</p></section>
      <nav className="legal-links"><Link href="/datenschutz">Datenschutzerklärung</Link><Link href="/">WellFit entdecken</Link></nav>
    </main></LegalThemeShell>
  );
}
