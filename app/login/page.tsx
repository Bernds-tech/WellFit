import type { Metadata } from "next";
import AuthExperience from "../auth/AuthExperience";

export const metadata: Metadata = {
  title: "Anmelden",
  description: "Grafische Vorschau des zukünftigen WellFit-Zugangs.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <AuthExperience mode="login" />;
}
