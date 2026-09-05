"use client";

import { type ReactNode, useEffect, useState } from "react";

export type ColorTheme = "standard" | "turquoise";

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>("standard");

  useEffect(() => {
    const restoreTheme = window.setTimeout(() => {
      const savedTheme = window.localStorage.getItem("wellfit-color-theme");
      if (savedTheme === "standard" || savedTheme === "turquoise") setColorTheme(savedTheme);
    }, 0);
    return () => window.clearTimeout(restoreTheme);
  }, []);

  function chooseColorTheme(theme: ColorTheme) {
    setColorTheme(theme);
    window.localStorage.setItem("wellfit-color-theme", theme);
  }

  return [colorTheme, chooseColorTheme] as const;
}

export function ThemeSwitcher({ colorTheme, onChange }: { colorTheme: ColorTheme; onChange: (theme: ColorTheme) => void }) {
  return (
    <div className="theme-switcher" role="group" aria-label="Grundfarbe wählen" data-swipe-ignore>
      <span className="theme-switcher-label">Farbe</span>
      <button type="button" className={colorTheme === "standard" ? "active" : ""} aria-pressed={colorTheme === "standard"} onClick={() => onChange("standard")}>
        <i className="theme-dot theme-dot-standard" aria-hidden="true" />Standard
      </button>
      <button type="button" className={colorTheme === "turquoise" ? "active" : ""} aria-pressed={colorTheme === "turquoise"} onClick={() => onChange("turquoise")}>
        <i className="theme-dot theme-dot-turquoise" aria-hidden="true" />Dunkles Türkis
      </button>
    </div>
  );
}

export function LegalThemeShell({ children }: { children: ReactNode }) {
  const [colorTheme, chooseColorTheme] = useColorTheme();

  return (
    <div className={`legal-theme-shell theme-${colorTheme}`}>
      <ThemeSwitcher colorTheme={colorTheme} onChange={chooseColorTheme} />
      {children}
    </div>
  );
}
