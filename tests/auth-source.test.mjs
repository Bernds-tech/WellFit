import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync(new URL("../app/landing/LandingExperience.tsx", import.meta.url), "utf8");
const auth = fs.readFileSync(new URL("../app/auth/AuthExperience.tsx", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
const privacy = fs.readFileSync(new URL("../app/datenschutz/page.tsx", import.meta.url), "utf8");

test("uses one consistent Login entrance in every WellFit world", () => {
  assert.match(page, /function HeaderLogin\(\)/);
  assert.match(page, /className="header-login-button" href="\/login"/);
  assert.equal((page.match(/<HeaderLogin \/>/g) ?? []).length, 5);
  assert.doesNotMatch(page, /<div className="side-world-title"><b>/);
  assert.doesNotMatch(page, /<a className="header-link" href="#vormerken">Kontakt<\/a>/);
  assert.match(css, /\.header \.header-login-button,\.side-world-header \.header-login-button\{grid-column:3;grid-row:1/);
  assert.match(css, /\.header-login-button\{[^}]*min-height:44px/);
});

test("provides complete, accessible visual auth states", () => {
  for (const mode of ["login", "register", "forgot"]) assert.match(auth, new RegExp(`${mode}: \\{`));
  assert.match(auth, /<label htmlFor=\{id\}>\{label\}<\/label>/);
  assert.match(auth, /autoComplete="email"/);
  assert.match(auth, /autoComplete="current-password"/);
  assert.match(auth, /autoComplete="new-password"/);
  assert.match(auth, /Passwort vergessen\?/);
  assert.match(auth, /Jetzt registrieren/);
  assert.match(auth, /Ich bin mindestens 18 Jahre alt/);
  assert.match(auth, /href="\/datenschutz"/);
  assert.match(auth, /href="\/impressum"/);
  assert.match(auth, /role="status" aria-live="polite"/);
  assert.match(css, /\.auth-password-field button\{[^}]*min-height:50px/);
  assert.match(css, /\.auth-submit\{[^}]*min-height:54px/);
  assert.match(css, /@media\(max-width:620px\)[^]*\.auth-access/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)[^]*\.auth-story:before/);
});

test("keeps the account concept visual-only and privacy-consistent", () => {
  assert.match(auth, /event\.preventDefault\(\)/);
  assert.match(auth, /Eingaben werden nicht gespeichert oder versendet/);
  assert.match(auth, /DESIGNVORSCHAU · NOCH NICHT VERBUNDEN/);
  assert.doesNotMatch(auth, /\b(?:fetch|axios|signIn|createUser|setCookie|getCookie)\s*\(/);
  assert.doesNotMatch(auth, /(?:supabase|firebase|\/api\/auth|localStorage|sessionStorage)/i);
  assert.doesNotMatch(auth, /<form[^>]+(?:action|method)=/i);
  assert.match(privacy, /Login-, Registrierungs- und Passwortoberflächen sind interaktive Designvorschauen/);
  assert.match(privacy, /weder an WellFit übertragen noch dort gespeichert/);
});
