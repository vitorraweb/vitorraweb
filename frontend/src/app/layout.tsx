import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";

/* ── Body: DM Sans — geometric humanist, cleaner and more distinctive than
   Inter. Used by Notion, Google product pages, and many premium SaaS brands.
   Variable font: supports optical-size axis for precise weight control.     */
const dmSans = DM_Sans({
  variable: "--font-inter",   /* reuses existing CSS var — no component changes needed */
  subsets: ["latin"],
  display: "swap",
});

/* ── Headings: Cormorant Garamond — high-contrast luxury serif. Used by
   LVMH, premium agencies, and editorial publications. At 60-80px the thin/
   thick stroke contrast creates visual richness that Playfair Display can't
   match. Weight 600-700 gives authority at smaller card-title sizes too.   */
const cormorant = Cormorant_Garamond({
  variable: "--font-playfair", /* reuses existing CSS var — no component changes needed */
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Vitorra Holdings Limited",
    template: "%s | Vitorra Holdings Limited",
  },
  description:
    "Vitorra is a diversified distribution and management company providing Fuel Eco Tech, shipping & logistics, Vitorra Coffee, and SEAL Hemostatic Wound Spray across Uganda and East Africa.",
  keywords: [
    "Vitorra",
    "Fuel Eco Tech",
    "logistics Uganda",
    "SEAL wound spray",
    "Ugandan coffee",
    "East Africa holdings",
  ],
  authors: [{ name: "Vitorra Holdings Limited" }],
  creator: "Vitorra Holdings Limited",
  metadataBase: new URL("https://vitorra.org"),
  openGraph: {
    type: "website",
    locale: "en_UG",
    url: "https://vitorra.org",
    siteName: "Vitorra Holdings Limited",
    title: "Vitorra Holdings Limited",
    description:
      "Innovative products and dependable solutions across fuel technology, logistics, healthcare, and premium coffee.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vitorra Holdings Limited",
    description:
      "Innovative products and dependable solutions across fuel technology, logistics, healthcare, and premium coffee.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${cormorant.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
