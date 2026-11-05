import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4, Noto_Naskh_Arabic, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { getPrefs } from "@/lib/data/prefs";
import { dirFor } from "@/lib/i18n";

const ui = Inter({ variable: "--font-ui", subsets: ["latin"], display: "swap" });
const entry = Source_Serif_4({ variable: "--font-entry", subsets: ["latin"], display: "swap" });
const entryAr = Noto_Naskh_Arabic({
  variable: "--font-entry-ar",
  subsets: ["arabic"],
  weight: ["400", "600"],
  display: "swap",
});
const uiAr = IBM_Plex_Sans_Arabic({
  variable: "--font-ui-ar",
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Journal", template: "%s · Journal" },
  description: "A calm, private place to journal every day.",
  applicationName: "Journal",
  appleWebApp: { capable: true, title: "Journal", statusBarStyle: "default" },
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#161514" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const prefs = await getPrefs();
  return (
    <html
      lang={prefs.lang}
      dir={dirFor(prefs.lang)}
      data-theme={prefs.theme}
      data-palette={prefs.palette}
      style={{ ["--entry-size" as string]: `${prefs.fontSize}px` }}
      className={`${ui.variable} ${entry.variable} ${entryAr.variable} ${uiAr.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
