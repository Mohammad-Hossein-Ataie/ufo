import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "UFO Puff B2B",
    template: "%s | UFO Puff B2B"
  },
  description: "محیط سفارش عمده UFO Puff برای همکاران فروش.",
  alternates: {
    canonical: "/b2b"
  }
};

export default function B2BLayout({ children }: { children: React.ReactNode }) {
  return children;
}
