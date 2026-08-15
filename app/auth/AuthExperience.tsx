"use client";

/* Existing WellFit artwork is already optimized as WebP. */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { useColorTheme } from "../ThemeControls";

export type AuthMode = "login" | "register" | "forgot";

const content = {
  login: {
    eyebrow: "WILLKOMMEN ZURÜCK",
    title: "Deine Welt wartet auf dich.",
    intro: "Melde dich später hier an, um deinen Buddy, deine Missionen und deinen Fortschritt wiederzufinden.",
    submit: "Anmelden",
    preview: "Designvorschau: Die echte Anmeldung wird später mit der bestehenden WellFit-Technik verbunden.",
  },
  register: {
    eyebrow: "DEINE REISE BEGINNT",
    title: "Ein Platz in der WellFit-Welt.",
    intro: "Lege später dein Profil an, wähle deinen ersten Buddy und starte mit deiner persönlichen Mission.",
    submit: "Konto erstellen",
    preview: "Designvorschau: Es wurde kein Konto erstellt und es wurden keine Daten gespeichert.",
  },
  forgot: {
    eyebrow: "ZUGANG WIEDERFINDEN",
    title: "Neues Passwort anfordern.",
    intro: "Gib später deine E-Mail-Adresse ein. WellFit sendet dir dann einen sicheren Link für ein neues Passwort.",
    submit: "Link anfordern",
    preview: "Designvorschau: Es wurde keine E-Mail versendet und keine Adresse gespeichert.",
  },
} as const;

function PasswordField({ id, label, autoComplete }: { id: string; label: string; autoComplete: "current-password" | "new-password" }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-password-field">
        <input id={id} name={id} type={visible ? "text" : "password"} autoComplete={autoComplete} placeholder="••••••••••••" minLength={8} required />
        <button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? `${label} verbergen` : `${label} anzeigen`} aria-pressed={visible}>
          {visible ? "Verbergen" : "Anzeigen"}
        </button>
      </div>
    </div>
  );
}

