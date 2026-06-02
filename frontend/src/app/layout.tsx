import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
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
      className={`${inter.variable} ${playfair.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
