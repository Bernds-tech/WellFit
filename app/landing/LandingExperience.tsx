"use client";

/* Images are pre-compressed WebP assets; runtime image transformation is intentionally avoided. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type CSSProperties, type PointerEvent, type WheelEvent, useCallback, useEffect, useRef, useState } from "react";
import InterestForm from "./InterestForm";
import CommunityMap from "./CommunityMap";
import { buddyRoster, challengeModes, experiences } from "./content";
import { ThemeSwitcher, useColorTheme } from "../ThemeControls";

type World = "partner" | "token" | "home" | "tech" | "impact";

const worldOrder: World[] = ["partner", "token", "home", "tech", "impact"];

const worldLabels: Record<World, string> = {
  partner: "Partner",
  token: "XP vs. Token",
  home: "WellFit",
  tech: "Technik",
  impact: "Wirkung",
};

const worldHeroImages: Record<World, string> = {
  partner: "/images/partner-places-hero.webp",
  token: "/images/wft-ownership-editorial.webp",
  home: "/images/wellfit-buddy-cutout.webp",
  tech: "/images/tech-system-layers.webp",
  impact: "/images/impact-science-hero.webp",
};

const universeWorlds = [
  { world: "partner", section: "partner-orte", number: "01", label: "Partner", copy: "Orte, Unternehmen und Ideen werden zu echten Missionen.", tone: "gold" },
  { world: "token", section: "wft-grundmodell", number: "02", label: "XP vs. Token", copy: "Fortschritt heute. Eine mögliche Ökonomie erst viel später.", tone: "violet" },
  { world: "home", section: "idee", number: "03", label: "WellFit", copy: "Bewegung, Wissen, Buddys und reale Abenteuer verbinden sich.", tone: "aqua" },
  { world: "tech", section: "technik-systeme", number: "04", label: "Technik", copy: "AR, KI und Sicherheit machen die reale Welt spielbar.", tone: "cyan" },
  { world: "impact", section: "wirkung-warum", number: "05", label: "Wirkung", copy: "Bewegung, Lernen und Gemeinschaft erhalten einen neuen Zugang.", tone: "emerald" },
] as const satisfies readonly { world: World; section: string; number: string; label: string; copy: string; tone: string }[];

const visionPaths = [
  { number: "01", label: "Ich will ein Abenteuer erleben", copy: "Beginne mit einer vollständigen Mission und folge der verschwundenen Burgbotschaft.", world: "home", section: "mission" },
  { number: "02", label: "Ich will die Buddys kennenlernen", copy: "Entdecke persönliche Begleiter, Ausrüstung und die wachsende WellFit-Familie.", world: "home", section: "buddy" },
  { number: "03", label: "Ich will verstehen, wie es funktioniert", copy: "Steige über AR, KI, Datenfluss und sichere Checkpoints in die Technik ein.", world: "tech", section: "technik-systeme" },
  { number: "04", label: "Ich will die Wirkung verstehen", copy: "Erfahre, wie Bewegung, multisensorisches Lernen und Gemeinschaft zusammenspielen.", world: "impact", section: "wirkung-warum" },
  { number: "05", label: "Ich will WellFit möglich machen", copy: "Sieh dir an, wie Städte, Museen, Schulen, Marken und Unternehmen mitwirken können.", world: "partner", section: "partner-orte" },
  { number: "06", label: "Ich denke an die spätere Ökonomie", copy: "Starte bei XP, WFT und den Bedingungen für eine mögliche Token-Zukunft.", world: "token", section: "wft-grundmodell" },
] as const satisfies readonly { number: string; label: string; copy: string; world: World; section: string }[];

type SpeciesRealm = "land" | "erde" | "wasser" | "feuer" | "luft" | "all";

const speciesRealms = [
  { id: "land", number: "01", label: "Land", symbol: "♧", copy: "Alltagswege, Nähe und persönliche Begleitung" },
  { id: "erde", number: "02", label: "Erde", symbol: "◆", copy: "Wurzeln, Gestein und verborgene Naturpfade" },
  { id: "wasser", number: "03", label: "Wasser", symbol: "≈", copy: "Rhythmus, Ruhe und Entdeckung am Gewässer" },
  { id: "feuer", number: "04", label: "Feuer", symbol: "✦", copy: "Energie, Mut und schöpferische Kraft" },
  { id: "luft", number: "05", label: "Luft", symbol: "↟", copy: "Weitblick, Balance und neue Perspektiven" },
  { id: "all", number: "06", label: "Aus dem All", symbol: "◎", copy: "Vorstellungskraft, Sterne und unbekannte Wege" },
] as const satisfies readonly { id: SpeciesRealm; number: string; label: string; symbol: string; copy: string }[];

const homeChapters = [
  { id: "idee", number: "01", label: "Prinzip" },
  { id: "status", number: "02", label: "Stand" },
  { id: "mission", number: "03", label: "Mission" },
  { id: "buddy", number: "04", label: "Buddy" },
  { id: "erlebnis", number: "05", label: "Erlebnisse" },
  { id: "welt", number: "06", label: "Fortschritt" },
  { id: "checkpoints", number: "07", label: "Checkpoints" },
  { id: "moeglichkeiten", number: "08", label: "Möglichkeiten" },
  { id: "familie", number: "09", label: "Gemeinschaft" },
  { id: "balance", number: "10", label: "Balance" },
  { id: "verantwortung", number: "11", label: "Verantwortung" },
] as const;

type ChapterId = (typeof homeChapters)[number]["id"];

const partnerChapters = [
  { id: "partner-orte", number: "01", label: "Wer mitmacht" },
  { id: "partner-mission", number: "02", label: "Der Ablauf" },
  { id: "partner-modell", number: "03", label: "Geschäftsmodell" },
] as const;

const wftChapters = [
  { id: "wft-grundmodell", number: "01", label: "Drei Ebenen" },
  { id: "wft-roadmap", number: "02", label: "Freigabetore" },
  { id: "wft-verteilung", number: "03", label: "Verteilung" },
  { id: "wft-kreislauf", number: "04", label: "Kreislauf" },
  { id: "wft-nutzen", number: "05", label: "Nutzen" },
  { id: "wft-archiv", number: "06", label: "Archivphasen" },
  { id: "wft-editionen", number: "07", label: "Editionen" },
] as const;

const tokenDistribution = [
  { label: "Community & Belohnungen", amount: "15 Mrd.", share: "60 %", tone: "community" },
  { label: "Reserve", amount: "7,99 Mrd.", share: "31,96 %", tone: "reserve" },
  { label: "Historische Unterstützerphasen", amount: "1 Mrd.", share: "4 %", tone: "presale" },
  { label: "Team & Beratung", amount: "1 Mrd.", share: "4 %", tone: "team" },
  { label: "Partnerschaften", amount: "10 Mio.", share: "0,04 %", tone: "partners" },
] as const;

const historicalTokenPhases = [
  { phase: "01 · OG", price: "0,005 USD", amount: "100 Mio. WFT", proceeds: "500.000 USD", euros: "ca. 433.501 €" },
  { phase: "02", price: "0,010 USD", amount: "150 Mio. WFT", proceeds: "1,5 Mio. USD", euros: "ca. 1.300.503 €" },
  { phase: "03", price: "0,020 USD", amount: "200 Mio. WFT", proceeds: "4 Mio. USD", euros: "ca. 3.468.008 €" },
  { phase: "04", price: "0,040 USD", amount: "250 Mio. WFT", proceeds: "10 Mio. USD", euros: "ca. 8.670.019 €" },
  { phase: "05", price: "0,060 USD", amount: "300 Mio. WFT", proceeds: "18 Mio. USD", euros: "ca. 15.606.034 €" },
] as const;

const wftUtilities = [
  { number: "01 · VERSORGEN", title: "Futter & Pflege", image: "/images/wft-utility-care-v3.webp", alt: "Der Korallenluchs wird in einer magischen Pflegestation versorgt", guide: "KORALLENLUCHS", text: "Mit WFT könnten digitale Nahrung, Wasser, Energie-, Wellness- und Pflegeobjekte erworben werden – ohne eine echte Gesundheitswirkung zu behaupten." },
  { number: "02 · AUSRÜSTEN", title: "Schwert, Schild & Kleidung", image: "/images/wft-utility-equipment-v3.webp", alt: "Der Obsidian-Dachsritter wählt Ausrüstung und Kleidung in einer magischen Rüstkammer", guide: "OBSIDIAN-DACHSRITTER", text: "Werkzeuge, Rüstung, Sommer- und Winterkleidung könnten mit WFT erworben werden und Spielweisen erweitern, aber keine echte Leistung ersetzen." },
  { number: "03 · SAMMELN", title: "Seltene Fundstücke & NFTs", image: "/images/wft-utility-collectibles-v3.webp", alt: "Die Nebelkrake entdeckt seltene Fundstücke und ein vollständiges Sammlungsset", guide: "NEBELKRAKE", text: "Dauerhafte Burgwappen, Ortseditionen, legendäre Ausrüstung und vollständige Sets könnten als seltene NFTs mit WFT erworben werden." },
  { number: "04 · ERLEBEN", title: "Zusatzmissionen & Events", image: "/images/wft-utility-events-v3.webp", alt: "Der Lavaphönix öffnet den Weg zu einer Burgveranstaltung und einer Outdoor-Gruppenmission", guide: "LAVAPHÖNIX", text: "Freiwillige Partnerpfade, Sondermissionen, Turniere oder digitale Begleitangebote können mit WFT freigeschaltet werden." },
  { number: "05 · GESTALTEN", title: "Herstellen, verbessern, reparieren", image: "/images/wft-utility-crafting-v3.webp", alt: "Der Magmaschmied verbindet Fundstücke und repariert Ausrüstung", guide: "MAGMASCHMIED", text: "Mehrere Fundstücke lassen sich zu einem neuen Objekt verbinden; Reparatur und Anpassung erzeugen einen verständlichen Kreislauf." },
  { number: "06 · AUSTAUSCHEN", title: "Marktplatz & Partnernutzen", image: "/images/wft-utility-marketplace-v3.webp", alt: "Der Sternenwal begleitet einen möglichen Marktplatz für Tickets, Sportartikel und Sammlerstücke", guide: "STERNENWAL", text: "Später denkbar sind Tausch, Tickets, Rabatte oder Partnerartikel. Eine Plattformgebühr kann den Betrieb und die Reserve speisen." },
] as const;

const techChapters = [
  { id: "technik-systeme", number: "01", label: "Systeme" },
  { id: "technik-datenfluss", number: "02", label: "Datenfluss" },
  { id: "technik-checkpoints", number: "03", label: "Checkpoints" },
  { id: "technik-ar", number: "04", label: "AR & Offline" },
  { id: "technik-sicherheit", number: "05", label: "Sicherheit" },
] as const;

const impactChapters = [
  { id: "wirkung-warum", number: "01", label: "Warum" },
  { id: "wirkung-prinzip", number: "02", label: "Wirkungsprinzip" },
  { id: "wirkung-lernen", number: "03", label: "Multisensorisch" },
  { id: "wirkung-zielgruppen", number: "04", label: "Zielgruppen" },
  { id: "wirkung-pilot", number: "05", label: "Pilot" },
] as const;

const productRoadmap = [
  {
    phase: "HEUTE",
    title: "Vision & Informationsseite",
    text: "Diese Landingpage zeigt verständlich, was WellFit werden soll, welche Erlebnisse geplant sind und in welcher Reihenfolge geprüft wird. Sie ist bewusst noch keine WellFit-App.",
  },
  {
    phase: "VORBEREITUNG",
    title: "Android-Basis & echter AR-Buddy",
    text: "Profile, Missionen und Fortschritt werden an die neue Produktvision angepasst. Getestet wird zuerst auf Android – mit Kamera-AR, Abstand, Bewegung und Hinderniserkennung.",
  },
  {
    phase: "ERSTE ALPHA",
    title: "Etwa 25 Erwachsene · Outdoor",
    text: "Ausgewählte Erwachsene ab 18 testen sichere Tages- und Wochenmissionen, Aufgaben, Challenges und reale Checkpoints in Parks und auf offenen Wegen.",
  },
  {
    phase: "PRODUKTBEWEIS",
    title: "Stabilisieren, messen, verbessern",
    text: "Verständlichkeit, Gerätequalität, Datenschutz, Missionserfolg und Schutz vor Manipulation werden ausgewertet. Erst ein stabiler Kern öffnet die nächste Phase.",
  },
  {
    phase: "PARTNERPILOT",
    title: "Museum, Burg & Stadt · Erwachsene",
    text: "Erste Partnerorte erproben geprüfte Routen, Marker, Aufgaben, Sicherheitszonen, digitale Fundstücke und ein nachvollziehbares Inventar.",
  },
  {
    phase: "FAMILIENPHASE",
    title: "Familien & Kinder mit Schutz",
    text: "Familien folgen erst nach Erwachsenenpiloten sowie Guardian-, Datenschutz- und Sicherheitsfreigabe. Jede Generation erhält eine passende Rolle.",
  },
  {
    phase: "AUSBAU",
    title: "iPhone, Community & weitere Geräte",
    text: "Nach einer stabilen Android-Version können iPhone, Wearables, weitere Partnerpfade und größere gemeinschaftliche Erlebnisse schrittweise folgen.",
  },
  {
    phase: "OPTIONALE ZUKUNFT",
    title: "Technologie erst nach 10.000 stabilen Nutzern",
    text: "WFT, SUI oder eine andere Blockchain werden nur bei echtem Zusatznutzen, rechtlicher Freigabe und frühestens nach einem stabilen Lauf mit mindestens 10.000 Nutzern geprüft.",
  },
] as const;

type Chapter = { id: string; number: string; label: string };

function ChapterNav({ chapters, activeId, onChapter }: { chapters: readonly Chapter[]; activeId?: string; onChapter?: (id: ChapterId) => void }) {
  return (
    <nav className="chapter-nav" aria-label="Kapitel dieser WellFit-Welt" data-swipe-ignore style={{ "--chapter-count": chapters.length } as CSSProperties}>
      {chapters.map((chapter) => (
        <a
          key={chapter.id}
          href={`#${chapter.id}`}
          className={activeId === chapter.id ? "active" : ""}
          aria-current={activeId === chapter.id ? "location" : undefined}
          aria-label={`${chapter.number} – ${chapter.label}`}
          onClick={() => onChapter?.(chapter.id as ChapterId)}
        >
          <b>{chapter.number}</b>
          <span>{chapter.label}</span>
        </a>
      ))}
    </nav>
  );
}

function WorldLogo({ onHome }: { onHome: () => void }) {
  return (
    <Link className="side-world-logo" href="/?welt=wellfit" aria-label="Zur WellFit-Erlebniswelt" onClick={(event) => { event.preventDefault(); onHome(); }}>
      <img src="/images/wellfit-logo.webp" alt="WellFit – Move, Learn, Grow" width="700" height="548" />
    </Link>
  );
}

function UniverseMap({ onNavigate }: { onNavigate: (world: World, section: string) => void }) {
  const center = universeWorlds.find((item) => item.world === "home")!;
  const satellites = universeWorlds.filter((item) => item.world !== "home");

  return (
    <section className="universe" id="universum" aria-labelledby="universe-title">
      <div className="universe-heading">
        <div>
          <p className="eyebrow">DAS WELLFIT-UNIVERSUM</p>
          <h2 id="universe-title">Eine Vision.<br/><em>Fünf verbundene Welten.</em></h2>
        </div>
        <p>WellFit ist mehr als eine einzelne Anwendung. Im Zentrum steht das reale Erlebnis. Technik, Wirkung, Partner sowie XP und eine mögliche spätere Token-Ebene erweitern dieselbe große Idee.</p>
      </div>

      <div className="universe-layout">
        <div className="universe-map" aria-label="Karte der fünf WellFit-Welten">
          <div className="universe-orbit universe-orbit-one" aria-hidden="true" />
          <div className="universe-orbit universe-orbit-two" aria-hidden="true" />
          <span className="universe-link universe-link-one" aria-hidden="true" />
          <span className="universe-link universe-link-two" aria-hidden="true" />
          <span className="universe-link universe-link-three" aria-hidden="true" />
          <span className="universe-link universe-link-four" aria-hidden="true" />

          <button className={`universe-node universe-center universe-tone-${center.tone}`} type="button" onClick={() => onNavigate(center.world, center.section)}>
            <span>{center.number}</span><b>{center.label}</b><small>{center.copy}</small><i aria-hidden="true">↘</i>
          </button>
          {satellites.map((item, index) => (
            <button key={item.world} className={`universe-node universe-satellite universe-satellite-${index + 1} universe-tone-${item.tone}`} type="button" onClick={() => onNavigate(item.world, item.section)}>
              <span>{item.number}</span><b>{item.label}</b><small>{item.copy}</small><i aria-hidden="true">↗</i>
            </button>
          ))}
        </div>

        <div className="vision-paths" aria-label="Verschiedene Einstiege in die WellFit-Vision">
          <div className="vision-paths-intro"><span>DEIN EINSTIEG</span><h3>Was möchtest du<br/><em>zuerst entdecken?</em></h3><p>Du entscheidest nur, wo deine Reise beginnt. Alle Inhalte und alle fünf Welten bleiben jederzeit erreichbar.</p></div>
          <div className="vision-path-list">
            {visionPaths.map((path) => (
              <button key={path.number} type="button" onClick={() => onNavigate(path.world, path.section)}>
                <b>{path.number}</b><span><strong>{path.label}</strong><small>{path.copy}</small></span><i aria-hidden="true">↗</i>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const proofSteps = [
  { time: "00–03", label: "BUDDY", title: "Dein Begleiter erscheint", copy: "Er erklärt die Mission – dann kann das Handy wieder sinken.", signal: "MISSION GEFUNDEN", image: "/images/wellfit-experience-stadt-v3.webp", alt: "Der Landdrache eröffnet eine Rätselrallye in der Stadt" },
  { time: "03–06", label: "HINWEIS", title: "Hören, sehen, losgehen", copy: "Ein kurzer Audiohinweis lenkt den Blick in die reale Umgebung.", signal: "NOCH 180 METER", image: "/images/wellfit-experience-tiergarten-v3.webp", alt: "Der Sonnenkranich führt über leuchtende Spuren durch den Tiergarten" },
  { time: "06–09", label: "CHECKPOINT", title: "Der echte Ort reagiert", copy: "Erst am sicheren Ziel wird die nächste Spur freigegeben.", signal: "ORT BESTÄTIGT", image: "/images/wellfit-experience-burg-v3.webp", alt: "Der Pfadschild-Ritter wartet am bestätigten Burgtor" },
  { time: "09–12", label: "RÄTSEL", title: "Gemeinsam wird es lösbar", copy: "Bewegung, Wissen und Beobachtung verbinden sich zum Fortschritt.", signal: "FUNDSTÜCK ERHALTEN", image: "/images/wellfit-experience-museum-v3.webp", alt: "Der Quasarkobold begleitet ein Rätsel im Museum" },
] as const;

function ExperienceProof() {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setStep((current) => (current + 1) % proofSteps.length), 3000);
    return () => window.clearInterval(timer);
  }, [playing]);

  const current = proofSteps[step];

  return (
    <section className="experience-proof" aria-labelledby="proof-title">
      <div className="experience-proof-copy">
        <p className="eyebrow">12 SEKUNDEN · SO FÜHLT SICH WELLFIT AN</p>
        <h2 id="proof-title">Kurz aufs Display.<br/><em>Dann ins echte Leben.</em></h2>
        <p>Diese animierte Konzeptsequenz verdichtet eine Mission auf vier Momente. Sie zeigt nicht nur, was WellFit kann – sondern wie wenig Bildschirm es dafür braucht.</p>
        <div className="proof-step-list" role="tablist" aria-label="Vier Momente einer WellFit-Mission">
          {proofSteps.map((item, index) => (
            <button className={index === step ? "active" : ""} key={item.time} type="button" role="tab" aria-selected={index === step} onClick={() => { setStep(index); setPlaying(false); }}>
              <span>{item.time}</span><b>{item.label}</b>
            </button>
          ))}
        </div>
        <button className="proof-play" type="button" onClick={() => setPlaying((value) => !value)}>
          {playing ? "Sequenz anhalten" : "Sequenz abspielen"}<span aria-hidden="true">{playing ? "Ⅱ" : "▶"}</span>
        </button>
      </div>
      <div className={`proof-device proof-stage-${step}`} aria-live="polite">
        <div className="proof-device-top"><span>WELLFIT · LIVE-MISSION</span><i>{current.time} SEK.</i></div>
        <div className="proof-scene">
          <img className="proof-scene-image" key={current.image} src={current.image} alt={current.alt} />
          <div className="proof-scene-shade" aria-hidden="true" />
          <div className="proof-route" aria-hidden="true"><i/><i/><i/><i/></div>
          <div className="proof-checkpoint" aria-hidden="true"><span>⌾</span></div>
          <div className="proof-signal"><span>{current.label}</span><strong>{current.signal}</strong></div>
        </div>
        <div className="proof-device-copy"><span>{current.time}</span><div><strong>{current.title}</strong><p>{current.copy}</p></div></div>
        <div className="proof-progress" aria-hidden="true"><i style={{ width: `${((step + 1) / proofSteps.length) * 100}%` }} /></div>
      </div>
    </section>
  );
}

function ChapterTransition({ from, to, title, label, href, variant = 1 }: { from: string; to: string; title: string; label: string; href: string; variant?: number }) {
  return (
    <a className={`chapter-transition chapter-transition-${variant}`} href={href} aria-label={`${label}: ${title}`}>
      <span>{from} <i aria-hidden="true">→</i> {to}</span>
      <strong>{title}</strong>
      <small>{label} <i aria-hidden="true">↘</i></small>
    </a>
  );
}

function BuddyCast({ eyebrow, title, numbers }: { eyebrow: string; title: string; numbers: readonly string[] }) {
  const cast = buddyRoster.filter((buddy) => numbers.includes(buddy.number));
  return (
    <section className="world-buddy-cast" aria-label={title}>
      <div className="world-buddy-cast-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>Jede Spezies hat eine erkennbare Rolle und gehört zur selben WellFit-Familie. Diese Auswahl zeigt nur einen Teil – mit neuen Orten, Missionen und Geschichten wächst die Familie weiter.</p>
      </div>
      <div className="world-buddy-cast-track" data-swipe-ignore tabIndex={0}>
        {cast.map((buddy) => (
          <article key={buddy.number}>
            <img src={buddy.image} alt={`${buddy.name}, Fabelwesen für ${buddy.role}`} loading="lazy" decoding="async" />
            <div><span>{buddy.number} · {buddy.world}</span><h3>{buddy.name}</h3><p>{buddy.role}</p></div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PartnerWorld({ onHome }: { onHome: () => void }) {
  return (
    <div className="side-world partner-world">
      <header className="side-world-header">
        <WorldLogo onHome={onHome} />
        <ChapterNav chapters={partnerChapters} />
        <div className="side-world-title"><b>PARTNER & ORTE</b></div>
      </header>

      <section className="side-hero partner-hero">
        <div className="side-hero-picture" aria-hidden="true">
          <img src="/images/partner-places-hero.webp" alt="" loading="eager" fetchPriority="low" decoding="async" />
        </div>
        <div className="side-hero-picture-shade" aria-hidden="true" />
        <div className="side-hero-copy">
          <p className="eyebrow">ORTE WERDEN ZU ERLEBNISSEN</p>
          <h1>Aus einem Besuch<br/><em>wird eine Mission.</em></h1>
          <p>Museen, Städte, Schulen, Unternehmen und Händler können reale Orte mit Bewegung, Wissen und einer freiwilligen digitalen Geschichte verbinden.</p>
          <div className="concept-status"><span/>PARTNERMODELL · SCHRITTWEISE PILOTIERUNG</div>
        </div>
        <div className="side-hero-index"><span>PARTNER & ORTE</span><b>01 / 05</b></div>
      </section>

      <BuddyCast eyebrow="DREI PARTNERWELTEN · DREI CHARAKTERE" title="Orte bekommen ihre eigene Begleitung." numbers={["08", "11", "13"]} />

      <section id="partner-orte" className="side-section partner-types-section">
        <div className="side-section-label"><span>01</span><small>WER MITMACHT</small></div>
        <div className="side-section-content">
          <p className="eyebrow">EIN SYSTEM · VIELE REALE ANWENDUNGEN</p>
          <h2>Jeder Ort erzählt<br/><em>eine andere Geschichte.</em></h2>
          <p className="side-lead">WellFit liefert die gemeinsame Technik. Der Partner bringt den Ort, das Wissen oder den Anlass ein. Daraus entsteht eine geprüfte Mission, die Menschen wirklich dorthin bewegt.</p>
          <div className="partner-type-grid">
            <article><span>01</span><h3>Museen & Kultur</h3><p>Exponate werden zu Hinweisen, Räume zu Kapiteln und Wissen zu einer Entdeckungsreise.</p><small>AR-QUIZ · SAMMLUNGEN · SONDERROUTEN</small></article>
            <article><span>02</span><h3>Tiergärten & Natur</h3><p>Tierspuren, Artenwissen und Naturschutz verbinden Beobachtung mit Bewegung.</p><small>SAFARI · LERNPFAD · FAMILIENMISSION</small></article>
            <article><span>03</span><h3>Städte & Tourismus</h3><p>Geschichte, Plätze und regionale Besonderheiten werden als begehbare Route inszeniert.</p><small>STADTPFAD · KULTUR · REGION</small></article>
            <article><span>04</span><h3>Schulen & Bildung</h3><p>Lehrkräfte kombinieren Bewegung mit altersgerechten Fragen, Teamrollen und Lernzielen.</p><small>PAUSE · UNTERRICHT · PROJEKTTAG</small></article>
            <article><span>05</span><h3>Unternehmen</h3><p>Freiwillige Team-Challenges unterstützen gemeinsame Aktivität und Corporate Wellness.</p><small>TEAMS · EVENTS · B2B</small></article>
            <article><span>06</span><h3>Handel & Marken</h3><p>Ein klar gekennzeichneter Sponsorpfad kann zu einem Geschäft führen und dort echten Nutzen bieten.</p><small>CHECKPOINT · COUPON · AR-SZENE</small></article>
          </div>
        </div>
      </section>

      <section className="partner-story-grid" aria-label="Beispiele für WellFit-Partnerwelten">
        <article className="partner-story story-large">
          <img src="/images/wellfit-museum-editorial.webp" alt="Eine Familie erlebt eine WellFit-Mission in einem Museum" loading="lazy" decoding="async" />
          <div><span>KULTUR</span><h3>Das Museum wird begehbar.</h3><p>Ein Fossil, ein Gemälde oder ein historisches Objekt öffnet den nächsten Hinweis.</p></div>
        </article>
        <article className="partner-story">
          <img src="/images/wft-ar-supermarket.webp" alt="Eine freiwillige WellFit-Partnerroute führt zu einem Geschäft" loading="lazy" decoding="async" />
          <div><span>HANDEL</span><h3>Werbung bekommt einen Zweck.</h3><p>Freiwillig starten, vor Ort etwas erleben und einen klaren Vorteil erhalten.</p></div>
        </article>
        <article className="partner-story">
          <img src="/images/wellfit-family-zoo-editorial.webp" alt="Drei Generationen erleben eine WellFit-Route im Tiergarten" loading="lazy" decoding="async" />
          <div><span>SPÄTERE FAMILIENPHASE</span><h3>Ein Ausflug braucht alle.</h3><p>Nach den Erwachsenenpiloten übernimmt jede Generation eine andere Rolle und trägt zum gemeinsamen Ziel bei.</p></div>
        </article>
      </section>

      <section className="venue-blueprints" aria-label="Geplanter Ablauf für Museum und Burg">
        <article><p className="eyebrow">GEPLANTER ERWACHSENEN-PARTNERPILOT · MUSEUM</p><h2>Vom Eingang bis zum Fundstück.</h2><ol><li>Tour, Dauer, Sprache und Barrierefreiheit wählen</li><li>Am Eingang über QR oder Personalcode starten</li><li>Im Saal Bildmarker, QR oder NFC bestätigen</li><li>AR-Fundstück am echten Exponat untersuchen</li><li>Beobachtungs- oder Wissensfrage lösen</li><li>Nächsten Saal freischalten und Handy wieder senken</li><li>Interne Punkte und ein nicht handelbares Museumsabzeichen erhalten</li></ol></article>
        <article><p className="eyebrow">GEPLANTER ERWACHSENEN-PARTNERPILOT · BURG</p><h2>Vom Burgtor zur Botschaft.</h2><ol><li>Weg, Öffnungszeiten und sichere Standzonen prüfen</li><li>Wappen am ersten Tor als Marker entdecken</li><li>Karte, Rüstkammer und historische Hinweise verbinden</li><li>Sichere Ritter-Bewegungsprüfung absolvieren</li><li>Fragmente zur geheimen Botschaft zusammensetzen</li><li>Geplante Prüfregeln bestätigen Checkpoints und Missionsverlauf</li><li>Interne Punkte, Burgabzeichen und digitales Fundstück erhalten</li></ol></article>
      </section>

      <section id="partner-mission" className="side-section partner-flow-section">
        <div className="side-section-label"><span>02</span><small>DER ABLAUF</small></div>
        <div className="side-section-content">
          <p className="eyebrow">VOM ORT ZUR GEPRÜFTEN WELLFIT-MISSION</p>
          <h2>Ein Partner liefert die Idee.<br/><em>WellFit macht sie spielbar.</em></h2>
          <div className="partner-flow">
            <article><b>01</b><span>BRIEFING</span><h3>Ziel festlegen</h3><p>Ort, Zielgruppe, Lernziel, Bewegung und gewünschter Nutzen werden gemeinsam beschrieben.</p></article>
            <article><b>02</b><span>EDITOR</span><h3>Mission gestalten</h3><p>Ein späterer Partnereditor soll Route, Buddy-Dialog, Aufgaben, Medien, digitale Fundstücke und Belohnung zu einer verständlichen Geschichte verbinden.</p></article>
            <article><b>03</b><span>PRÜFUNG</span><h3>Sicher freigeben</h3><p>Altersstufe, Weg, Barrierefreiheit, Datenschutz, Werbung und Rechte werden kontrolliert.</p></article>
            <article><b>04</b><span>CHECKPOINTS</span><h3>Am Ort verankern</h3><p>GPS, Kamera, QR oder Marker öffnen Inhalte nur an den passenden Missionspunkten.</p></article>
            <article><b>05</b><span>LERNEN</span><h3>Anonym verbessern</h3><p>Der Partner sieht Reichweite und Abschlüsse als zusammengefasste Werte – keine privaten Routen.</p></article>
          </div>
          <div className="partner-editor-note"><strong>Der Partnereditor ist Teil der Produktplanung – noch kein verfügbares Werkzeug.</strong><p>Er soll später Reihenfolge, Koordinaten, Radius, GPS-/QR-/NFC-/Bildmarker-Prüfung, Aufgabe, sichere Standzone, barrierefreie Alternative, Technik-Fallback und interne Punkte je Checkpoint beschreiben. Als geplante Qualitätsregel soll eine Route erst ab mindestens drei vollständig geprüften Checkpoints freigegeben werden.</p></div>
        </div>
      </section>

      <section id="partner-modell" className="side-section partner-model-section">
        <div className="side-section-label"><span>03</span><small>GESCHÄFTSMODELL</small></div>
        <div className="side-section-content">
          <p className="eyebrow">WIE PARTNER UND WELLFIT GEMEINSAM WERT SCHAFFEN</p>
          <h2>Mehrere Einnahmewege.<br/><em>Ein nachvollziehbarer Nutzen.</em></h2>
          <p className="side-lead">Die konkrete Preisgestaltung entsteht erst mit Pilotpartnern. Geplant ist ein nachvollziehbarer Mix aus Zugang, Produktion und freiwilligen Zusatzangeboten.</p>
          <div className="model-grid">
            <article><span>LIZENZ</span><h3>Partnerzugang</h3><p>Werkzeuge, Dashboard und veröffentlichte Missionen als B2B- oder Jahresmodell.</p></article>
            <article><span>PRODUKTION</span><h3>Content & AR</h3><p>Konzeption, 3D-Inhalte, Story und technische Umsetzung als Projektleistung.</p></article>
            <article><span>ERLEBNIS</span><h3>Premium-Zugang</h3><p>Optionale Sonderrouten, Events oder Pakete mit klar ausgewiesenem Mehrwert.</p></article>
            <article><span>SPONSORING</span><h3>Freiwillige Missionen</h3><p>Gekennzeichnete Markenpfade oder lokale Aktionen – ohne versteckte Werbung.</p></article>
            <article><span>MARKTPLATZ</span><h3>Faire Beteiligung</h3><p>Gebühr oder Erlösanteil nur bei tatsächlich verkauften Partnerinhalten.</p></article>
          </div>
          <div className="partner-data-rule"><strong>Was Partner sehen dürfen</strong><p>Starts, Abschlüsse, freiwillige Coupon-Einlösungen und zusammengefasste Nutzung. Keine Buddy-Gespräche, Kinderprofile, Gesundheitswerte oder vollständigen Bewegungsrouten.</p></div>
        </div>
      </section>

      <section id="partner-pilot" className="partner-cta">
        <div className="partner-pilot-copy">
          <p className="eyebrow">DIE ERSTEN ORTE WERDEN GEMEINSAM GEBAUT</p>
          <h2>Ein guter Pilot beginnt<br/><em>mit einer echten Route.</em></h2>
          <p>Vorschlag für den ersten gemeinsamen Pilot: sechs bis acht Wochen von Briefing bis Auswertung, eine überschaubare Route, drei bis fünf Checkpoints und eine klar definierte Testgruppe.</p>
          <div className="pilot-package">
            <article><span>DER PARTNER BRINGT</span><p>Ort, Ansprechperson, Zugangs- und Sicherheitswissen, Inhaltsrechte sowie eine kleine Testgruppe.</p></article>
            <article><span>WELLFIT ÜBERNIMMT</span><p>Story, Aufgaben, AR-Konzept, Checkpoints, Datenschutzprüfung, Testbegleitung und verständliche Auswertung.</p></article>
            <article><span>EINE SPÄTERE AUSWERTUNG KÖNNTE ZEIGEN</span><p>Starts, Abschlüsse, Abbruchpunkte, freiwillige Rückmeldungen und zusammengefasste Nutzung – keine privaten Bewegungsprofile.</p></article>
          </div>
        </div>
        <div className="partner-pilot-form">
          <p className="eyebrow">PILOTINTERESSE</p>
          <h3>Welchen Ort wollen wir gemeinsam spielbar machen?</h3>
          <InterestForm partner />
        </div>
      </section>
    </div>
  );
}

function TokenWorld({ onHome }: { onHome: () => void }) {
  return (
    <div className="side-world token-world">
      <header className="side-world-header">
        <WorldLogo onHome={onHome} />
        <ChapterNav chapters={wftChapters} />
        <div className="side-world-title"><b>XP VS. TOKEN</b></div>
      </header>

      <section className="side-hero token-hero">
        <div className="side-hero-picture token-hero-picture" aria-hidden="true">
          <img src="/images/wft-ownership-editorial.webp" alt="" loading="eager" fetchPriority="low" decoding="async" />
        </div>
        <div className="side-hero-picture-shade" aria-hidden="true" />
        <div className="side-hero-copy">
          <p className="eyebrow">OPTIONAL · SPÄTER · NICHT FÜR DIE ALPHA</p>
          <h1>WellFit braucht<br/><em>keinen Token.</em></h1>
          <p>Die geplante Alpha soll ausschließlich mit internen WFXP funktionieren – ohne Wallet und ohne Geldwert. WFT bleibt eine mögliche spätere Erweiterung und darf frühestens nach einem stabilen Lauf mit mindestens 10.000 Nutzern überhaupt geprüft werden.</p>
          <div className="concept-status"><span/>KEIN TOKENVERKAUF · KEIN LAUNCHTERMIN · KEIN WERTVERSPRECHEN</div>
        </div>
        <div className="side-hero-index"><span>XP VS. TOKEN</span><b>02 / 05</b></div>
      </section>

      <section id="wft-grundmodell" className="side-section token-layers">
        <div className="side-section-label"><span>01</span><small>DREI EBENEN</small></div>
        <div className="side-section-content">
          <p className="eyebrow">EINE ALPHA-EINHEIT · SPÄTER EINE SAUBERE TRENNUNG</p>
          <h2>Drei Entwicklungsstufen.<br/><em>Keine Vermischung.</em></h2>
          <div className="value-ladder">
            <article><b>WFXP</b><span>01</span><h3>Alpha-Punkte</h3><p>Eine einzige serverseitige Fortschrittseinheit für die erste Alpha: nicht kaufbar, nicht übertragbar, nicht auszahlbar und ohne Geldwert.</p><small>ERSTE ALPHA · 18+</small></article>
            <article><b>XP + WFP</b><span>02</span><h3>Spätere Trennung</h3><p>Erst nach der Alpha kann Fortschritt in nicht ausgebbare XP und interne WFP getrennt werden. Es gibt kein Umtauschversprechen.</p><small>NACH PRODUKTTEST</small></article>
            <article><b>WFT / SUI</b><span>03</span><h3>Optionale Zukunft</h3><p>Nur nach mindestens 10.000 stabilen Nutzern, Rechtsprüfung und Audit denkbar. WFT ist kein Bestandteil der Alpha und kann vollständig entfallen.</p><small>10.000+ · NUR BEI FREIGABE</small></article>
          </div>
          <p className="side-note"><strong>Verbindliche Leitlinie:</strong> Selbst wenn WFT nie veröffentlicht wird, muss WellFit vollständig funktionieren. Die Nutzung von WellFit setzt keinen Token und keine Wallet voraus.</p>
        </div>
      </section>

      <section id="wft-ausblick" className="token-editorial token-compact-editorial">
        <img className="side-media" src="/images/wft-rewards-physical-token.webp" alt="WellFit-Buddy mit spielerischen Gegenständen und einem möglichen physischen Erinnerungsstück" loading="lazy" decoding="async" />
        <div className="token-editorial-shade" />
        <div className="token-editorial-copy">
          <p className="eyebrow">WENN ES SPÄTER EINEN ECHTEN NUTZEN GIBT</p>
          <h2>Nutzen erleben.<br/><em>Nicht Fortschritt kaufen.</em></h2>
          <div className="compact-utility-grid">
            <article><span>DIGITALES EIGENTUM</span><h3>Sammlerstücke</h3><p>Seltene, dauerhafte Objekte könnten eindeutig zugeordnet werden. Schritte, Gesundheit, Lernleistung und Level bleiben unkäuflich.</p></article>
            <article><span>ZUGANG</span><h3>Sondererlebnisse</h3><p>Ein freiwilliger Schlüssel für klar bezeichnete Zusatzinhalte – normale Missionen und der Basis-Buddy bleiben tokenfrei.</p></article>
            <article><span>ERINNERUNG</span><h3>Physisches Objekt</h3><p>Eine mögliche Edition für frühe Unterstützer wäre ein Sammlerstück, keine zweite Währung und kein Wertversprechen.</p></article>
          </div>
        </div>
      </section>

      <section id="wft-roadmap" className="side-section wft-roadmap-section">
        <div className="side-section-label"><span>02</span><small>FREIGABETORE</small></div>
        <div className="side-section-content">
          <p className="eyebrow">ERST BEWEISEN · DANN ENTSCHEIDEN</p>
          <h2>WFT kommt nur weiter,<br/><em>wenn jedes Tor besteht.</em></h2>
          <div className="token-gate-grid">
            <article><b>ALPHA</b><h3>Android, Erwachsene, WFXP</h3><p>Rund 25 ausgewählte Erwachsene ab 18 testen Buddy, Kamera-AR, sichere Missionen und interne WFXP – vollständig ohne Blockchain.</p></article>
            <article><b>PRODUKTBEWEIS</b><h3>Mindestens 10.000 stabil</h3><p>Erst ein stabiler Lauf mit mindestens 10.000 Nutzern öffnet überhaupt die Prüfung einer Blockchain. Familien und iPhone folgen kontrolliert nach den jeweiligen Sicherheitsfreigaben.</p></article>
            <article><b>DANACH · OPTIONAL</b><h3>SUI, Recht & Audit</h3><p>Nur bei echtem Zusatznutzen werden SUI, MiCA, Steuerkonzept und Smart Contracts extern geprüft. Die früher festgelegten 25 Milliarden wären dabei ausschließlich die absolute WFT-Obergrenze – keine Zusage, dass WFT ausgegeben wird.</p></article>
          </div>
        </div>
      </section>

      <section className="side-disclaimer">
        <p className="eyebrow">TRANSPARENZ</p>
        <h2>Konzept, kein Angebot.</h2>
        <p>Es gibt derzeit keinen aktiven WFT-Verkauf, keine freigegebene Wallet, keine ausgegebenen WFT und keinen Launchtermin. Die früher vorgesehenen maximal 25 Milliarden WFT sind eine konzeptionelle Obergrenze, kein öffentliches Angebot und kein Ausgabeversprechen. Die alten Solana-, Presale-, Staking-, Handels-, Buyback- und Renditedokumente sind archivierte Entwürfe und nicht veröffentlichungsfähig. WFT kann geändert, verschoben oder vollständig verworfen werden.</p>
        <div className="source-links"><a href="https://www.fma.gv.at/en/cross-sectoral-topics/markets-in-crypto-assets-regulation-micar/" target="_blank" rel="noreferrer">FMA · MiCAR ↗</a><a href="https://www.esma.europa.eu/esmas-activities/digital-finance-and-innovation/markets-crypto-assets-regulation-mica" target="_blank" rel="noreferrer">ESMA · MiCA ↗</a></div>
      </section>

      <section className="token-concept-model" aria-labelledby="token-concept-title">
        <div className="token-concept-intro">
          <p className="eyebrow">SO KÖNNTE ES AUSSEHEN</p>
          <h2 id="token-concept-title">25 Milliarden.<br/><em>Niemals mehr.</em></h2>
          <p>Die frühere Tokenidee sieht eine feste Obergrenze von 25 Milliarden WFT vor. Ausgabe, Rücklauf und mögliche Ersatzemission müssten in einem öffentlichen Register jederzeit nachvollziehbar sein. Auch nach einer Verbrennung darf die Summe aller existierenden WFT diese Obergrenze nie überschreiten.</p>
          <div className="token-cap-facts" aria-label="Eckdaten des möglichen Modells">
            <article><b>25.000.000.000</b><span>ABSOLUTE OBERGRENZE</span></article>
            <article><b>10.000+</b><span>NUTZER VOR BLOCKCHAIN-PRÜFUNG</span></article>
            <article><b>0</b><span>WFT HEUTE AUSGEGEBEN</span></article>
          </div>
        </div>

        <div id="wft-verteilung" className="token-allocation-layout">
          <div className="token-allocation-chart" role="img" aria-label="Geplante historische Verteilung: 60 Prozent Community, 31,96 Prozent Reserve, 4 Prozent Unterstützerphasen, 4 Prozent Team und 0,04 Prozent Partnerschaften">
            <div className="token-allocation-hole"><b>25</b><span>MRD. WFT</span></div>
          </div>
          <div className="token-allocation-copy">
            <p className="eyebrow">HISTORISCHE VERTEILUNGSIDEE · SUMME 100 %</p>
            <h3>Der größte Teil bleibt<br/><em>für die Community.</em></h3>
            <div className="token-allocation-list">
              {tokenDistribution.map((item) => (
                <article key={item.label} className={`token-tone-${item.tone}`}>
                  <i aria-hidden="true" />
                  <span>{item.label}</span>
                  <b>{item.amount}</b>
                  <small>{item.share}</small>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div id="wft-kreislauf" className="token-cycle-block">
          <div className="token-cycle-heading">
            <p className="eyebrow">MÖGLICHER KREISLAUF</p>
            <h3>Verbrauchen, nachweisen,<br/><em>höchstens gleich viel ersetzen.</em></h3>
            <p>Das neue Konzept ist gedeckelt, aber nicht automatisch deflationär: Wird ein WFT nachweislich verbrannt, dürfte maximal ein WFT als Ersatz in die WellFit-Reserve zurückkehren. Ohne Burn-Nachweis gibt es keine Ersatzemission.</p>
          </div>
          <div className="token-cycle-steps">
            <article><b>01</b><span>NUTZUNG</span><p>Ein optionaler Kauf, eine Servicegebühr oder ein später freigegebener Wettbewerb löst einen transparenten WFT-Fluss aus.</p></article>
            <article><b>02</b><span>VERBRENNUNG</span><p>Der festgelegte Anteil wird technisch unbrauchbar gemacht und öffentlich als Burn dokumentiert.</p></article>
            <article><b>03</b><span>ERSATZ</span><p>Maximal dieselbe Menge kann neu in die WellFit-Reserve gelangen – niemals zusätzlich über den 25-Milliarden-Deckel.</p></article>
            <article><b>04</b><span>RÜCKFLUSS</span><p>Die Reserve kann damit spätere Belohnungen, Partnerleistungen oder den Betrieb finanzieren. Regeln und Berichte bleiben sichtbar.</p></article>
          </div>
        </div>

        <div id="wft-nutzen" className="token-utility-block">
          <div className="token-utility-heading">
            <p className="eyebrow">WOFÜR WFT SPÄTER NÜTZLICH SEIN KÖNNTE</p>
            <h3>Ein Token.<br/><em>Sechs klar getrennte Aufgaben.</em></h3>
            <p>Normale Buddy-Pflege bleibt ein digitaler Gegenstand. Nur seltene, dauerhafte Stücke mit Herkunft brauchen überhaupt eine NFT-Zuordnung.</p>
          </div>
          <div className="token-utility-matrix">
            {wftUtilities.map((item) => (
              <article key={item.number}>
                <img className="utility-scene" src={item.image} alt={item.alt} loading="lazy" decoding="async" />
                <div><small>{item.guide}</small><span>{item.number}</span><h4>{item.title}</h4><p>{item.text}</p></div>
              </article>
            ))}
          </div>
        </div>

        <div id="wft-archiv" className="token-sale-model">
          <div className="token-sale-heading">
            <p className="eyebrow">GEPRÜFTE ARCHIVFASSUNG · NICHT FINAL</p>
            <h3>Fünf frühere<br/><em>Unterstützerphasen.</em></h3>
            <p>Für diese Darstellung gilt die in den vorhandenen Presale-Unterlagen dokumentierte Fassung: insgesamt eine Milliarde WFT von 0,005 bis 0,060 US-Dollar. Bei vollständigem Verkauf wären damals 34 Millionen US-Dollar zusammengekommen. Der Euro-Gegenwert wird nur zur Einordnung mit dem EZB-Referenzkurs vom 13. August 2026 berechnet.</p>
          </div>
          <div className="token-sale-table" role="table" aria-label="Historische Arbeitsfassung der fünf Unterstützerphasen">
            <div className="token-sale-row token-sale-head" role="row"><span role="columnheader">PHASE</span><span role="columnheader">PREIS</span><span role="columnheader">MENGE</span><span role="columnheader">ERLÖS</span><span role="columnheader">CA. EURO</span></div>
            {historicalTokenPhases.map((item) => (
              <div className="token-sale-row" role="row" key={item.phase}>
                <b role="cell">{item.phase}</b><span role="cell">{item.price}</span><span role="cell">{item.amount}</span><span role="cell">{item.proceeds}</span><span role="cell">{item.euros}</span>
              </div>
            ))}
            <div className="token-sale-total"><span>GESAMT · 1 MRD. WFT</span><b>34,0 MIO. USD</b><small>CA. 29,48 MIO. € · 1 EUR = 1,1534 USD · EZB 13.08.2026</small></div>
            <a className="token-rate-source" href="https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html" target="_blank" rel="noreferrer">EZB-REFERENZKURS VOM 13. AUGUST 2026 ↗</a>
          </div>
        </div>

        <div id="wft-editionen" className="physical-editions">
          <div className="physical-editions-heading">
            <p className="eyebrow">NEUER GESTALTUNGSVORSCHLAG</p>
            <h3>Ein echtes Erinnerungsstück<br/><em>für frühe Unterstützung.</em></h3>
            <p>Ab einem möglichen Unterstützungsbetrag von 2.500 Euro könnte es in den ersten drei Phasen je eine nummerierte physische Sammleredition geben. Jeder physische Token wäre mit genau einem zugeordneten NFT verbunden. Die Vorderseite trägt das WellFit-Symbol; auf der Rückseite führt ein individueller QR-Code zum digitalen Echtheits- und Vorteilsnachweis.</p>
          </div>
          <div className="edition-grid">
            <article className="edition-platinum">
              <span>PHASE 01 · PLATINUM</span>
              <div className="edition-product-visual"><img src="/images/wellfit-token-platinum-front-back.webp" alt="Konzeptvisualisierung der Platinum-Sammleredition mit Vorderseite und QR-Rückseite" loading="lazy" decoding="async" /></div>
              <h4>Platinum</h4><p>Erste nummerierte Edition · physischer Token und eindeutig zugeordnetes NFT</p>
            </article>
            <article className="edition-diamond">
              <span>PHASE 02 · DIAMOND</span>
              <div className="edition-product-visual"><img src="/images/wellfit-token-diamond-front-back.webp" alt="Konzeptvisualisierung der Diamond-Sammleredition mit Vorderseite und QR-Rückseite" loading="lazy" decoding="async" /></div>
              <h4>Diamond</h4><p>Zweite nummerierte Edition · physischer Token und eindeutig zugeordnetes NFT</p>
            </article>
            <article className="edition-gold">
              <span>PHASE 03 · GOLD</span>
              <div className="edition-product-visual"><img src="/images/wellfit-token-gold-front-back.webp" alt="Konzeptvisualisierung der Gold-Sammleredition mit Vorderseite und QR-Rückseite" loading="lazy" decoding="async" /></div>
              <h4>Gold</h4><p>Dritte nummerierte Edition · physischer Token und eindeutig zugeordnetes NFT</p>
            </article>
          </div>
          <div className="token-qr-story">
            <div className="token-qr-story-heading">
              <p className="eyebrow">VORDERSEITE · RÜCKSEITE · DIGITALER NACHWEIS</p>
              <h4>Ein Token.<br/><em>Zwei verbundene Ebenen.</em></h4>
              <p>Der QR-Code öffnet später eine dauerhafte WellFit-Zertifikatsseite und von dort das zugeordnete NFT. Die Visualisierung zeigt bewusst nur einen QR-Platzhalter; ein aktiver Code entsteht erst mit der tatsächlichen Ausgabe.</p>
            </div>
            <div className="token-qr-flow" aria-label="Geplanter Ablauf vom physischen Token zum NFT und seinen Vorteilen">
              <article><b>01</b><span>PHYSISCHER TOKEN</span><p>Material, Edition und individuelle Seriennummer machen jedes Sammlerstück eindeutig.</p></article>
              <article><b>02</b><span>QR AUF DER RÜCKSEITE</span><p>Der Code führt über einen stabilen WellFit-Link zum digitalen Nachweis, ohne eine wechselnde Plattform fest einzubrennen.</p></article>
              <article><b>03</b><span>ZUGEORDNETES NFT</span><p>Die Zertifikatsseite zeigt NFT, Edition, Seriennummer, Herkunft, Ausgabestatus und nachvollziehbare Echtheit.</p></article>
              <article><b>04</b><span>VORTEILE</span><p>Alle für diese Edition festgelegten Zugänge, Erlebnisse oder Partnerleistungen stehen mit Gültigkeit und Bedingungen direkt beim NFT.</p></article>
            </div>
          </div>
          <p className="physical-threshold"><b>AB 2.500 €</b><span>MÖGLICHER SCHWELLENWERT · NOCH NICHT BESCHLOSSEN</span></p>
        </div>
      </section>
    </div>
  );
}

function TechWorld({ onHome }: { onHome: () => void }) {
  return (
    <div className="side-world tech-world">
      <header className="side-world-header">
        <WorldLogo onHome={onHome} />
        <ChapterNav chapters={techChapters} />
        <div className="side-world-title"><b>TECHNOLOGIE</b></div>
      </header>

      <section className="side-hero tech-hero">
        <div className="side-hero-picture tech-hero-picture" aria-hidden="true">
          <img src="/images/tech-system-layers.webp" alt="" loading="eager" fetchPriority="low" decoding="async" />
        </div>
        <div className="side-hero-picture-shade" aria-hidden="true" />
        <div className="side-hero-copy">
          <p className="eyebrow">DIE ENGINE HINTER DEM ERLEBNIS</p>
          <h1>Unsichtbar komplex.<br/><em>Spürbar einfach.</em></h1>
          <p>Kamera, Standort, Sensoren, lokale KI und Cloud greifen modular ineinander. Die erste Alpha startet auf Android; iPhone folgt erst nach einer stabilen Android-Version. Blockchain ist vor 10.000 stabilen Nutzern ausgeschlossen.</p>
          <div className="concept-status"><span/>MODULARE PRODUKTVISION · SCHRITTWEISE UMSETZUNG</div>
        </div>
        <div className="side-hero-index"><span>TECHNOLOGIE</span><b>04 / 05</b></div>
      </section>

      <BuddyCast eyebrow="TECHNIK BRAUCHT EINE SICHTBARE SPRACHE" title="Zwei Wesen erklären, was im Hintergrund geschieht." numbers={["23", "24"]} />

      <section id="technik-systeme" className="processing-section">
        <div className="processing-title"><div className="section-inline-label"><span>01</span><small>SYSTEME</small></div><p className="eyebrow">TECHNIK OHNE FACHSPRACHE</p><h2>Vier Helfer.<br/><em>Ein Erlebnis.</em></h2><p className="processing-lead">Android-Handy, Cloud, AR-Engine und Sicherheitsprüfung teilen sich die Arbeit. iPhone folgt nach stabiler Android-Alpha; eine optionale Blockchain wird frühestens nach 10.000 stabilen Nutzern geprüft.</p></div>
        <div className="processing-columns">
          <article><span>ANDROID · DIE SINNE</span><h3>Soll Ort und Aktion erkennen</h3><p>Kamera, GPS und Bewegungssensoren sollen Ort und Aktion erfassen. Einfache Entscheidungen sollen direkt auf dem Gerät passieren – schnell und möglichst privat.</p><ul><li>Android zuerst · LiteRT</li><li>Kamera, GPS & Sensoren</li><li>Buddy-Reaktion auch bei schwachem Netz</li><li>iPhone erst nach stabiler Android-Version</li></ul></article>
          <article><span>ARCORE · DIE BÜHNE</span><h3>Soll den Buddy in den Raum setzen</h3><p>Bodenflächen, Tiefeninformationen, Perspektive und Licht sollen den Buddy sichtbar auf Abstand halten. Er soll mitlaufen, unmittelbar reagieren und erkannten Hindernissen ausweichen.</p><ul><li>AR Foundation & ARCore</li><li>Depth API und Flächenerkennung</li><li>räumliches Tracking</li><li>Bewegungs- und Abstandsreaktion</li></ul></article>
          <article><span>DIE CLOUD · DAS TEAMGEDÄCHTNIS</span><h3>Soll die Teile verbinden</h3><p>Eine spätere Cloud soll nur freigegebenen Fortschritt, Missionen und den notwendigen Familien- oder Teamstatus synchronisieren.</p><ul><li>geplante Accounts & Missionen</li><li>steuerbare Buddy-Erinnerungen</li><li>Familien- und Teamstatus später</li><li>Partnerinhalte & Sicherheit</li></ul></article>
          <article><span>SICHERHEIT · DIE KONTROLLE</span><h3>Soll prüfen statt blind belohnen</h3><p>Eine spätere Serverprüfung soll Missionsereignisse, GPS-Genauigkeit, Positionssprünge, Geschwindigkeit, Zeit, Synchronisation und Checkpoint-Reihenfolge plausibilisieren. Das Gerät soll interne Punkte niemals selbst erzeugen dürfen.</p><ul><li>serverseitiges Punkte-Ledger geplant</li><li>Anomalie-Score und manuelle Prüfung</li><li>Buchung ohne Negativsaldo</li><li>auditierbare Evidenznachweise</li></ul></article>
        </div>
      </section>

      <section id="technik-datenfluss" className="side-section data-flow-section">
        <div className="side-section-label"><span>02</span><small>DATENFLUSS</small></div>
        <div className="side-section-content">
          <p className="eyebrow">ALPHA-ZIEL · SO WENIG DATEN WIE MÖGLICH</p>
          <h2>Was bleibt am Handy?<br/><em>Was darf zum Server?</em></h2>
          <div className="data-flow-map" aria-label="Geplanter WellFit-Datenfluss">
            <article><b>01</b><span>AUF DEM GERÄT</span><h3>Sehen & reagieren</h3><p>Kamerabilder werden für AR verarbeitet und nicht routinemäßig gespeichert. Mikrofonzugriff ist nur für ausdrücklich gestartete Sprachfunktionen vorgesehen.</p></article>
            <article><b>02</b><span>FÜR DIE MISSION</span><h3>Ort prüfen</h3><p>Der ungefähre Standort öffnet Checkpoints. Eine vollständige Bewegungsroute soll standardmäßig weder Partnern gezeigt noch dauerhaft gespeichert werden.</p></article>
            <article><b>03</b><span>SPÄTER AM SERVER</span><h3>Abschluss bestätigen</h3><p>Eine geplante Serverlogik soll Missionsereignisse prüfen und in der ersten Alpha ausschließlich interne WFXP gutschreiben. Belohnungen sollen niemals allein durch eine Manipulation am Handy entstehen.</p></article>
            <article><b>04</b><span>UNTER KONTROLLE</span><h3>Löschen & begrenzen</h3><p>Fortschritt und freigegebene Buddy-Erinnerungen bleiben bis zur Löschung des Kontos; technische Sicherheitsprotokolle sollen höchstens 30 Tage aufbewahrt werden.</p></article>
          </div>
          <p className="side-note">Diese Regeln sind das Datenschutz-Ziel für die Alpha. Die endgültigen Fristen, Einwilligungstexte und Auftragsverarbeiter werden vor dem ersten externen Test dokumentiert und rechtlich geprüft.</p>
        </div>
      </section>

      <section id="technik-checkpoints" className="tech-editorial checkpoint-editorial">
        <img className="side-media" src="/images/tech-ar-checkpoint.webp" alt="Ein Jugendlicher erreicht mit Smartphone und WellFit-Buddy einen leuchtenden AR-Checkpoint" loading="lazy" decoding="async" />
        <div className="tech-editorial-shade" />
        <div className="tech-editorial-copy">
          <div className="section-inline-label"><span>03</span><small>CHECKPOINTS</small></div>
          <p className="eyebrow">CHECKPOINTS – EINFACH ERKLÄRT</p>
          <h2>Wie ein Level-Tor.<br/><em>Nur in der echten Welt.</em></h2>
          <p>Ein Checkpoint soll ein bestimmter Ort sein, den du wirklich erreichst. Draußen würde WellFit einen GPS-Bereich mit Kamera, Bildmarker, QR oder NFC verbinden. In Museen und Burgen soll GPS höchstens den Gebäudebereich bestätigen; im Inneren würden Marker, QR, NFC oder ein geprüfter Personalcode übernehmen. So soll kein Klick vom Sofa reichen, ohne eine vollständige Route dauerhaft speichern zu müssen.</p>
          <div className="checkpoint-tech-flow">
            <span><b>01</b>GPS findet den Bereich</span><span><b>02</b>Marker bestätigt den Punkt</span><span><b>03</b>Mission öffnet die Aufgabe</span><span><b>04</b>Prüflogik bestätigt den Abschluss</span>
          </div>
        </div>
      </section>

      <section id="technik-ar" className="ar-tech-section">
        <div className="ar-tech-copy"><div className="section-inline-label"><span>04</span><small>AR & OFFLINE</small></div><p className="eyebrow">DIE REALE WELT ALS INTERFACE</p><h2>AR ist mehr<br/><em>als ein Filter.</em></h2><p>Der Android-Prototyp muss Boden, Wände, Tiefe, Licht, Bewegungsrichtung und Abstand verstehen. Der Buddy bleibt dauerhaft in der bewusst aktivierten Kamerasicht, läuft sichtbar mit, reagiert unmittelbar und berücksichtigt erkannte Hindernisse.</p></div>
        <div className="ar-tech-specs">
          <article><span>POSITION</span><h3>GPS & Geospatial Anchors</h3><p>Routen, Checkpoints und digitale Inhalte werden an reale Koordinaten, Gelände oder Gebäude gebunden.</p></article>
          <article><span>RAUM</span><h3>ARKit, ARCore & AR Foundation</h3><p>Flächen, Bewegung, Licht und Perspektive lassen Buddy und Objekte glaubwürdig im Raum stehen.</p></article>
          <article><span>GEMEINSAM</span><h3>Cloud Anchors, GPS & BLE</h3><p>Nahe Spieler können synchronisierte AR-Aufgaben, lokale Teams und Familienmissionen erleben.</p></article>
          <article><span>FALLBACK</span><h3>Offline & Low Bandwidth</h3><p>Vorab geladene Missionen, lokale Regeln und späterer Sync halten Kernfunktionen auch bei schwacher Verbindung nutzbar.</p></article>
        </div>
        <div className="smart-glasses-future">
          <div className="smart-glasses-copy">
            <p className="eyebrow">NÄCHSTE STUFE · HÄNDE FREI</p>
            <h3>Vom Smartphone<br/><em>direkt ins Sichtfeld.</em></h3>
            <p>WellFit startet bewusst am Android-Smartphone. KI- und Display-Brillen entwickeln sich jedoch schnell weiter: Kameras, Audio, Sprachsteuerung, Navigation und erste Anzeigen im Brillenglas machen Erlebnisse möglich, bei denen das Handy häufiger in der Tasche bleiben kann.</p>
          </div>
          <div className="smart-glasses-steps">
            <article><b>01</b><span>HEUTE</span><h4>Das Handy bleibt die Basis</h4><p>Mission, Sicherheit, Karte und AR-Buddy werden zuerst auf verfügbaren Smartphones stabil aufgebaut.</p></article>
            <article><b>02</b><span>SCHNITTSTELLEN</span><h4>Brillen werden zugänglicher</h4><p>Meta stellt bereits ein Device Access Toolkit bereit, mit dem Entwickler mobile Anwendungen auf unterstützte KI-Brillen erweitern können. Das ist Entwicklerzugang – nicht automatisch Open Source.</p></article>
            <article><b>03</b><span>WELLFIT-ZUKUNFT</span><h4>Das Spiel wird natürlicher</h4><p>Wenn kommende Generationen offene oder offiziell freigegebene Schnittstellen bieten, können Buddy, Audiohinweise, Navigation und Checkpoints freihändig funktionieren – ohne die Spielidee neu bauen zu müssen.</p></article>
          </div>
          <p className="smart-glasses-note">Ray-Ban Meta steht hier beispielhaft für die Entwicklung der Produktkategorie, nicht für eine zugesagte WellFit-Partnerschaft oder heute garantierte Schnittstelle.</p>
        </div>
      </section>

      <section id="technik-sicherheit" className="side-section trust-section">
        <div className="side-section-label"><span>05</span><small>SICHERHEIT</small></div>
        <div className="side-section-content">
          <p className="eyebrow">SICHERHEIT IST KEIN ZUSATZMODUL</p>
          <h2>Schutz wird von Anfang an<br/><em>mitgebaut.</em></h2>
          <div className="trust-grid">
            <article><h3>Berechtigungen einzeln</h3><p>Kamera, Standort, Mikrofon und optionale Gesundheitsdaten werden getrennt erklärt und freigegeben. Eine Ablehnung darf keine versteckte Zustimmung auslösen.</p></article>
            <article><h3>Familienkontrolle</h3><p>Eltern steuern Radius, Zeiten, Kontakte, AR-Inhalte und Käufe. Kinder erhalten keine personalisierte Werbung und keinen eigenständigen Tokenhandel.</p></article>
            <article><h3>Sichere Orte</h3><p>Routen schließen Fahrbahnen, Privatgrundstücke und gemeldete Gefahrenzonen aus. Bei unsicherer Umgebung pausiert die Mission.</p></article>
            <article><h3>Schwaches GPS</h3><p>WellFit wartet, wechselt zu einem geprüften QR- oder Marker-Fallback oder lässt den Checkpoint aus – niemals führt es blind weiter.</p></article>
            <article><h3>KI mit Ausstieg</h3><p>Bei Unsicherheit erfindet der Buddy keine Antwort. Er kennzeichnet die Grenze, nutzt geprüfte Inhalte oder bietet eine sichere Alternative an.</p></article>
            <article><h3>Serverseitige Belohnung geplant</h3><p>Plausibilitätsregeln, serverseitige Prüfung und getrennte Anti-Cheat-Signale sollen verhindern, dass ein manipuliertes Gerät WFXP selbst erzeugt.</p></article>
            <article><h3>Konten & sensible Vorgänge später</h3><p>Wenn später Konten nötig werden, sollen Verschlüsselung, sichere Anmeldung, 2FA sowie PIN oder Biometrie Käufe, Elternfreigaben und mögliche Wallet-Aktionen schützen.</p></article>
            <article><h3>Keine Gesundheitsdaten on-chain</h3><p>Eine spätere Blockchain dürfte nur Eigentum oder Transaktionen belegen – niemals persönliche Gesundheitsprofile, Buddy-Gespräche oder genaue Routen.</p></article>
          </div>
        </div>
      </section>

      <section className="side-disclaimer tech-sources">
        <p className="eyebrow">TECHNISCHE REFERENZEN</p>
        <h2>Auf heutigen Standards<br/>aufgebaut. Für morgen offen.</h2>
          <p>Die konkrete Implementierung wird in Prototypen und Geräte-Tests validiert. Frameworks und Anbieter bleiben austauschbar; entscheidend sind offene Schnittstellen, Datenschutz und kein Vendor-Lock-in. Die optionale Blockchain-Entscheidung wird ausschließlich in der Welt „XP vs. Token“ eingeordnet.</p>
        <div className="source-links"><a href="https://ai.google.dev/edge/litert" target="_blank" rel="noreferrer">Google · LiteRT ↗</a><a href="https://developers.google.com/ar/develop/depth" target="_blank" rel="noreferrer">Google · ARCore Depth ↗</a><a href="https://docs.unity3d.com/Packages/com.unity.xr.arfoundation@latest/" target="_blank" rel="noreferrer">Unity · AR Foundation ↗</a><a href="https://developers.google.com/ar/develop/geospatial" target="_blank" rel="noreferrer">Google · Geospatial AR ↗</a><a href="https://about.fb.com/news/2026/05/meta-ai-wearables-changing-the-game-for-disabled-people/" target="_blank" rel="noreferrer">Meta · Device Access Toolkit ↗</a><a href="https://about.fb.com/news/2025/09/meta-ray-ban-display-ai-glasses-emg-wristband/" target="_blank" rel="noreferrer">Meta · Display-Brille ↗</a><a href="https://www.w3.org/TR/WCAG22/" target="_blank" rel="noreferrer">W3C · WCAG 2.2 ↗</a></div>
      </section>
    </div>
  );
}

function ImpactWorld({ onHome }: { onHome: () => void }) {
  return (
    <div className="side-world impact-world">
      <header className="side-world-header">
        <WorldLogo onHome={onHome} />
        <ChapterNav chapters={impactChapters} />
        <div className="side-world-title"><b>WIRKUNG & WISSENSCHAFT</b></div>
      </header>

      <section className="side-hero impact-hero">
        <div className="side-hero-picture" aria-hidden="true">
          <img src="/images/impact-science-hero.webp" alt="" loading="eager" fetchPriority="low" decoding="async" />
        </div>
        <div className="side-hero-picture-shade" aria-hidden="true" />
        <div className="side-hero-copy">
          <p className="eyebrow">BEWEGUNG · LERNEN · VERBINDUNG</p>
          <h1>Technik ist das Mittel.<br/><em>Der Mensch ist das Ziel.</em></h1>
          <p>WellFit soll Menschen nicht länger am Bildschirm halten. Es soll einen verständlichen Anlass schaffen, hinauszugehen, gemeinsam etwas zu erleben und dabei Neues zu lernen.</p>
          <div className="concept-status"><span/>WIRKUNGSHYPOTHESE · MUSS IN PILOTEN BELEGT WERDEN</div>
        </div>
        <div className="side-hero-index"><span>WIRKUNG & WISSENSCHAFT</span><b>05 / 05</b></div>
      </section>

      <BuddyCast eyebrow="LERNEN UND WOHLBEFINDEN" title="Wirkung bekommt zwei ruhige Begleiter." numbers={["07", "16"]} />

      <section id="wirkung-warum" className="side-section evidence-section">
        <div className="side-section-label"><span>01</span><small>WARUM</small></div>
        <div className="side-section-content">
          <p className="eyebrow">DIE HERAUSFORDERUNG IST REAL</p>
          <h2>Zu wenig Bewegung.<br/><em>Zu wenig Verbindung.</em></h2>
          <p className="side-lead">WellFit ersetzt keine Therapie. Die Plattform setzt früher an: bei Motivation, Alltag, gemeinsamer Zeit und einem niedrigschwelligen Zugang zu Bewegung und Lernen.</p>
          <div className="evidence-grid">
            <article><strong>31 %</strong><span>ERWACHSENE · DATENJAHR 2022</span><p>der Menschen ab 18 Jahren erreichten weltweit die empfohlenen Aktivitätswerte nicht – rund 1,8 Milliarden.</p><a href="https://www.who.int/news/item/26-06-2024-nearly-1.8-billion-adults-at-risk-of-disease-from-not-doing-enough-physical-activity" target="_blank" rel="noreferrer">WHO · 2024 ↗</a></article>
            <article><strong>81 %</strong><span>JUGENDLICHE 11–17 · DATENJAHR 2016</span><p>erreichten in der globalen WHO-Schätzung das empfohlene Aktivitätsniveau nicht.</p><a href="https://www.who.int/news/item/22-11-2019-new-who-led-study-says-majority-of-adolescents-worldwide-are-not-sufficiently-physically-active-putting-their-current-and-future-health-at-risk" target="_blank" rel="noreferrer">WHO · 2019 ↗</a></article>
            <article><strong>1 von 6</strong><span>ALLE ALTERSGRUPPEN · BERICHT 2025</span><p>Menschen weltweit berichten laut WHO von Einsamkeit; bei Jugendlichen und jungen Erwachsenen ist die Rate höher.</p><a href="https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death" target="_blank" rel="noreferrer">WHO · 2025 ↗</a></article>
          </div>
          <p className="side-note">Diese Zahlen belegen das gesellschaftliche Problem – nicht automatisch die Wirksamkeit von WellFit. Ob WellFit tatsächlich hilft, muss mit klaren Messgrößen und unabhängiger Begleitung geprüft werden.</p>
        </div>
      </section>

      <section id="wirkung-prinzip" className="impact-principle-section">
        <div className="impact-principle-copy">
          <div className="section-inline-label"><span>02</span><small>WIRKUNGSPRINZIP</small></div>
          <p className="eyebrow">DIE WELLFIT-WIRKUNGSKETTE</p>
          <h2>Drei Dinge greifen<br/><em>ineinander.</em></h2>
          <p>Der Buddy macht den Anfang leichter. Die reale Mission bringt Bewegung. Eine Geschichte und andere Menschen geben dem Weg Bedeutung.</p>
        </div>
        <div className="impact-principle-grid">
          <article><span>01</span><h3>Bewegen</h3><p>Spazieren, balancieren, tanzen, radeln oder eine aktive Pause machen – angepasst an Zeit und Können.</p><small>KÖRPER & ALLTAG</small></article>
          <article><span>02</span><h3>Lernen</h3><p>Sehen, hören, handeln und sich bewegen verbinden eine Information mit einem echten Erlebnis.</p><small>MULTISENSORISCH</small></article>
          <article><span>03</span><h3>Verbinden</h3><p>Familie, Freunde, Klasse oder Team lösen Aufgaben, bei denen unterschiedliche Fähigkeiten gebraucht werden.</p><small>SOZIALE VERBINDUNG</small></article>
        </div>
      </section>

      <section id="wirkung-lernen" className="learning-editorial">
        <img src="/images/wellfit-impact-multisensory.webp" alt="Zwei Erwachsene verbinden auf einem Natur-Lernweg Sehen, Hören und Bewegung mit dem WellFit-Buddy" loading="lazy" decoding="async" />
        <div className="learning-editorial-shade" />
        <div className="learning-editorial-copy">
          <div className="section-inline-label"><span>03</span><small>MULTISENSORISCH</small></div>
          <p className="eyebrow">MULTISENSORISCH – EINFACH ERKLÄRT</p>
          <h2>Nicht nur lesen.<br/><em>Sehen, hören, handeln.</em></h2>
          <p>Eine Person untersucht Blatt und Baumrinde, eine zweite hört einen Buddy-Hinweis und beide bewegen sich zum passenden Naturmarker. Mehrere Wahrnehmungswege werden zu einer gemeinsamen Erinnerung. AR kann Motivation und Engagement unterstützen – gute Inhalte und verständliche Aufgaben bleiben aber wichtiger als der technische Effekt.</p>
          <div className="sense-row"><span>SEHEN</span><span>HÖREN</span><span>BEWEGEN</span><span>ENTSCHEIDEN</span></div>
        </div>
      </section>

      <section id="wirkung-zielgruppen" className="side-section people-section">
        <div className="side-section-label"><span>04</span><small>ZIELGRUPPEN</small></div>
        <div className="side-section-content">
          <p className="eyebrow">GLEICHES PRINZIP · ANDERE BEDÜRFNISSE</p>
          <h2>Jeder Mensch braucht<br/><em>einen anderen Einstieg.</em></h2>
          <div className="people-grid">
            <article><span>KINDER & JUGENDLICHE</span><h3>Neugier vor Leistung</h3><p>Kurze sichere Wege, Fantasie, Lernrätsel und Elternkontrolle. Keine personalisierte Werbung und kein Kaufdruck.</p></article>
            <article><span>ERWACHSENE</span><h3>Passend zum Alltag</h3><p>Missionen nach Zeit, Energie und Ziel – vom kurzen Spaziergang bis zur längeren Entdeckungsroute.</p></article>
            <article><span>FAMILIEN</span><h3>Unterschiede werden Stärke</h3><p>Kinder entdecken, Erwachsene sichern den Weg, Großeltern verbinden Wissen und Erinnerungen.</p></article>
            <article><span>ÄLTERE MENSCHEN</span><h3>Sanft und klar</h3><p>Gut lesbare Hinweise, kurze Etappen, Balance- und Spaziergangsaufgaben sowie Begleitoptionen.</p></article>
          </div>
          <div className="accessibility-note"><strong>Barrierefreiheit ist kein Sondermodus.</strong><p>Tempo, Strecke, Sprache, Kontrast, Textgröße, Audio, Untertitel, Aufgabenform und körperliche Intensität sollen anpassbar sein. Sitzende Varianten, einfache Sprache und sensorisch ruhigere Missionen beziehen körperliche, sensorische und kognitive Voraussetzungen mit ein. Pausen, Abbruch und Nichterreichen dürfen nie bestraft werden.</p></div>
        </div>
      </section>

      <section id="wirkung-pilot" className="side-section pilot-measure-section">
        <div className="side-section-label"><span>05</span><small>PILOT</small></div>
        <div className="side-section-content">
          <p className="eyebrow">NICHT BEHAUPTEN · MESSEN</p>
          <h2>Eine gute Idee wird erst<br/><em>durch echte Nutzung glaubwürdig.</em></h2>
          <p className="side-lead">In einer geschlossenen Alpha und späteren Piloten werden zuerst Sicherheit, Verständlichkeit und Nutzung geprüft – nicht Reichweite oder wirtschaftliche Zukunftsmodelle.</p>
          <div className="measure-list">
            <article><b>01</b><h3>Verständlichkeit</h3><p>Aufgabenabschluss ohne Hilfe, Fehlversuche je Checkpoint und Zeit bis zur ersten selbstständig gestarteten Mission.</p></article>
            <article><b>02</b><h3>Nutzung & Motivation</h3><p>Start-, Abschluss- und freiwillige Wiederholungsrate sowie Rückkehr nach sieben Tagen – ohne künstliche Streak-Strafen.</p></article>
            <article><b>03</b><h3>Bewegung</h3><p>Aktive Minuten und zurückgelegte Missionsdistanz während klar definierter Testphasen – ohne Gewichtsverlust- oder Therapieversprechen.</p></article>
            <article><b>04</b><h3>Lernen</h3><p>Verständnis direkt nach der Mission und freiwilliger Erinnerungscheck zu einem späteren Zeitpunkt.</p></article>
            <article><b>05</b><h3>Sicherheit & Wohlbefinden</h3><p>Gemeldete Unsicherheiten, Abbrüche, Druckempfinden, Barrieren und subjektives Wohlbefinden nach der Nutzung.</p></article>
          </div>
        </div>
      </section>

      <section className="side-disclaimer impact-sources">
        <p className="eyebrow">WISSENSCHAFTLICHE EINORDNUNG</p>
        <h2>Potenzial, kein<br/>Gesundheitsversprechen.</h2>
        <p>WellFit ist kein Medizinprodukt, stellt keine Diagnose und ersetzt keine ärztliche, therapeutische oder pädagogische Betreuung. Forschung zu Bewegung, Gamification und AR zeigt Chancen, aber auch Grenzen. Deshalb werden Wirkungsannahmen transparent getrennt von Ergebnissen, die erst in WellFit-Piloten entstehen können.</p>
        <div className="source-links"><a href="https://www.who.int/news-room/fact-sheets/detail/physical-activity" target="_blank" rel="noreferrer">WHO · Bewegung ↗</a><a href="https://www.who.int/groups/commission-on-social-connection/report" target="_blank" rel="noreferrer">WHO · Soziale Verbindung ↗</a><a href="https://www.mdpi.com/2254-9625/13/8/103" target="_blank" rel="noreferrer">MDPI · Gamification ↗</a><a href="https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2024.1288824/full" target="_blank" rel="noreferrer">Frontiers · AR & Lernen ↗</a><a href="https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1447866/full" target="_blank" rel="noreferrer">Frontiers · AR & ältere Menschen ↗</a></div>
      </section>
    </div>
  );
}

export default function Home() {
  const [activeWorld, setActiveWorld] = useState<World>("home");
  const [colorTheme, chooseColorTheme] = useColorTheme();
  const [activeExperience, setActiveExperience] = useState(0);
  const [activeChallenge, setActiveChallenge] = useState(0);
  const [activeSpeciesRealm, setActiveSpeciesRealm] = useState<SpeciesRealm>("land");
  const [activeChapter, setActiveChapter] = useState<ChapterId>("idee");
  const [universeVisible, setUniverseVisible] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const [navigationTarget, setNavigationTarget] = useState<{ world: World; sectionId: string } | null>(null);
  const pointerStart = useRef({ x: 0, y: 0, ignored: false, pointerId: -1, scroller: null as HTMLElement | null, scrollLeft: 0 });
  const speciesTabsRef = useRef<HTMLDivElement>(null);
  const speciesTrackRef = useRef<HTMLDivElement>(null);
  const wheelDelta = useRef(0);
  const wheelLocked = useRef(false);
  const wheelUnlockTimer = useRef<number | null>(null);
  const experience = experiences[activeExperience];
  const challenge = challengeModes[activeChallenge];
  const worldIndex = worldOrder.indexOf(activeWorld);
  const previousWorld = worldOrder[(worldIndex - 1 + worldOrder.length) % worldOrder.length];
  const nextWorld = worldOrder[(worldIndex + 1) % worldOrder.length];

  useEffect(() => {
    const currentIndex = worldOrder.indexOf(activeWorld);
    const previous = worldOrder[(currentIndex - 1 + worldOrder.length) % worldOrder.length];
    const next = worldOrder[(currentIndex + 1) % worldOrder.length];
    const mobile = window.matchMedia("(max-width: 620px)").matches;
    const targets = mobile ? [next] : [previous, next];
    const timer = window.setTimeout(() => targets.forEach((world) => {
      const preload = new Image();
      preload.decoding = "async";
      preload.src = worldHeroImages[world];
    }), mobile ? 1400 : 650);
    return () => {
      window.clearTimeout(timer);
      if (wheelUnlockTimer.current !== null) window.clearTimeout(wheelUnlockTimer.current);
    };
  }, [activeWorld]);

  useEffect(() => {
    const universe = document.querySelector("#universum");
    if (!universe) return;
    const observer = new IntersectionObserver(([entry]) => setUniverseVisible(activeWorld === "home" && entry.isIntersecting), {
      threshold: 0.08,
      rootMargin: "-120px 0px -72px",
    });
    observer.observe(universe);
    return () => observer.disconnect();
  }, [activeWorld]);

  const showWorld = useCallback((world: World, updateUrl = true) => {
    setActiveWorld(world);
    if (updateUrl && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("welt", world === "home" ? "wellfit" : world);
      url.hash = "";
      window.history.pushState({ world }, "", `${url.pathname}${url.search}`);
    }
  }, []);

  const navigateTo = useCallback((world: World, sectionId: string) => {
    setNavigationTarget({ world, sectionId });
    showWorld(world);
  }, [showWorld]);

  useEffect(() => {
    if (!navigationTarget || navigationTarget.world !== activeWorld) return;
    const timer = window.setTimeout(() => {
      const panelClass: Record<World, string> = { partner: "partner-panel", token: "token-panel", home: "home-panel", tech: "tech-panel", impact: "impact-panel" };
      const panel = document.querySelector<HTMLElement>(`.${panelClass[navigationTarget.world]}`);
      const section = document.getElementById(navigationTarget.sectionId);
      if (!panel || !section) return;
      const sectionTop = section.getBoundingClientRect().top - panel.getBoundingClientRect().top + panel.scrollTop;
      panel.scrollTo({ top: Math.max(0, sectionTop - 124), behavior: "smooth" });
      setNavigationTarget(null);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeWorld, navigationTarget]);

  function moveWorld(direction: -1 | 1) {
    const nextIndex = (worldIndex + direction + worldOrder.length) % worldOrder.length;
    showWorld(worldOrder[nextIndex]);
  }

  function selectSpeciesRealm(realm: SpeciesRealm) {
    setActiveSpeciesRealm(realm);
    window.requestAnimationFrame(() => {
      speciesTrackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      const tabs = speciesTabsRef.current;
      const tab = tabs?.querySelector<HTMLElement>(`[data-realm-id="${realm}"]`);
      if (tabs && tab && tabs.scrollWidth > tabs.clientWidth) {
        const centeredLeft = tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2;
        tabs.scrollTo({ left: Math.max(0, centeredLeft), behavior: "smooth" });
      }
    });
  }

  function moveSpeciesRealm(direction: -1 | 1) {
    const current = speciesRealms.findIndex((realm) => realm.id === activeSpeciesRealm);
    const next = (current + direction + speciesRealms.length) % speciesRealms.length;
    selectSpeciesRealm(speciesRealms[next].id);
  }

  function circularOffset(world: World) {
    let offset = worldOrder.indexOf(world) - worldIndex;
    const half = worldOrder.length / 2;
    if (offset > half) offset -= worldOrder.length;
    if (offset < -half) offset += worldOrder.length;
    return offset;
  }

  function panelStyle(world: World): CSSProperties {
    const offset = circularOffset(world);
    return {
      transform: `translate3d(calc(${offset * 100}vw + ${dragProgress * 100}vw), 0, 0)`,
      opacity: Math.abs(offset) <= 1 ? 1 : 0,
      zIndex: offset === 0 ? 2 : 1,
    };
  }

  function startSwipe(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const target = event.target instanceof Element ? event.target : null;
    const swipeRegion = target?.closest<HTMLElement>("[data-swipe-ignore]") ?? null;
    const scroller = swipeRegion && swipeRegion.scrollWidth > swipeRegion.clientWidth + 2 ? swipeRegion : null;
    const interactive = target?.closest("button, a, input, textarea, select, form, [contenteditable=true]");
    const ignored = Boolean(interactive || (!scroller && target?.closest("[data-swipe-ignore]")));
    pointerStart.current = { x: event.clientX, y: event.clientY, ignored, pointerId: event.pointerId, scroller, scrollLeft: scroller?.scrollLeft ?? 0 };
    if (!ignored && !scroller) event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveSwipe(event: PointerEvent<HTMLElement>) {
    if (pointerStart.current.pointerId !== event.pointerId || pointerStart.current.ignored) return;
    if (pointerStart.current.scroller) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    if (Math.abs(deltaX) < 6 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;
    event.preventDefault();
    setDragProgress(Math.max(-.45, Math.min(.45, deltaX / window.innerWidth)));
  }

  function endSwipe(event: PointerEvent<HTMLElement>) {
    if (pointerStart.current.pointerId !== event.pointerId) return;
    const { x, y, ignored, scroller, scrollLeft } = pointerStart.current;
    pointerStart.current = { x: 0, y: 0, ignored: false, pointerId: -1, scroller: null, scrollLeft: 0 };
    setDragProgress(0);
    if (ignored) return;
    const deltaX = event.clientX - x;
    const deltaY = event.clientY - y;
    const swipeThreshold = Math.min(50, window.innerWidth * .11);
    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;
    if (scroller) {
      const maximum = Math.max(0, scroller.scrollWidth - scroller.clientWidth);
      const reachedBoundary = deltaX < 0 ? scrollLeft >= maximum - 2 : scrollLeft <= 2;
      if (!reachedBoundary) return;
    }
    moveWorld(deltaX < 0 ? 1 : -1);
  }

  function cancelSwipe() {
    pointerStart.current = { x: 0, y: 0, ignored: false, pointerId: -1, scroller: null, scrollLeft: 0 };
    setDragProgress(0);
  }

  function swipeWithTrackpad(event: WheelEvent<HTMLElement>) {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
    if (Math.abs(event.deltaX) < Math.abs(event.deltaY) * 1.2 || Math.abs(event.deltaX) < 2) {
      wheelDelta.current = 0;
      return;
    }
    const swipeRegion = target?.closest<HTMLElement>("[data-swipe-ignore]") ?? null;
    if (swipeRegion) {
      const maximum = Math.max(0, swipeRegion.scrollWidth - swipeRegion.clientWidth);
      if (maximum <= 2) return;
      const canContinueInside = event.deltaX > 0 ? swipeRegion.scrollLeft < maximum - 2 : swipeRegion.scrollLeft > 2;
      if (canContinueInside) return;
    }
    event.preventDefault();
    if (wheelLocked.current) return;
    wheelDelta.current += event.deltaX;
    if (Math.abs(wheelDelta.current) < 55) return;
    wheelLocked.current = true;
    moveWorld(wheelDelta.current > 0 ? 1 : -1);
    wheelDelta.current = 0;
    if (wheelUnlockTimer.current !== null) window.clearTimeout(wheelUnlockTimer.current);
    wheelUnlockTimer.current = window.setTimeout(() => { wheelLocked.current = false; }, 500);
  }

  useEffect(() => {
    const worldFromLocation = (): World => {
      const value = new URL(window.location.href).searchParams.get("welt")?.toLowerCase();
      if (value === "partner" || value === "wft" || value === "token" || value === "technik" || value === "tech" || value === "wirkung" || value === "impact") {
        if (value === "wft") return "token";
        if (value === "technik") return "tech";
        if (value === "wirkung") return "impact";
        return value as World;
      }
      const hash = window.location.hash.toLowerCase();
      if (hash.startsWith("#partner")) return "partner";
      if (hash.startsWith("#wft")) return "token";
      if (hash.startsWith("#technik")) return "tech";
      if (hash.startsWith("#wirkung")) return "impact";
      return "home";
    };
    const syncWorld = () => {
      const world = worldFromLocation();
      setActiveWorld(world);
    };
    syncWorld();
    window.addEventListener("popstate", syncWorld);
    return () => window.removeEventListener("popstate", syncWorld);
  }, []);

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("[data-swipe-ignore], input, textarea, select, button, a, [contenteditable=true]")) return;
      const index = worldOrder.indexOf(activeWorld);
      if (event.key === "ArrowLeft") showWorld(worldOrder[(index - 1 + worldOrder.length) % worldOrder.length]);
      if (event.key === "ArrowRight") showWorld(worldOrder[(index + 1) % worldOrder.length]);
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [activeWorld, showWorld]);

  useEffect(() => {
    const homePanel = document.querySelector<HTMLElement>(".home-panel");
    if (!homePanel) return;
    let frame = 0;
    const updateActiveChapter = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const guideLine = homePanel.getBoundingClientRect().top + 150;
        let current: ChapterId = homeChapters[0].id;
        for (const chapter of homeChapters) {
          const section = document.getElementById(chapter.id);
          if (section && section.getBoundingClientRect().top <= guideLine) current = chapter.id;
        }
        setActiveChapter(current);
      });
    };
    homePanel.addEventListener("scroll", updateActiveChapter, { passive: true });
    updateActiveChapter();
    return () => {
      window.cancelAnimationFrame(frame);
      homePanel.removeEventListener("scroll", updateActiveChapter);
    };
  }, []);

  return (
    <div
      className={`world-shell theme-${colorTheme} active-${activeWorld}${Math.abs(dragProgress) > .001 ? " is-dragging" : ""}`}
      onPointerDown={startSwipe}
      onPointerMove={moveSwipe}
      onPointerUp={endSwipe}
      onPointerCancel={cancelSwipe}
      onWheel={swipeWithTrackpad}
    >
      <ThemeSwitcher colorTheme={colorTheme} onChange={chooseColorTheme} />
      <div className="world-track">
        <article className="world-panel partner-panel" style={panelStyle("partner")} aria-hidden={activeWorld !== "partner"} inert={activeWorld !== "partner"}>
          <PartnerWorld onHome={() => showWorld("home")} />
        </article>

        <article className="world-panel token-panel" style={panelStyle("token")} aria-hidden={activeWorld !== "token"} inert={activeWorld !== "token"}>
          <TokenWorld onHome={() => showWorld("home")} />
        </article>

        <article className="world-panel home-panel" style={panelStyle("home")} aria-hidden={activeWorld !== "home"} inert={activeWorld !== "home"}>
    <main id="top">
      <header className="header">
        <a className="brand" href="#top" aria-label="WellFit – zur Startseite">
          <img className="brand-logo" src="/images/wellfit-logo.webp" alt="WellFit – Move, Learn, Grow" width="700" height="548" />
        </a>
        <ChapterNav chapters={homeChapters} activeId={activeChapter} onChapter={setActiveChapter} />
        <span className="chapter-header-title">WELLFIT · 11 KAPITEL</span>
        <a className="header-link" href="#vormerken">Kontakt</a>
      </header>

      <section className="hero">
        <div className="hero-image" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">MOVE · LEARN · GROW</p>
          <h1>Die Welt<br/>wird <em>dein Spiel.</em></h1>
          <p>WellFit verbindet reale Bewegung, Wissen und gemeinsame Zeit mit einem persönlichen KI-Buddy, der über die Handykamera an deiner Seite erscheint.</p>
          <a className="fine-button" href="#universum" onClick={(event) => { event.preventDefault(); navigateTo("home", "universum"); }}>WellFit entdecken <span>↘</span></a>
          <div className="hero-status"><span/>PRODUKTVISION · ALPHA IN VORBEREITUNG</div>
        </div>
        <div className="hero-foot"><span>WELT 03 / 05 — WELLFIT</span><span>SMARTPHONE · AUGMENTED REALITY · KI</span></div>
      </section>

      <UniverseMap onNavigate={navigateTo} />
      <ExperienceProof />

      <section className="intro section" id="idee">
        <aside><span>01</span><small>DAS PRINZIP</small></aside>
        <div className="intro-main">
          <p className="eyebrow">DIE ERSTEN 60 SEKUNDEN</p>
          <h2>Nicht noch mehr Bildschirmzeit.<br/><em>Mehr echtes Leben.</em></h2>
          <p className="lead">Der Einstieg erklärt nicht zuerst Technik, sondern führt direkt in eine passende, sichere Mission. Nach einer Minute weißt du, wohin es geht und warum.</p>
          <div className="flow" aria-label="Die ersten 60 Sekunden mit WellFit">
            {[
              ["00–15", "Wählen", "Tagesmission, Wochenmission, einzelne Aufgabe, Challenge oder Checkpoint wählen"],
              ["15–30", "Verstehen", "Ziel, Strecke, Dauer, Aufgabe, Schwierigkeit und Sicherheit sehen"],
              ["30–45", "Freigeben", "Nur die für diese Mission nötigen Berechtigungen wählen"],
              ["45–60", "Starten", "Der Buddy erscheint über die Kamera und führt zum ersten Hinweis"],
            ].map(([n,t,d]) => <div key={n}><b>{n}</b><h3>{t}</h3><p>{d}</p></div>)}
          </div>
        </div>
      </section>

      <ChapterTransition from="01" to="02" title="Aus der Idee wird ein Weg." label="Zum Produktstand" href="#status" variant={1} />

      <section className="product-status section" id="status">
        <aside><span>02</span><small>PRODUKTSTAND</small></aside>
        <div>
          <p className="eyebrow">KLAR TRENNEN, WAS HEUTE IST UND WAS SPÄTER KOMMT</p>
          <h2>Eine starke Vision.<br/><em>Ehrlich im Aufbau.</em></h2>
          <div className="status-roadmap-intro">
            <p>Acht klar getrennte Etappen zeigen den geplanten Weg. Der aktuelle technische Vorbereitungsstand wird später an diese Produktvision angepasst; diese Seite selbst bleibt reine Information.</p>
            <span id="product-roadmap-hint">HORIZONTAL WISCHEN ODER SCROLLEN →</span>
          </div>
          <div
            className="status-roadmap"
            aria-label="Geplante WellFit-Produktetappen"
            aria-describedby="product-roadmap-hint"
            data-swipe-ignore
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
              event.preventDefault();
              event.currentTarget.scrollLeft += event.key === "ArrowRight" ? 340 : -340;
            }}
          >
            {productRoadmap.map((step, index) => (
              <article key={step.phase}>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <span>{step.phase}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <ChapterTransition from="02" to="03" title="Jetzt wird die Vision erlebbar." label="Zur Beispielmission" href="#mission" variant={2} />

      <section className="mission-demo section" id="mission">
        <aside><span>03</span><small>BEISPIELMISSION</small></aside>
        <div>
          <p className="eyebrow">SPÄTERE FAMILIENPHASE · EINE VOLLSTÄNDIGE REISE</p>
          <h2>Die verschwundene<br/><em>Burgbotschaft.</em></h2>
          <p className="lead">Eine 600-Meter-Familienmission zeigt, wie Bewegung, Wissen, AR und gemeinsames Entscheiden zusammenspielen.</p>
          <div className="mission-guide-card">
            <img src="/images/species/28-obsidian-dachsritter.webp" alt="Der Obsidian-Dachsritter begleitet die Burgmission" loading="lazy" decoding="async" />
            <div><span>MISSIONSBEGLEITER · BODEN</span><h3>Der Obsidian-Dachsritter</h3><p>Er kennt Tore, Wappen und sichere Wege. Als Mitglied der wachsenden WellFit-Familie macht er die Burgmission unverwechselbar und kann sich mit gemeinsamen Erlebnissen weiterentwickeln.</p></div>
          </div>
          <div className="mission-timeline">
            <article><b>01</b><span>START</span><h3>Buddy erscheint</h3><p>Er erklärt Dauer, Weg und Rollen. Die Familie entscheidet bewusst, ob sie starten möchte.</p></article>
            <article><b>02</b><span>BEWEGUNG</span><h3>Zum ersten Tor</h3><p>Der reale Weg wird zur Geschichte; das Smartphone kann zwischendurch gesenkt oder eingesteckt werden.</p></article>
            <article><b>03</b><span>AR-HINWEIS</span><h3>Wappen entdecken</h3><p>Am sicheren Checkpoint erscheint eine digitale Spur. Das Kind findet, Erwachsene prüfen den Weg.</p></article>
            <article><b>04</b><span>LERNEN</span><h3>Rätsel lösen</h3><p>Ein historischer Hinweis verbindet Sehen, Hören, Bewegung und gemeinsames Nachdenken.</p></article>
            <article><b>05</b><span>ABSCHLUSS</span><h3>Fundstück erhalten</h3><p>Beim späteren Familienstart gilt das dann freigegebene interne Punktesystem. Ein digitales Burgabzeichen und ein nicht handelbares Fundstück erinnern an das Erlebnis.</p></article>
            <article><b>06</b><span>ENTWICKLUNG</span><h3>Buddy wächst mit</h3><p>Bewusst freigegebene Kernerlebnisse prägen seine Persönlichkeit und Entwicklung. Erinnerungen bleiben einsehbar und können jederzeit gelöscht werden.</p></article>
          </div>
        </div>
      </section>

      <ChapterTransition from="03" to="04" title="Jede Mission braucht eine Persönlichkeit." label="Zum persönlichen Buddy" href="#buddy" variant={3} />

      <section className="buddy-feature section" id="buddy">
        <div className="buddy-text">
          <div className="section-inline-label"><span>04</span><small>DEIN BUDDY</small></div>
          <p className="eyebrow">DEIN PERSÖNLICHER BEGLEITER</p>
          <h2>Mehr als ein Avatar.</h2>
          <p className="lead">Ein Charakter, der dich kennenlernt, gemeinsame Erlebnisse bewahrt und mit dir wächst. Neugierig, frech, manchmal verwirrt oder eingeschnappt – aber immer respektvoll.</p>
          <dl>
            <div><dt>In deiner Welt</dt><dd>Er bleibt während der bewusst aktivierten Kamera sichtbar, läuft neben dir, hält Abstand, berücksichtigt erkannte Hindernisse und reagiert unmittelbar auf Bewegung.</dd></div>
            <div><dt>Mit Erinnerung</dt><dd>Nur freigegebene Erlebnisse formen seine Reaktionen. Keine heimliche Auswertung von Kamera, Mikrofon oder privaten Gesprächen.</dd></div>
            <div><dt>Unter deiner Kontrolle</dt><dd>Erinnerungen ansehen, einzeln löschen oder vollständig zurücksetzen; Tonalität, Benachrichtigungen und Kontakte bleiben steuerbar.</dd></div>
          </dl>
        </div>
        <div className="buddy-portrait buddy-portrait-family"><img src="/images/species/21-sturmgreif.webp" alt="Der Sturmgreif als ein möglicher persönlicher WellFit-Buddy" width="1024" height="1536" loading="eager" fetchPriority="high" decoding="async" /><span>Eine von vielen Spezies der wachsenden WellFit-Familie</span></div>
        <div className="buddy-life" aria-label="So soll die Beziehung zum Buddy wachsen">
          <article><b>01</b><span>FÜTTERN & PFLEGEN</span><h3>Wie ein Tamagotchi – nur ohne Strafe.</h3><p>Digitale Snacks, Wasser, Pflege und kleine gemeinsame Routinen stärken die Bindung. Eine Pause löscht keinen Fortschritt und der Buddy läuft niemals einfach davon.</p></article>
          <article><b>02</b><span>SAISON & OUTFIT</span><h3>Bereit für Sommer und Winter.</h3><p>Leichte Sommerteile, Regenausrüstung oder ein warmes Winterset verändern sein Aussehen und passen zur Mission. Alles bleibt Teil der Spielwelt – die echte Sicherheitsausrüstung des Menschen geht immer vor.</p></article>
          <article><b>03</b><span>AUSRÜSTEN</span><h3>Schwert, Schild und Rüstung tragen Geschichte.</h3><p>Gegenstände stammen aus bestätigten Missionen, Orten oder Sammlungsreihen. Sie können neue Lösungswege öffnen, werden aber nicht zu einem käuflichen Vorteil.</p></article>
          <article><b>04</b><span>TRAINIEREN & ENTWICKELN</span><h3>Fähigkeiten entstehen durch Erleben.</h3><p>Bewegung, Wissen, Teamarbeit und Pflege entwickeln Ausdauer, Beobachtung oder Logik. An späteren Checkpoints tritt der sichtbar ausgerüstete Buddy fair gegen andere Buddys an.</p></article>
        </div>
        <div className="brand-mascot">
          <div className="brand-mascot-copy"><p className="eyebrow">DIE MARKENFIGUR ÜBER DER BUDDY-WELT</p><h3>Unser Maskottchen<br/><em>steht für WellFit in Bewegung.</em></h3><p>Der geflügelte WellFit-Läufer ist kein persönlicher Buddy und ersetzt keines der Fabelwesen. Er ist die übergeordnete Markenfigur für Energie, Aufbruch und die gesamte WellFit-Vision – während die Buddys dich in den einzelnen Missionen begleiten und mit dir wachsen.</p></div>
          <div className="brand-mascot-visual"><img src="/images/wellfit-markenmaskottchen.webp" alt="Das geflügelte WellFit-Maskottchen in Laufbewegung" loading="lazy" decoding="async" /></div>
        </div>
        <div className="buddy-roster">
          <div className={`species-realm species-realm-${activeSpeciesRealm}`} id="species-welten">
            <div className="species-realm-heading">
              <div>
                <p className="eyebrow">24 SPEZIES · SECHS LEBENSRÄUME</p>
                <h3>Eine Familie,<br/><em>die weiter wächst.</em></h3>
              </div>
              <p>Der ursprüngliche Landdrache, drei neue Landgefährten und zwanzig weitere Wesen bilden den sichtbaren Anfang der WellFit-Familie. Jeder der sechs Lebensräume zeigt nun vier völlig unterschiedliche Körperformen, Persönlichkeiten und Fähigkeiten. Mit neuen Orten, Missionen und Geschichten werden weitere Spezies dazukommen.</p>
            </div>
            <div className="species-realm-switcher" data-swipe-ignore>
              <button type="button" className="species-realm-arrow" aria-label="Vorheriger Lebensraum" onPointerDown={(event) => event.stopPropagation()} onClick={() => moveSpeciesRealm(-1)}>←</button>
              <div><span>AKTIVE FAMILIE</span><strong>{speciesRealms.find((realm) => realm.id === activeSpeciesRealm)?.label}</strong><small>{speciesRealms.findIndex((realm) => realm.id === activeSpeciesRealm) + 1} / {speciesRealms.length}</small></div>
              <button type="button" className="species-realm-arrow" aria-label="Nächster Lebensraum" onPointerDown={(event) => event.stopPropagation()} onClick={() => moveSpeciesRealm(1)}>→</button>
            </div>
            <div ref={speciesTabsRef} className="species-realm-tabs" role="tablist" aria-label="Lebensraum der WellFit-Buddy-Familie" data-swipe-ignore>
              {speciesRealms.map((realm) => (
                <button
                  key={realm.id}
                  id={`species-tab-${realm.id}`}
                  data-realm-id={realm.id}
                  type="button"
                  role="tab"
                  aria-selected={activeSpeciesRealm === realm.id}
                  aria-controls="species-panel"
                  className={activeSpeciesRealm === realm.id ? "active" : ""}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => selectSpeciesRealm(realm.id)}
                >
                  <b>{realm.number}</b><i aria-hidden="true">{realm.symbol}</i><span>{realm.label}</span><small>{realm.copy}</small>
                </button>
              ))}
            </div>
            <div
              ref={speciesTrackRef}
              id="species-panel"
              className="species-realm-track"
              role="tabpanel"
              aria-labelledby={`species-tab-${activeSpeciesRealm}`}
              tabIndex={0}
              data-swipe-ignore
              aria-label={`${speciesRealms.find((realm) => realm.id === activeSpeciesRealm)?.label}: Buddy-Spezies – horizontal wischen`}
              onKeyDown={(event) => {
                if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                event.preventDefault();
                event.currentTarget.scrollLeft += event.key === "ArrowRight" ? 300 : -300;
              }}
            >
              {buddyRoster.filter((buddy) => "realm" in buddy && buddy.realm === activeSpeciesRealm).map((buddy) => (
                <article key={buddy.number}>
                  <div className="species-creature"><img src={buddy.image} alt={`${buddy.name}, neue WellFit-Spezies aus dem Bereich ${buddy.world}`} loading="lazy" decoding="async" /></div>
                  <div className="species-copy"><span>{buddy.number} · {buddy.world}</span><h4>{buddy.name}</h4><p>{buddy.role}</p></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ChapterTransition from="04" to="05" title="Der Buddy verändert, wie du Orte erlebst." label="Zu den Erlebniswelten" href="#erlebnis" variant={1} />

      <section className="experience" id="erlebnis">
        <div className="experience-images">
          {experiences.map((item, index) => (
            <img
              key={item.key}
              src={item.image}
              alt={item.alt}
              aria-hidden={activeExperience !== index}
              className={activeExperience === index ? "active" : ""}
              data-scene={item.key}
              loading="eager"
              decoding="async"
            />
          ))}
        </div>
        <div className="experience-shade" />
        <div className="floating-section-label"><span>05</span><small>ERLEBNISSE</small></div>
        <div className="experience-copy" id="experience-description">
          <p className="eyebrow">REALE ORTE · DIGITALE GESCHICHTEN</p>
          <h2>{experience.title}</h2>
          <p>{experience.text}</p>
          <div className="experience-tabs" role="group" aria-label="Erlebnisort auswählen" data-swipe-ignore>
            {experiences.map((item,index)=><button key={item.key} type="button" aria-pressed={activeExperience===index} aria-controls="experience-description" className={activeExperience===index?"active":""} onPointerDown={(event)=>event.stopPropagation()} onClick={()=>setActiveExperience(index)}><span>0{index+1}</span>{item.label}</button>)}
          </div>
        </div>
      </section>

      <ChapterTransition from="05" to="06" title="Was du erlebst, wird Teil deiner Welt." label="Zum Fortschritt" href="#welt" variant={2} />

      <section className="progress section" id="welt">
        <aside><span>06</span><small>FORTSCHRITT</small></aside>
        <div className="progress-main">
          <p className="eyebrow">WAS BLEIBT NACH EINER MISSION?</p>
          <h2>Aus Erlebnissen entsteht<br/><em>deine eigene Welt.</em></h2>
          <div className="progress-lines">
            <div><span>WFXP · ALPHA</span><h3>Eine interne Einheit</h3><p>Nicht kaufbar, nicht übertragbar und nicht auszahlbar. WFXP bildet Fortschritt und Testbelohnungen in der ersten Alpha gemeinsam ab.</p></div>
            <div><span>XP + WFP · SPÄTER</span><h3>Saubere Trennung nach Test</h3><p>Erst nach Auswertung kann Fortschritt in XP und spielinterne WFP getrennt werden – ohne Umtausch- oder Geldwertversprechen.</p></div>
            <div><span>FUNDSTÜCKE</span><h3>Nachweisbare Erinnerung</h3><p>In Alpha und Partnerpilot bleiben Abzeichen, Outfits und seltene Objekte intern, nicht kaufbar und nicht handelbar. Ob später ausgewählte Sammlerstücke als NFT beziehungsweise übertragbarer Besitz funktionieren, wird erst nach mindestens 10.000 stabilen Nutzern rechtlich und wirtschaftlich geprüft.</p></div>
          </div>
          <div className="inventory-roadmap inventory-roadmap-visual" aria-label="Geplante digitale Sammlung mit Herkunft und Fortschritt">
            <article><span>01 · WAPPEN</span><h3>Checkpoint-Fund</h3><p>Einzelne geprüfte Burgstationen liefern Fragmente für Karte und Trophäengalerie.</p></article>
            <article><span>02 · SCHWERT</span><h3>Erste vollständige Burgquest</h3><p>Ein digitales Schwert trägt Burg, Mission und Datum als Herkunft – ohne Kampfvorteil.</p></article>
            <article><span>03 · SCHILD</span><h3>Wissens- oder Teamprüfung</h3><p>Der Schild entsteht durch eine bestätigte Aufgabe, nicht durch Kauf oder schnellere Bewegung.</p></article>
            <article><span>04 · RÜSTUNG</span><h3>Regionale Sammlung</h3><p>Mehrere unterschiedliche Burgmissionen vervollständigen ein kosmetisches Set.</p></article>
            <article><span>05 · LEGENDÄRES SCHWERT</span><h3>Besondere Berg- oder Spezialmission</h3><p>Ein Excalibur-artiges Fundstück entsteht nur durch eine separat geprüfte Mission an einem sicheren Gipfel- oder Hüttenziel – niemals durch Kauf, Einsatz oder Zufallskiste.</p></article>
          </div>
          <div className="castle-story">
            <img src="/images/wellfit-castle-editorial.webp" alt="Die persönliche WellFit Burg als wachsende Spielwelt" loading="lazy" decoding="async" />
            <div><p className="eyebrow">DIE WELLFIT-BURG · GEPLANT</p><h3>Deine digitale Heimat.</h3><p>Kartenraum, Buddy-Bereich, Familienflügel und Trophäengalerie wachsen mit jedem Abenteuer. Reale Burgquests liefern Geschichten und Fundstücke für deine persönliche Spielbasis.</p></div>
          </div>
        </div>
      </section>

      <ChapterTransition from="06" to="07" title="Dein Fortschritt führt zurück in die reale Welt." label="Zu den Checkpoints" href="#checkpoints" variant={3} />

      <CommunityMap />

      <ChapterTransition from="07" to="08" title="Ein Ort kann viele Arten von Abenteuer öffnen." label="Zu den Möglichkeiten" href="#moeglichkeiten" variant={1} />

      <section className="challenges section" id="moeglichkeiten">
        <aside><span>08</span><small>MÖGLICHKEITEN</small></aside>
        <div className="challenge-main">
          <p className="eyebrow">VIELE WEGE, EIN PRINZIP</p>
          <h2>Wähle, was heute<br/><em>zu dir passt.</em></h2>
          <p className="challenge-intro">Klicke auf eine Spielart. Das Bild und die Erklärung zeigen dir sofort, wie unterschiedlich sich eine WellFit-Mission anfühlen kann.</p>
          <div className="challenge-stage">
            <div className="challenge-list" role="group" aria-label="Spielart auswählen" data-swipe-ignore>
              {challengeModes.map((item,i)=><button key={item.key} type="button" aria-pressed={activeChallenge===i} aria-controls="challenge-preview" className={activeChallenge===i?"active":""} onClick={()=>setActiveChallenge(i)}><b>0{i+1}</b><span>{item.label}</span><i aria-hidden="true">↗</i></button>)}
            </div>
            <div className="challenge-visual" id="challenge-preview" aria-live="polite">
              <div className="challenge-images">
                {challengeModes.map((item, index) => (
                  <img
                    key={item.key}
                    src={item.image}
                    alt={item.alt}
                    aria-hidden={activeChallenge !== index}
                    className={activeChallenge === index ? "active" : ""}
                    data-scene={item.key}
                    loading="eager"
                    decoding="async"
                  />
                ))}
              </div>
              <div className="challenge-veil" />
              <div className="challenge-caption" key={challenge.key}>
                <span>{challenge.meta}</span>
                <h3>{challenge.title}</h3>
                <p>{challenge.text}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ChapterTransition from="08" to="09" title="Aus vielen persönlichen Wegen wird Gemeinschaft." label="Zur gemeinsamen Welt" href="#familie" variant={2} />

      <section className="family" id="familie">
        <div className="family-image" />
        <div className="family-shade" />
        <div className="floating-section-label"><span>09</span><small>GEMEINSCHAFT</small></div>
        <div className="family-copy">
          <p className="eyebrow">DREI GENERATIONEN · EIN ABENTEUER</p>
          <h2>Gemeinsam bedeutet:<br/><em>einander brauchen.</em></h2>
          <p>Diese Familienwelt folgt erst nach der Erwachsenen-Alpha und ihrer Sicherheitsauswertung. Dann entdeckt das Kind AR-Spuren, Eltern behalten Route und Sicherheit im Blick und Großeltern öffnen mit Wissen den nächsten Hinweis.</p>
          <div className="roles"><span><b>Kind</b> entdeckt</span><span><b>Eltern</b> führen</span><span><b>Großeltern</b> verbinden</span></div>
        </div>
      </section>

      <ChapterTransition from="09" to="10" title="Gemeinsame Zeit braucht auch bewusste Pausen." label="Zur Balance" href="#balance" variant={3} />

      <section className="offline-balance section" id="balance">
        <aside><span>10</span><small>BALANCE</small></aside>
        <div>
          <p className="eyebrow">AUCH WENIGER HANDY KANN FORTSCHRITT SEIN</p>
          <h2>Der Buddy darf begleiten.<br/><em>Er darf nicht festhalten.</em></h2>
          <div className="offline-grid">
            <article><span>HANDY SENKEN</span><h3>Audio statt Dauerbildschirm</h3><p>Nach einem Checkpoint kann der Buddy per kurzer Sprachausgabe führen. Die Kamera bleibt nur so lange aktiv, wie AR wirklich gebraucht wird.</p></article>
            <article><span>OFFLINE-ZEIT</span><h3>Bewusste Pause zählt</h3><p>Eine Atemübung, Schlafroutine oder vereinbarte handyfreie Zeit kann als freiwilliger Fortschritt erfasst werden – ohne Überwachung.</p></article>
            <article><span>KEIN DRUCK</span><h3>Pausieren ohne Verlust</h3><p>Streaks, Buddy-Zustand und Belohnungen dürfen niemanden bestrafen, wenn eine Mission abgebrochen, verschoben oder nicht erreicht wird.</p></article>
          </div>
        </div>
      </section>

      <ChapterTransition from="10" to="11" title="Freiheit funktioniert nur mit Verantwortung." label="Zur Haltung von WellFit" href="#verantwortung" variant={1} />

      <section className="values section" id="verantwortung">
        <aside><span>11</span><small>VERANTWORTUNG</small></aside>
        <div className="values-layout">
          <div className="values-copy"><p className="eyebrow">TECHNOLOGIE MIT HALTUNG</p><h2>Das Smartphone ist das Fenster.<br/><em>Das Leben bleibt das Ziel.</em></h2>
            <div className="value-row"><p>Alters- und fitnessgerechte Aufgaben</p><p>Eltern steuern Radius, Zeiten, Kontakte und Käufe</p><p>Standort, Kamera und Gesundheit transparent und opt-in</p><p>Auch Erholung, Schlafroutine und Offline-Zeit zählen</p></div>
            <p className="future-note">Persönliche Burg, Partnerpfade, AR-Pets, Gemeinschaftssysteme und AR-Brillen erweitern später dieselbe reale Spielwelt. Die mögliche Ökonomie ist ausschließlich in „XP vs. Token“ eingeordnet.</p>
          </div>
          <figure className="values-visual"><img src="/images/wellfit-values-real-life.webp" alt="Ein Mensch senkt bewusst das Smartphone und erlebt mit dem WellFit-Buddy die reale Umgebung" loading="lazy" decoding="async" /></figure>
        </div>
      </section>

      <ChapterTransition from="11" to="→" title="Aus der großen Vision wird der erste Schritt." label="Für WellFit vormerken" href="#vormerken" variant={2} />

      <section className="waitlist" id="vormerken">
        <div className="waitlist-copy"><p className="eyebrow">ERSTE ALPHA · AUSGEWÄHLTE ERWACHSENE 18+</p><h2>Sei bei den ersten<br/><em>Abenteuern</em> dabei.</h2><p>Die erste Android-Alpha ist auf ungefähr 25 Erwachsene begrenzt. Familien können sich bereits für eine spätere Phase vormerken; Kinder nehmen an der ersten Alpha nicht teil.</p>
          <InterestForm />
        </div>
      </section>

      <footer><a className="brand" href="#top" aria-label="WellFit – zur Startseite"><img className="brand-logo" src="/images/wellfit-logo.webp" alt="WellFit – Move, Learn, Grow" width="700" height="548" loading="lazy" /></a><p>Bewegen. Entdecken. Wachsen.</p><div><a href="mailto:hello@wellfit-now.io">Kontakt</a><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link><span>© 2026 · Produkt in Entwicklung</span></div></footer>
    </main>
        </article>

        <article className="world-panel tech-panel" style={panelStyle("tech")} aria-hidden={activeWorld !== "tech"} inert={activeWorld !== "tech"}>
          <TechWorld onHome={() => showWorld("home")} />
        </article>

        <article className="world-panel impact-panel" style={panelStyle("impact")} aria-hidden={activeWorld !== "impact"} inert={activeWorld !== "impact"}>
          <ImpactWorld onHome={() => showWorld("home")} />
        </article>
      </div>

      <nav className={`world-dock world-tabs ${universeVisible ? "world-dock-map-mode" : ""}`} aria-label="WellFit-Welten" data-swipe-ignore>
        <button className="world-tab world-tab-previous" type="button" aria-label={`Zur vorherigen Welt: ${worldLabels[previousWorld]}`} onClick={() => moveWorld(-1)}>
          {worldLabels[previousWorld]}
        </button>
        <span className="world-tab world-tab-current" aria-current="page">{worldLabels[activeWorld]}</span>
        <button className="world-tab world-tab-next" type="button" aria-label={`Zur nächsten Welt: ${worldLabels[nextWorld]}`} onClick={() => moveWorld(1)}>
          {worldLabels[nextWorld]}
        </button>
      </nav>
    </div>
  );
}
