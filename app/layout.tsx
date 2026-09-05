import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-body", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wellfit-bewegt.master-bernd.chatgpt.site"),
  title: {
    default: "WellFit – Bewegung, die verbindet",
    template: "%s · WellFit",
  },
  description: "WellFit verbindet reale Bewegung, Lernen und gemeinsame Zeit mit einem persönlichen KI-Buddy und Augmented Reality.",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "WellFit – Die Welt wird dein Spiel",
    description: "Reale Bewegung, Wissen und gemeinsame Zeit – begleitet von einem persönlichen KI-Buddy in Augmented Reality.",
    url: "/",
    siteName: "WellFit",
    locale: "de_AT",
    type: "website",
    images: [{ url: "/images/wellfit-hero-editorial.webp", width: 1536, height: 1024, alt: "Eine Familie erlebt mit ihrem WellFit-Buddy eine Mission in der realen Welt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WellFit – Die Welt wird dein Spiel",
    description: "Bewegen. Entdecken. Wachsen.",
    images: ["/images/wellfit-hero-editorial.webp"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body className={`${manrope.variable} ${cormorant.variable}`}>{children}</body></html>;
}
