export default function InterestForm({ partner = false }: { partner?: boolean }) {
  const subject = encodeURIComponent(partner ? "WellFit – Interesse als Pilotpartner" : "WellFit – Interesse an weiteren Informationen");
  const body = encodeURIComponent(
    partner
      ? "Hallo WellFit-Team,\n\nich interessiere mich für ein unverbindliches Gespräch über einen möglichen Partnerpilot.\n\nOrganisation / Ort:\nAnsprechperson:\nIdee:\n"
      : "Hallo WellFit-Team,\n\nich möchte über die weitere Entwicklung von WellFit informiert werden.\n\nName:\nInteresse (Erwachsenen-Alpha / Familie später / Partner / Sonstiges):\n",
  );

  if (!partner) {
    const routes = [
      {
        eyebrow: "ALPHA TESTEN",
        title: "Ich möchte WellFit erleben",
        copy: "Für Erwachsene, die eine der ersten Missionen ausprobieren und ehrliches Feedback geben möchten.",
        subject: "WellFit – Interesse an der Erwachsenen-Alpha",
        body: "Hallo WellFit-Team,\n\nich interessiere mich für die geplante Erwachsenen-Alpha.\n\nName:\nOrt / Region:\nWas mich an WellFit interessiert:\n",
        cta: "Für die Alpha vormerken",
      },
      {
        eyebrow: "PILOTPARTNER",
        title: "Ich möchte einen Ort verwandeln",
        copy: "Für Städte, Museen, Schulen, Tourismusorte, Vereine und Unternehmen mit einer Pilotidee.",
        subject: "WellFit – Interesse als Pilotpartner",
        body: "Hallo WellFit-Team,\n\nich interessiere mich für einen möglichen WellFit-Pilot.\n\nOrganisation / Ort:\nAnsprechperson:\nErste Idee:\n",
        cta: "Pilotidee besprechen",
      },
      {
        eyebrow: "VISION & WACHSTUM",
        title: "Ich möchte WellFit mit aufbauen",
        copy: "Für Investoren und strategische Partner, die über die gesamte Vision und ihre Entwicklung sprechen möchten.",
        subject: "WellFit – Interesse als Investor oder strategischer Partner",
        body: "Hallo WellFit-Team,\n\nich möchte mehr über die WellFit-Vision und eine mögliche Zusammenarbeit erfahren.\n\nName / Organisation:\nArt des Interesses:\nGewünschter Gesprächstermin:\n",
        cta: "Gespräch anfragen",
      },
    ] as const;

    return (
      <div className="contact-route-grid" aria-label="Kontaktwege zu WellFit">
        {routes.map((route) => (
          <article className="contact-route" key={route.eyebrow}>
            <span>{route.eyebrow}</span>
            <h3>{route.title}</h3>
            <p>{route.copy}</p>
            <a className="mail-contact-button" href={`mailto:hello@wellfit-now.io?subject=${encodeURIComponent(route.subject)}&body=${encodeURIComponent(route.body)}`}>
              {route.cta}<i aria-hidden="true">↗</i>
            </a>
          </article>
        ))}
        <small className="contact-route-note">Es gibt hier kein Webkonto und kein Datenbankformular. Erst dein E-Mail-Programm öffnet eine vorbereitete Nachricht.</small>
      </div>
    );
  }

  return (
    <div className={`interest-form contact-only ${partner ? "partner-interest-form" : ""}`}>
      <p>
        {partner
          ? "Schreib uns unverbindlich, welchen Ort oder welches Erlebnis du später gemeinsam mit WellFit entwickeln möchtest."
          : "Schreib uns unverbindlich, wenn du dich für die geplante Erwachsenen-Alpha oder eine spätere WellFit-Phase interessierst."}
      </p>
      <a className="mail-contact-button" href={`mailto:hello@wellfit-now.io?subject=${subject}&body=${body}`}>
        {partner ? "Pilotidee per E-Mail senden" : "Interesse per E-Mail senden"}<span aria-hidden="true">↗</span>
      </a>
      <small>Es gibt hier kein Webkonto und kein Datenbankformular. Erst dein E-Mail-Programm öffnet eine vorbereitete Nachricht.</small>
    </div>
  );
}
