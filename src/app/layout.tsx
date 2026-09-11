import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { env } from "@/lib/env";
import { orgJsonLd, websiteJsonLd } from "@/lib/jsonld";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    template: "%s · Barato.ar",
    default: "Barato.ar — Comparador de ofertas en Argentina",
  },
  description:
    "Encontrá el precio más bajo en supermercados, delivery y farmacias de CABA y GBA. Actualizado semanalmente.",
  applicationName: "Barato.ar",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Barato.ar",
    url: env.NEXT_PUBLIC_APP_URL,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
        {env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && env.NODE_ENV === "production" ? (
          <Script
            defer
            data-domain={env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
          />
        ) : null}
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
