import type { Metadata } from "next";
import AuthExperience from "../auth/AuthExperience";

export const metadata: Metadata = {
  title: "Passwort vergessen",
  description: "Grafische Vorschau der zukünftigen WellFit-Passwortwiederherstellung.",
  alternates: { canonical: "/passwort-vergessen" },
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <AuthExperience mode="forgot" />;
}
