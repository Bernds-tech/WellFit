import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../app/landing/LandingExperience.tsx", import.meta.url), "utf8");
const content = fs.readFileSync(new URL("../app/landing/content.ts", import.meta.url), "utf8");
const communityMap = fs.readFileSync(new URL("../app/landing/CommunityMap.tsx", import.meta.url), "utf8");
const themeControls = fs.readFileSync(new URL("../app/ThemeControls.tsx", import.meta.url), "utf8");
const imprint = fs.readFileSync(new URL("../app/impressum/page.tsx", import.meta.url), "utf8");
const privacy = fs.readFileSync(new URL("../app/datenschutz/page.tsx", import.meta.url), "utf8");

test("contains mobile reflow, visible focus and reduced-motion rules", () => {
  assert.match(css, /@media\(max-width:620px\)/);
  assert.match(css, /\.venue-blueprints,.status-grid,.inventory-roadmap,.mayor-grid/);
  assert.match(css, /:focus-visible\{outline:2px solid/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /\.header nav a,.header-link\{position:relative;min-height:44px/);
  assert.match(css, /\.header-login-button\{[^}]*min-height:44px/);
  assert.match(css, /@media\(max-width:620px\)[^]*\.header-login-button\{[^}]*min-height:40px/);
  assert.match(css, /\.auth-shell\{[^}]*height:100dvh[^}]*overflow:hidden/);
  assert.match(css, /@media\(max-width:900px\)[^]*\.auth-shell\{[^}]*min-height:100dvh[^}]*overflow-x:hidden;overflow-y:auto/);
  assert.match(page, /closest\("\[data-swipe-ignore\], input, textarea, select, button, a, \[contenteditable=true\]"\)/);
  assert.match(css, /\.venue-blueprints,.status-grid,.inventory-roadmap,.mayor-grid[^{]+\.checkpoint-method-grid\{grid-template-columns:1fr\}/);
});

test("uses endless page swiping with a separate three-name world navigation", () => {
  assert.match(page, /\(worldIndex \+ direction \+ worldOrder\.length\) % worldOrder\.length/);
  assert.match(page, /if \(offset > half\) offset -= worldOrder\.length/);
  assert.match(page, /if \(offset < -half\) offset \+= worldOrder\.length/);
  assert.match(page, /className=\{`world-dock world-tabs/);
  assert.match(page, /worldLabels\[previousWorld\]/);
  assert.match(page, /worldLabels\[activeWorld\]/);
  assert.match(page, /worldLabels\[nextWorld\]/);
  assert.match(page, /token: "XP vs\. Token"/);
  assert.match(page, /onClick=\{\(\) => moveWorld\(-1\)\}/);
  assert.match(page, /onClick=\{\(\) => moveWorld\(1\)\}/);
  assert.doesNotMatch(page, /wheelItemStyle/);
  assert.doesNotMatch(page, /selectWheelWorld/);
  assert.match(page, /onPointerDown=\{startSwipe\}/);
  assert.match(page, /onPointerMove=\{moveSwipe\}/);
  assert.match(page, /onPointerUp=\{endSwipe\}/);
  assert.match(page, /onWheel=\{swipeWithTrackpad\}/);
  assert.match(page, /data-swipe-ignore/);
  assert.match(page, /deltaX \/ window\.innerWidth/);
  assert.match(page, /const swipeThreshold = Math\.min\(50, window\.innerWidth \* \.11\)/);
  assert.match(page, /Math\.abs\(deltaX\) < swipeThreshold/);
  assert.match(page, /Math\.abs\(wheelDelta\.current\) < 55/);
  assert.match(css, /\.world-shell\.is-dragging \.world-panel/);
  assert.match(css, /\.world-dock\.world-tabs/);
  assert.match(css, /@media\(max-width:620px\)[^]*\.header \.chapter-nav,.side-world-header \.chapter-nav\{display:none!important\}/);
  assert.doesNotMatch(css, /perspective:440px/);
});

test("offers standard and dark-turquoise color themes without changing navigation", () => {
  assert.match(themeControls, /type ColorTheme = "standard" \| "turquoise"/);
  assert.match(themeControls, /wellfit-color-theme/);
  assert.match(page, /theme-\$\{colorTheme\}/);
  assert.match(themeControls, /theme-dot-standard[^]*Standard/);
  assert.match(themeControls, /theme-dot-turquoise[^]*Dunkles Türkis/);
  assert.match(css, /\.world-shell\.theme-turquoise\{--night:#06383d/);
  assert.match(css, /\.theme-switcher/);
  assert.match(css, /\.theme-turquoise \.hero-shade/);
});

test("applies the same persistent themes to all five worlds and both legal pages", () => {
  assert.match(themeControls, /wellfit-color-theme/);
  assert.match(themeControls, /Dunkles Türkis/);
  assert.match(page, /ThemeSwitcher/);
  assert.match(imprint, /LegalThemeShell/);
  assert.match(privacy, /LegalThemeShell/);
  assert.match(css, /\.theme-turquoise \.partner-world/);
  assert.match(css, /\.theme-turquoise \.token-world/);
  assert.match(css, /\.theme-turquoise \.tech-world/);
  assert.match(css, /\.theme-turquoise \.impact-world/);
});

test("uses distinct scenes for multisensory impact, competition and an active workday", () => {
  assert.match(page, /wellfit-impact-multisensory\.webp/);
  assert.match(content, /wellfit-mode-wettkampf-v3\.webp/);
  assert.match(content, /wellfit-mode-aktiver-alltag-v3\.webp/);
  assert.equal((page.match(/wellfit-museum-editorial\.webp/g) ?? []).length, 1);
  assert.match(content, /Können entscheidet – nicht der Zufall/);
  assert.match(content, /Auch fünf Minuten verändern den Tag/);
});

test("presents the homepage as a numbered visual journey without duplicated challenge scenes", () => {
  assert.match(page, /<h3>Buddy wächst mit<\/h3>/);
  assert.doesNotMatch(page, /Buddy könnte mitwachsen/);
  for (const number of ["04", "05", "06", "08", "09", "10", "11"]) {
    assert.match(page, new RegExp(`<span>${number}<\\/span>`));
  }
  assert.match(content, /wellfit-challenge-entdecken-v3\.webp/);
  assert.match(content, /label: "Rätselrallyes"/);
  assert.match(content, /Rätselrallyes mit Freunden/);
  assert.match(content, /wellfit-challenge-bewegen-v3\.webp/);
  assert.match(content, /wellfit-challenge-lernen-v3\.webp/);
  assert.match(content, /wellfit-challenge-gemeinsam-v3\.webp/);
  assert.match(css, /wellfit-mission-storyboard\.webp/);
  assert.match(page, /wellfit-values-real-life\.webp/);
});

test("uses mission types in the first minute and a visual horizontal product roadmap", () => {
  for (const missionType of ["Tagesmission", "Wochenmission", "Aufgabe", "Challenge", "Checkpoint"]) assert.match(page, new RegExp(missionType));
  assert.doesNotMatch(page, /Zeit, Energie, Begleitung und Ziel angeben/);
  const roadmapBlock = page.match(/const productRoadmap = \[([^]*?)\] as const;/)?.[1] ?? "";
  assert.equal((roadmapBlock.match(/phase:/g) ?? []).length, 8);
  assert.match(roadmapBlock, /Etwa 25 Erwachsene · Outdoor/);
  assert.match(roadmapBlock, /Museum, Burg & Stadt · Erwachsene/);
  assert.match(roadmapBlock, /mindestens 10\.000 Nutzern/);
  assert.match(page, /className="status-roadmap"[^>]*data-swipe-ignore[^>]*tabIndex=\{0\}/);
  assert.match(page, /species\/21-sturmgreif\.webp[^>]*loading="eager" fetchPriority="high"/);
  assert.match(css, /\.status-roadmap\{[^}]*overflow-x:auto[^}]*scroll-snap-type:x mandatory/);
  assert.match(css, /wellfit-roadmap-storyboard\.webp/);
  assert.match(page, /closest\("\[data-swipe-ignore\], input, textarea, select, button, a, \[contenteditable=true\]"\)/);
});

test("adds Buddy care, six distinct places, a visual inventory and four checkpoint duels without repeating them", () => {
  assert.doesNotMatch(page, /Alle dargestellten App- und AR-Szenen sind Konzeptvisualisierungen/);
  assert.match(page, /FÜTTERN & PFLEGEN/);
  assert.match(page, /SAISON & OUTFIT/);
  assert.match(page, /Schwert, Schild und Rüstung tragen Geschichte/);
  assert.match(page, /Wie ein Tamagotchi – nur ohne Strafe/);
  for (const label of ["Burg", "Tiergarten", "Museum", "Stadt", "Natur", "Schule"]) {
    assert.match(content, new RegExp(`label: "${label}"`));
  }
  assert.match(page, /inventory-roadmap inventory-roadmap-visual/);
  assert.match(page, /LEGENDÄRES SCHWERT/);
  assert.match(communityMap, /BEWEGUNGSDUELL/);
  assert.match(communityMap, /MATHE-DUELL/);
  assert.match(communityMap, /SPRACHE & WISSEN/);
  assert.match(communityMap, /AVATAR-DUELL/);
  assert.match(communityMap, /Nike oder Adidas/);
  assert.match(communityMap, /keine Behauptung einer bestehenden Partnerschaft/);
  assert.match(css, /wellfit-buddy-life-storyboard\.webp/);
  assert.match(css, /\.buddy-life article:nth-child\(3\)::before\{filter:brightness\(1\.38\)/);
  assert.match(css, /\.buddy-life article:nth-child\(4\)::before\{filter:brightness\(1\.3\)/);
  assert.match(css, /wellfit-progress-inventory-storyboard\.webp/);
  for (const image of ["duel-pushup-funkenwidder-v3.webp", "duel-math-quasarkobold-v3.webp", "duel-language-sonnenkranich-v3.webp", "duel-avatar-nebelpanther-v3.webp"]) {
    assert.match(css, new RegExp(image.replace(".", "\\.")));
  }
});

test("shows a local numbered chapter sequence for every world", () => {
  const readChapters = (name) => {
    const block = page.match(new RegExp(`const ${name} = \\[([^]*?)\\] as const;`))?.[1] ?? "";
    return [...block.matchAll(/\{ id: "([^"]+)", number: "(\d{2})", label: "([^"]+)" \}/g)].map((entry) => ({ id: entry[1], number: entry[2], label: entry[3] }));
  };
  const expected = {
    homeChapters: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"],
    partnerChapters: ["01", "02", "03"],
    wftChapters: ["01", "02", "03", "04", "05", "06", "07"],
    techChapters: ["01", "02", "03", "04", "05"],
    impactChapters: ["01", "02", "03", "04", "05"],
  };
  for (const [name, numbers] of Object.entries(expected)) assert.deepEqual(readChapters(name).map((chapter) => chapter.number), numbers);
  assert.deepEqual(readChapters("wftChapters").map((chapter) => chapter.label), ["Drei Ebenen", "Freigabetore", "Verteilung", "Kreislauf", "Nutzen", "Archivphasen", "Editionen"]);
  for (const id of ["wft-grundmodell", "wft-roadmap", "wft-verteilung", "wft-kreislauf", "wft-nutzen", "wft-archiv", "wft-editionen"]) assert.equal((page.match(new RegExp(`id="${id}"`, "g")) ?? []).length, 1);
  assert.deepEqual(readChapters("partnerChapters").map((chapter) => chapter.id), ["partner-orte", "partner-mission", "partner-modell"]);
  assert.deepEqual(readChapters("techChapters").map((chapter) => chapter.id), ["technik-systeme", "technik-datenfluss", "technik-checkpoints", "technik-ar", "technik-sicherheit"]);
  assert.deepEqual(readChapters("impactChapters").map((chapter) => chapter.id), ["wirkung-warum", "wirkung-prinzip", "wirkung-lernen", "wirkung-zielgruppen", "wirkung-pilot"]);
  assert.equal((page.match(/<ChapterNav chapters=/g) ?? []).length, 5);
  assert.match(page, /id="balance"/);
  assert.doesNotMatch(page, /const showChapter/);
  assert.match(page, /href=\{`#\$\{chapter\.id\}`\}/);
  for (const worldPosition of ["01 / 05", "02 / 05", "03 / 05", "04 / 05", "05 / 05"]) assert.match(page, new RegExp(worldPosition));
  assert.doesNotMatch(page, /01 — PRODUKTVISION/);
  assert.match(css, /grid-template-columns:repeat\(var\(--chapter-count\),minmax\(0,1fr\)\)/);
  assert.match(css, /@media\(max-width:900px\)[^]*\.header \.chapter-nav a span\{display:none\}/);
});

test("shows the capped XP versus Token future model with verified historical figures", () => {
  assert.match(page, /25 Milliarden\.<br\/><em>Niemals mehr\.<\/em>/);
  assert.match(page, /const tokenDistribution = \[/);
  for (const allocation of ["15 Mrd.", "7,99 Mrd.", "1 Mrd.", "10 Mio."]) assert.match(page, new RegExp(allocation.replace(".", "\\.")));
  assert.match(page, /Summe aller existierenden WFT diese Obergrenze nie überschreiten/i);
  assert.match(page, /Ohne Burn-Nachweis gibt es keine Ersatzemission/);
  assert.match(page, /Verbrauchen, nachweisen/);
  for (const utility of ["Futter & Pflege", "Schwert, Schild & Kleidung", "Seltene Fundstücke & NFTs", "Zusatzmissionen & Events", "Herstellen, verbessern, reparieren", "Marktplatz & Partnernutzen"]) assert.match(page, new RegExp(utility));
  for (const image of ["wft-utility-care-v3.webp", "wft-utility-equipment-v3.webp", "wft-utility-collectibles-v3.webp", "wft-utility-events-v3.webp", "wft-utility-crafting-v3.webp", "wft-utility-marketplace-v3.webp"]) assert.match(page, new RegExp(image.replace(".", "\\.")));
  for (const phase of ["0,005 USD", "0,010 USD", "0,020 USD", "0,040 USD", "0,060 USD"]) assert.match(page, new RegExp(phase.replace(".", "\\.")));
  assert.match(page, /Für diese Darstellung gilt die in den vorhandenen Presale-Unterlagen dokumentierte Fassung/);
  for (const value of ["500.000 USD", "1,5 Mio. USD", "4 Mio. USD", "10 Mio. USD", "18 Mio. USD", "34,0 MIO. USD", "29,48 MIO. €"]) assert.match(page, new RegExp(value.replace(".", "\\.")));
  assert.match(page, /1 EUR = 1,1534 USD/);
  assert.match(page, /EZB-REFERENZKURS VOM 13. AUGUST 2026/);
  assert.doesNotMatch(page, /250\.000 Stück zu 0,001 Eurocent/);
  for (const edition of ["Platinum", "Diamond", "Gold"]) assert.match(page, new RegExp(`>${edition}<`));
  assert.match(page, /AB 2\.500 €/);
  for (const image of ["wellfit-token-platinum-front-back.webp", "wellfit-token-diamond-front-back.webp", "wellfit-token-gold-front-back.webp"]) assert.match(page, new RegExp(image.replace(".", "\\.")));
  assert.match(page, /Jeder physische Token wäre mit genau einem zugeordneten NFT verbunden/);
  assert.match(page, /QR-Code öffnet später eine dauerhafte WellFit-Zertifikatsseite/);
  assert.match(page, /Die Visualisierung zeigt bewusst nur einen QR-Platzhalter/);
  for (const qrStep of ["PHYSISCHER TOKEN", "QR AUF DER RÜCKSEITE", "ZUGEORDNETES NFT", "VORTEILE"]) assert.match(page, new RegExp(qrStep));
  assert.match(css, /\.token-allocation-chart[^}]+conic-gradient/);
  assert.match(css, /\.edition-product-visual/);
  assert.match(css, /\.token-qr-story/);
  assert.match(css, /\.theme-turquoise \.token-concept-model/);
});

test("switches every checkpoint to its own visual and preserves the original mayor vision", () => {
  assert.match(communityMap, /useState\(0\)/);
  for (const image of [
    "wellfit-checkpoint-wien-rallye-v3.webp",
    "wellfit-checkpoint-moedling-outdoor-v3.webp",
    "wellfit-checkpoint-wachau-burg-v3.webp",
    "wellfit-checkpoint-salzburg-museum-v3.webp",
    "wellfit-checkpoint-graz-team-v3.webp",
  ]) assert.match(communityMap, new RegExp(image.replace(".", "\\.")));
  assert.doesNotMatch(communityMap, /<iframe|openstreetmap|Nie blind weiterführen/);
  assert.match(communityMap, /Drei Checkpoints erobern/);
  assert.match(communityMap, /Sieben Tage verteidigen/);
  assert.match(communityMap, /zehn Matheaufgaben/);
  assert.match(communityMap, /je fünf Wettbewerbspunkte/);
  assert.match(communityMap, /erhält der bestätigte Gewinner sieben/);
  assert.match(communityMap, /Nur nach einem stabilen Produkt/);
  assert.match(communityMap, /Obergrenze, Freigabetore und rechtliche Einordnung stehen gesammelt in der Welt „XP vs\. Token“/);
  assert.doesNotMatch(communityMap, /Was auf der Landingpage bewusst getrennt bleibt/);
  assert.doesNotMatch(communityMap, /Österreichisches Glücksspielgesetz/);
  assert.match(css, /mission-timeline article:nth-child\(n\+4\)/);
});
