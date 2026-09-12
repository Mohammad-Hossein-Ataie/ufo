import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "UFO Puff B2B",
    template: "%s | UFO Puff B2B",
  },
  description: "محیط سفارش عمده UFO Puff برای همکاران فروش.",
  // Utility/account pages inherit noindex; existing public pages opt in explicitly.
  robots: { index: false, follow: false },
  alternates: {
    canonical: null,
  },
  // Avoid presenting account and order pages as the public retail homepage.
  openGraph: null,
  twitter: null,
};

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return children;
}
