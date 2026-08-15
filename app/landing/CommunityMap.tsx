"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";

const conceptCheckpoints = [
  {
    place: "WIEN · BEISPIEL",
    title: "Stadt-Rätselrallye",
    proof: "GPS-Bereich + Fassadenmarker",
    story: "Architektur entdecken, Hinweise verbinden und gemeinsam den nächsten Platz finden.",
    image: "/images/wellfit-checkpoint-wien-rallye-v3.webp",
    buddy: "/images/species/35-aschenfuchs.webp",
    buddyName: "Aschenfuchs",
    alt: "Zwei Erwachsene lösen mit dem Aschenfuchs eine Rätselrallye in einer österreichischen Stadt",
  },
  {
    place: "MÖDLING · BEISPIEL",
    title: "Outdoor-Testweg",
    proof: "GPS + Bildmarker + sichere Zone",
    story: "Bewegung, Wegprüfung und eine kurze Naturaufgabe auf einem sicheren Testweg kombinieren.",
    image: "/images/wellfit-checkpoint-moedling-outdoor-v3.webp",
    buddy: "/images/species/34-funkenwidder.webp",
    buddyName: "Funkenwidder",
    alt: "Zwei Erwachsene testen mit dem Funkenwidder eine sichere Bewegungsaufgabe im Freien",
  },
  {
    place: "WACHAU · BEISPIEL",
    title: "Burg- und Kulturpfad",
    proof: "QR / NFC / Wappenmarker",
    story: "Historische Stationen, Rätsel und ein digitales Fundstück entlang eines Kulturpfads verknüpfen.",
    image: "/images/wellfit-checkpoint-wachau-burg-v3.webp",
    buddy: "/images/species/28-obsidian-dachsritter.webp",
    buddyName: "Obsidian-Dachsritter",
    alt: "Zwei Erwachsene entdecken mit dem Obsidian-Dachsritter einen historischen Hinweis auf einem Burg- und Kulturpfad",
  },
  {
    place: "SALZBURG · BEISPIEL",
    title: "Museum & Altstadt",
    proof: "Exponatmarker + Stadtpunkt",
    story: "Innen- und Außenstationen verbinden ein Exponat mit der Geschichte der Altstadt.",
    image: "/images/wellfit-checkpoint-salzburg-museum-v3.webp",
    buddy: "/images/species/39-orbitgreif.webp",
    buddyName: "Orbitgreif",
    alt: "Zwei Erwachsene verbinden mit dem Orbitgreif einen Museumshinweis mit einer Station in der Altstadt",
  },
  {
    place: "GRAZ · BEISPIEL",
    title: "Team-Mission",
    proof: "Mehrere geprüfte Checkpoints",
    story: "Unterschiedliche Rollen und Hinweise führen ein erwachsenes Team gemeinsam zum Abschluss.",
    image: "/images/wellfit-checkpoint-graz-team-v3.webp",
    buddy: "/images/species/32-perlenschildwaechter.webp",
    buddyName: "Perlenschildwächter",
    alt: "Ein erwachsenes Team löst mit dem Perlenschildwächter eine gemeinsame Checkpoint-Mission",
  },
];

