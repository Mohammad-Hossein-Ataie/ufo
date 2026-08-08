import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { canonical, siteOrigin } from "@ufo/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "یوفوپاف | UFO Puff | فروشگاه پاد و ویپ",
    template: "%s | یوفوپاف UFO Puff",
  },
  description:
    "یوفوپاف UFO Puff فروشگاه فارسی پاد، ویپ، جویس و لوازم جانبی با مسیر جدا برای فروش تکی، عمده و ادمین.",
  applicationName: "یوفوپاف UFO Puff",
  manifest: "/favicons/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicons/favicon.ico", sizes: "any" },
      { url: "/favicons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/favicons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicons/favicon.ico"],
  },
  alternates: {
    canonical: canonical("/"),
    languages: {
      "fa-IR": canonical("/"),
    },
  },
  openGraph: {
    title: "یوفوپاف | UFO Puff",
    description: "یوفوپاف، فروشگاه فارسی پاد و ویپ با موجودی و قیمت شفاف.",
    url: canonical("/"),
    siteName: "یوفوپاف | UFO Puff",
    images: [{ url: "/logos/logo.png", width: 500, height: 500, alt: "لوگوی یوفوپاف UFO Puff" }],
    locale: "fa_IR",
    type: "website",
  },
  appleWebApp: {
    title: "یوفوپاف",
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#05070B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa-IR" dir="rtl">
      <body suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
