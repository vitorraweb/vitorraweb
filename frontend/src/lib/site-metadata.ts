import type { Metadata, Viewport } from "next";

/* Site-wide metadata and viewport, shared by the two root layouts: the public
   site (app/[locale]/layout.tsx, pre-rendered and cached) and the private
   tools (app/(internal)/layout.tsx: console, staff portal, careers, screens). */

export const siteMetadata: Metadata = {
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
  /* Ownership proof for Google Search Console and Bing Webmaster Tools: set
     the codes they give you as Vercel env vars; nothing renders until then. */
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
};

/* Mobile viewport — device-width, allow zoom (accessibility), and extend under
   the iOS notch/home-indicator so we can pad with safe-area insets. */
export const siteViewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F2F2F2",
};
