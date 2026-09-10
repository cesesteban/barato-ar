import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { env } from "@/lib/env";
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