export default function CommunityMap() {
  const [activeCheckpoint, setActiveCheckpoint] = useState(0);
  const checkpoint = conceptCheckpoints[activeCheckpoint];

  return (
    <section className="checkpoint-community section" id="checkpoints">
      <aside><span>07</span><small>CHECKPOINTS</small></aside>
      <div>
        <p className="eyebrow">GEPLANTES ZUKUNFTSKONZEPT · KEINE LIVE-STANDORTE</p>
        <h2>Vom einzelnen Hinweis<br/><em>bis zur gemeinsamen Weltkarte.</em></h2>
        <p className="lead">Jeder Checkpoint soll eine eigene Aufgabe, Ortsprüfung und Geschichte besitzen. Wähle links einen beispielhaften Ort: Rechts siehst du direkt, wie sich die dort geplante Mission anfühlen könnte. Eine echte zoombare Karte folgt erst mit geprüften Partnerorten und korrekten Standortdaten.</p>

        <div className="community-map-shell checkpoint-explorer" data-swipe-ignore>
          <div className="community-map-list concept-checkpoint-list" role="group" aria-label="Geplanten WellFit-Beispielpunkt auswählen" data-swipe-ignore>
            <span>BEISPIELORTE · ANKLICKEN · NOCH NICHT AKTIV</span>
            {conceptCheckpoints.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={activeCheckpoint === index ? "active" : ""}
                aria-pressed={activeCheckpoint === index}
                aria-controls="checkpoint-preview"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setActiveCheckpoint(index)}
              >
                <small>{item.place}</small>
                <strong>{item.title}</strong>
                <em>{item.proof}</em>
                <p>{item.story}</p>
              </button>
            ))}
          </div>
          <div className="checkpoint-preview" id="checkpoint-preview" aria-live="polite">
            {conceptCheckpoints.map((item, index) => (
              <img
                key={item.title}
                src={item.image}
                alt={item.alt}
                aria-hidden={activeCheckpoint !== index}
                className={activeCheckpoint === index ? "active" : ""}
                loading="eager"
                decoding="async"
              />
            ))}
            <div className="checkpoint-preview-shade" aria-hidden="true" />
            <div className="checkpoint-preview-copy" key={checkpoint.title}>
              <span>{checkpoint.place}</span>
              <h3>{checkpoint.title}</h3>
              <p>{checkpoint.story}</p>
              <small>{checkpoint.proof}</small>
            </div>
          </div>
        </div>

        <div className="checkpoint-method-grid checkpoint-method-grid-compact">
          <article><span>DRAUSSEN</span><h3>GPS plus sichtbarer Marker</h3><p>Ein Radius allein soll nicht reichen. Erst die Kombination aus plausiblem Weg, Genauigkeit und einem QR-, Bild- oder Objektmarker bestätigt den Ort.</p></article>
          <article><span>DRINNEN</span><h3>QR, NFC oder Exponat</h3><p>In Museen und Burgen, wo GPS ungenau ist, sollen kurze lokale Prüfungen funktionieren – mit klarer Standzone und barrierefreier Alternative.</p></article>
        </div>

        <p className="eyebrow mayor-eyebrow">BÜRGERMEISTERSYSTEM · URSPRÜNGLICHE VISION · NOCH NICHT AKTIV</p>
        <h2 className="mayor-title">Drei Checkpoints erobern.<br/><em>Sieben Tage verteidigen.</em></h2>
        <p className="mayor-intro">Der Checkpoint ist nicht nur ein Wegpunkt, sondern eine spätere Wettbewerbsarena. Erwachsene treten dort in klaren Wissens-, Beobachtungs-, Bewegungs- oder Avataraufgaben gegeneinander an. Wer drei Checkpoints in seiner Umgebung gleichzeitig kontrolliert und alle drei sieben Tage hält, wird Bürgermeister.</p>

        <div className="checkpoint-duel-gallery" aria-label="Vier unterschiedliche Arten eines Checkpoint-Duells">
          <article><span>BEWEGUNGSDUELL · FUNKENWIDDER</span><h3>Liegestütze oder Balance</h3><p>Zwei Erwachsene absolvieren dieselbe sichere Aufgabe. Kamera und Sensoren prüfen Wiederholungen, Zeit und Bewegungsqualität – ohne Körperkontakt.</p></article>
          <article><span>MATHE-DUELL · QUASARKOBOLD</span><h3>Zehn Aufgaben. Eine Zeit.</h3><p>Beide lösen denselben freigegebenen Aufgabensatz. Richtige Antworten entscheiden zuerst, die Zeit erst danach.</p></article>
          <article><span>SPRACHE & WISSEN · SONNENKRANICH</span><h3>Buchstabieren, erinnern, kombinieren</h3><p>Ein Wort, eine lokale Wissensfrage oder eine Beobachtungsaufgabe macht den Ort zur fairen Lernarena.</p></article>
          <article><span>AVATAR-DUELL · NEBELPANTHER</span><h3>Die Buddys treten sichtbar an</h3><p>Schwert, Schild, Fähigkeiten, Pflegezustand und Level fließen in ein faires Matchmaking ein. Bezahlte Ausrüstung darf keinen Sieg kaufen.</p></article>
        </div>

        <div className="mayor-grid">
          <article><span>01 · HERAUSFORDERUNG</span><h3>Gegner finden</h3><p>Ein Spieler fordert am Checkpoint heraus. Das System sucht einen zweiten Erwachsenen für dieselbe Aufgabe und dieselben Regeln.</p></article>
          <article><span>02 · KÖNNEN</span><h3>Aufgabe entscheiden</h3><p>Zum Beispiel zehn Matheaufgaben, ein Wissensquiz, Beobachtung, Reaktion oder eine sichere Bewegungsprüfung. Das Ergebnis folgt dem Können – nicht dem Zufall.</p></article>
          <article><span>03 · CHECKPOINT</span><h3>Bestenplatz übernehmen</h3><p>Der bestätigte Sieger übernimmt oder verteidigt den Checkpoint. Neue Herausforderer können ihn innerhalb der vorgesehenen Zeitfenster wieder angreifen.</p></article>
          <article><span>04 · BÜRGERMEISTER</span><h3>Drei Orte · sieben Tage</h3><p>Erst drei gleichzeitig gehaltene Checkpoints und sieben ununterbrochene Verteidigungstage schalten den Bürgermeistertitel und die geplante Beteiligung frei.</p></article>
        </div>

        <div className="mayor-formula" aria-label="Geplanter Ablauf eines Checkpoint-Duells">
          <div><span>01</span><strong>Checkpoint</strong><b>WÄHLEN</b><p>Disziplin und klare Aufgabe ansehen.</p></div>
          <div><span>02</span><strong>Einsatz</strong><b>FESTLEGEN</b><p>Beide bestätigen denselben Einsatz an Wettbewerbspunkten.</p></div>
          <div><span>03</span><strong>Duell</strong><b>LÖSEN</b><p>Gleiche Regeln, geprüfte Leistung, kein Körperkontakt.</p></div>
          <div><span>04</span><strong>Ergebnis</strong><b>PRÜFEN</b><p>Sieger, Checkpointstatus und Verteidigungszeit aktualisieren.</p></div>
        </div>

        <div className="checkpoint-economy">
          <div className="economy-copy">
            <span>BEISPIEL MIT 10 EINSATZPUNKTEN</span>
            <h3>5 + 5 werden zu einem Kreislauf.</h3>
            <p>Setzen zwei Erwachsene beispielhaft je fünf Wettbewerbspunkte ein, erhält der bestätigte Gewinner sieben. Ein Punkt fließt in den Checkpoint-Pool; zwei Punkte verlassen zunächst den Spielumlauf. Ein qualifizierter Bürgermeister soll später an einem definierten Teil des Pools beziehungsweise der Checkpointgebühr beteiligt werden.</p>
          </div>
          <div className="economy-split" aria-label="Beispielhafte Verteilung von zehn Einsatzpunkten">
            <article><b>7</b><span>GEWINNER</span></article>
            <article><b>1</b><span>CHECKPOINT-POOL</span></article>
            <article><b>2</b><span>SYSTEM-SENKE</span></article>
          </div>
        </div>

        <div className="duel-rules">
          <article><span>BEGRIFF NOCH FESTZULEGEN</span><h3>Avatar-XP und Einsatzpunkte sauber trennen.</h3><p>In der ursprünglichen Idee heißen die gesetzten Einheiten XP. Weil XP auf der Website zugleich den dauerhaften Avatarfortschritt bezeichnet, ist für die endgültige Architektur ein getrenntes Wettbewerbskonto – etwa WFP oder WFXP – klarer. So verliert niemand versehentlich seinen normalen Entwicklungsstand.</p></article>
          <article><span>SPÄTERE TOKENPHASE · DETAILS IN „XP VS. TOKEN“</span><h3>Nur nach einem stabilen Produkt.</h3><p>Ein Burn-and-Reissue-Kreislauf, handelbare Sammlerstücke und jede reale Umsatzbeteiligung gehören nicht in die Alpha. Hier wird nur die Checkpoint-Logik erklärt; Obergrenze, Freigabetore und rechtliche Einordnung stehen gesammelt in der Welt „XP vs. Token“.</p></article>
        </div>

        <div className="sponsor-checkpoint">
          <div className="sponsor-checkpoint-copy">
            <span>MARKEN- & SPONSORENROUTEN · SPÄTERE PARTNERPHASE</span>
            <h3>Ein Checkpoint-Run kann zur eigenen Markenmission werden.</h3>
            <p>Eine Sportmarke wie Nike oder Adidas könnte beispielsweise eine geprüfte Lauf-, Geh- oder Teamroute mit mehreren realen Checkpoints unterstützen. WellFit ergänzt dazu AR-Story, Wissen, Bewegung und Buddy-Aufgaben. Das ist eine mögliche Kooperationsform – keine Behauptung einer bestehenden Partnerschaft.</p>
          </div>
          <div className="sponsor-checkpoint-steps">
            <article><b>01</b><strong>Route</strong><p>Marke und Ort definieren Thema, Zielgruppe und sichere Stationen.</p></article>
            <article><b>02</b><strong>Interne Belohnung</strong><p>Zunächst WFXP beziehungsweise spätere WFP, Abzeichen, Buddy-Futter oder ein Outfit – ohne Geldwert.</p></article>
            <article><b>03</b><strong>Partnernutzen</strong><p>Später freiwillige Coupons, Partnerpunkte oder Erlebnisse; optionales WFT erst nach dem 10.000-Nutzer-Tor und rechtlicher Prüfung.</p></article>
          </div>
          <p className="sponsor-reference">Reale Marktbeispiele zeigen, dass Community-Challenges, Laufziele und Partnerpunkte grundsätzlich funktionieren. WellFit erweitert dieses Prinzip um echte Checkpoints, Lernen und den AR-Buddy. <a href="https://www.nike.com/de/nrc-app/" target="_blank" rel="noreferrer">Nike Run Club ↗</a> <a href="https://www.adidas.com/us/running-app/" target="_blank" rel="noreferrer">adidas Running ↗</a></p>
        </div>
      </div>
    </section>
  );
}