export default function AuthExperience({ mode }: { mode: AuthMode }) {
  const [colorTheme] = useColorTheme();
  const [submitted, setSubmitted] = useState(false);
  const copy = content[mode];

  function previewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
  }

  return (
    <main className={`auth-shell theme-${colorTheme}`}>
      <div className="auth-atmosphere" aria-hidden="true"><i /><i /><i /></div>

      <header className="auth-topbar">
        <Link className="auth-brand" href="/" aria-label="Zurück zur WellFit-Landingpage">
          <img src="/images/wellfit-logo.webp" alt="WellFit – Move, Learn, Grow" width="700" height="548" />
        </Link>
        <Link className="auth-back" href="/"><span aria-hidden="true">←</span> Zurück zur Welt</Link>
      </header>

      <div className="auth-layout">
        <section className="auth-story" aria-label="WellFit-Zugangsvorschau">
          <div className="auth-story-copy">
            <p className="eyebrow">DEIN BUDDY · DEINE MISSION · DEIN WEG</p>
            <h1>Zurück in eine Welt,<br/><em>die dich bewegt.</em></h1>
            <p>Der spätere WellFit-Zugang verbindet dein Profil mit deinem persönlichen Buddy, deinen Entdeckungen und deinem Fortschritt – auf allen geplanten Missionen.</p>
            <div className="auth-journey" aria-label="Geplanter Einstieg in WellFit">
              <div><span>01</span><strong>Profil</strong><small>Dein sicherer Zugang</small></div>
              <div><span>02</span><strong>Buddy</strong><small>Dein Begleiter wartet</small></div>
              <div><span>03</span><strong>Mission</strong><small>Draußen weitermachen</small></div>
            </div>
          </div>
          <div className="auth-buddy-stage" aria-hidden="true">
            <div className="auth-orbit auth-orbit-one" />
            <div className="auth-orbit auth-orbit-two" />
            <img src="/images/wellfit-buddy-cutout.webp" alt="" loading="eager" />
            <span>DEIN BEGLEITER</span>
          </div>
        </section>

        <section className="auth-access" aria-labelledby="auth-title">
          <div className="auth-card">
            <div className="auth-preview-label"><span aria-hidden="true" /> DESIGNVORSCHAU · NOCH NICHT VERBUNDEN</div>
            <nav className="auth-mode-nav" aria-label="WellFit-Zugang">
              <Link className={mode === "login" ? "active" : ""} href="/login" aria-current={mode === "login" ? "page" : undefined}>Anmelden</Link>
              <Link className={mode === "register" ? "active" : ""} href="/registrieren" aria-current={mode === "register" ? "page" : undefined}>Registrieren</Link>
            </nav>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2 id="auth-title">{copy.title}</h2>
            <p className="auth-intro">{copy.intro}</p>

            <form className="auth-form" onSubmit={previewSubmit} onChange={() => setSubmitted(false)}>
              {mode === "register" && (
                <div className="auth-field">
                  <label htmlFor="register-name">Vor- und Nachname</label>
                  <input id="register-name" name="name" type="text" autoComplete="name" placeholder="Dein Name" required />
                </div>
              )}

              <div className="auth-field">
                <label htmlFor={`${mode}-email`}>E-Mail-Adresse</label>
                <input id={`${mode}-email`} name="email" type="email" autoComplete="email" placeholder="name@beispiel.at" required />
              </div>

              {mode === "login" && <PasswordField id="login-password" label="Passwort" autoComplete="current-password" />}

              {mode === "register" && (
                <>
                  <PasswordField id="register-password" label="Passwort" autoComplete="new-password" />
                  <PasswordField id="register-password-confirm" label="Passwort wiederholen" autoComplete="new-password" />
                  <p className="auth-password-note">Mindestens 8 Zeichen · die endgültigen Regeln folgen mit der technischen Anbindung.</p>
                </>
              )}

              {mode === "login" && (
                <div className="auth-form-options">
                  <label className="auth-check"><input type="checkbox" name="remember" /> <span>Angemeldet bleiben</span></label>
                  <Link href="/passwort-vergessen">Passwort vergessen?</Link>
                </div>
              )}

              {mode === "register" && (
                <div className="auth-consent-group">
                  <label className="auth-check auth-consent">
                    <input type="checkbox" name="adult" required />
                    <span>Ich bin mindestens 18 Jahre alt.</span>
                  </label>
                  <label className="auth-check auth-consent">
                    <input type="checkbox" name="consent" required />
                    <span>Ich akzeptiere die <Link href="/datenschutz">Datenschutzhinweise</Link> und habe das <Link href="/impressum">Impressum</Link> gelesen.</span>
                  </label>
                </div>
              )}

              <button className="auth-submit" type="submit">{copy.submit}<span aria-hidden="true">↗</span></button>

              {submitted && <p className="auth-preview-message" role="status" aria-live="polite">{copy.preview}</p>}
            </form>

            <p className="auth-data-note"><span aria-hidden="true">◇</span> Diese Oberfläche ist nur grafisch. Eingaben werden nicht gespeichert oder versendet.</p>

            {mode === "login" && <p className="auth-switch">Noch kein Konto? <Link href="/registrieren">Jetzt registrieren</Link></p>}
            {mode === "register" && <p className="auth-switch">Du hast bereits ein Konto? <Link href="/login">Jetzt anmelden</Link></p>}
            {mode === "forgot" && <p className="auth-switch"><Link href="/login"><span aria-hidden="true">←</span> Zurück zur Anmeldung</Link></p>}
          </div>
        </section>
      </div>

      <footer className="auth-footer"><span>© 2026 WellFit · Produkt in Entwicklung</span><span><Link href="/impressum">Impressum</Link><Link href="/datenschutz">Datenschutz</Link></span></footer>
    </main>
  );
}
