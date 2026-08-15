import type { Metadata } from "next";
import Link from "next/link";
import { LegalThemeShell } from "../ThemeControls";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzhinweise für die WellFit-Informations- und Landingpage.",
  alternates: { canonical: "/datenschutz" },
};

export default function Datenschutz() {
  return (
    <LegalThemeShell><main className="legal-page">
      <Link className="legal-back" href="/">← Zurück zu WellFit</Link>
      <p className="eyebrow">DATENSCHUTZHINWEISE · STAND AUGUST 2026</p>
      <h1>Datenschutz</h1>
      <div className="legal-alert"><strong>Verantwortlichenangaben noch ergänzen.</strong><p>Die vollständige Identität und Anschrift des datenschutzrechtlich Verantwortlichen werden vor öffentlicher Freigabe ergänzt. Die Website bleibt bis dahin zugriffsbeschränkt und für Suchmaschinen gesperrt. Projektkontakt: <a href="mailto:hello@wellfit-now.io">hello@wellfit-now.io</a>.</p></div>
      <section><h2>Umfang dieser Website</h2><p>Dies ist ausschließlich eine Informations- und Landingpage über die geplante Entwicklung von WellFit. Sie enthält keine WellFit-Anwendung, keine Benutzerkonten, keine produktiven Missionen, keine WFXP- oder WFP-Konten, keine Standortprüfung, keine Checkpoint-Wertung, kein Bürgermeistersystem und keinen Partnereditor.</p></section>
      <section><h2>Kontakt per E-Mail</h2><p>Die Kontaktflächen dieser Website öffnen lediglich eine vorbereitete Nachricht im E-Mail-Programm des Besuchers. Auf dieser Website wird dabei kein Formular an eine WellFit-Datenbank übertragen und kein Double-Opt-in-Prozess ausgelöst. Welche Daten per E-Mail gesendet werden, entscheidet die absendende Person selbst. Eingehende Nachrichten dürfen nur zur Bearbeitung der jeweiligen Anfrage genutzt und nach Wegfall des Zwecks gelöscht werden, soweit keine gesetzlichen Pflichten entgegenstehen.</p></section>
      <section><h2>Hosting und technische Protokolle</h2><p>Beim Aufruf können durch die eingesetzte Hosting-Infrastruktur technisch notwendige Verbindungs-, Fehler- und Sicherheitsdaten verarbeitet werden. Dazu können insbesondere Zeitpunkt, angeforderte Seite, Browserinformationen und Verbindungsadresse gehören. Diese Verarbeitung dient ausschließlich der sicheren Bereitstellung der Website. Die konkrete Rechtsgrundlage, Speicherdauer und der Auftragsverarbeiter werden vor einer öffentlichen Freigabe rechtsverbindlich ergänzt.</p></section>
      <section><h2>Keine Karten-, Kamera- oder Standortfunktion</h2><p>Die dargestellten Beispielorte und Checkpoint-Szenen sind rein grafische Konzeptdarstellungen. Es wird keine Live-Karte eingebettet und die Landingpage fragt weder Standort, Kamera, Mikrofon, Bewegungs- noch Gesundheitsdaten ab. Alle Beschreibungen solcher Funktionen beziehen sich auf eine mögliche spätere WellFit-Anwendung.</p></section>
      <section><h2>Cookies, Analyse und externe Inhalte</h2><p>Die Website verwendet derzeit kein eigenes Marketing-Tracking, keine Werbeprofile und keine personalisierte Werbung. Externe Fachquellen werden nur als Links geöffnet. Ein Klick stellt eine Verbindung zum jeweiligen Anbieter her; dort gelten dessen Datenschutzbestimmungen.</p></section>
      <section><h2>Betroffenenrechte</h2><p>Je nach rechtlicher Voraussetzung bestehen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit, Widerspruch, Widerruf und Beschwerde bei der zuständigen Datenschutzbehörde. Bis die vollständigen Betreiberangaben vorliegen, kann der Projektkontakt <a href="mailto:hello@wellfit-now.io">hello@wellfit-now.io</a> genutzt werden.</p></section>
      <section><h2>Kinder und Familien</h2><p>Diese Informationsseite legt keine Kinderprofile an und sammelt keine Gesundheits- oder Bewegungsdaten von Kindern. Die geplante erste Alpha soll ausschließlich ausgewählte Erwachsene ab 18 Jahren umfassen. Familien- und Kinderfunktionen sind eine spätere Produktphase und werden erst nach eigener Sicherheits-, Guardian- und Datenschutzprüfung vorgesehen.</p></section>
      <nav className="legal-links"><Link href="/impressum">Impressum</Link><Link href="/">WellFit entdecken</Link></nav>
    </main></LegalThemeShell>
  );
}
