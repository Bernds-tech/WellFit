import type { Metadata } from "next";
import AuthExperience from "../auth/AuthExperience";

export const metadata: Metadata = {
  title: "Registrieren",
  description: "Grafische Vorschau der zukünftigen WellFit-Registrierung.",
  alternates: { canonical: "/registrieren" },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <AuthExperience mode="register" />;
}
