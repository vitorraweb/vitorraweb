import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";
import { ANALYTICS_ENABLED, PLAUSIBLE_DOMAIN } from "@/lib/constants";

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

/* Mobile viewport — device-width, allow zoom (accessibility), and extend under
   the iOS notch/home-indicator so we can pad with safe-area insets. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#F2F2F2",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Active locale for <html lang> + the client message bundle. Resolves to the
  // default ("en") on non-localized routes such as /admin.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${dmSans.variable} ${cormorant.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            {children}
            <CookieBanner />
            <Toaster position="bottom-right" />
          </CartProvider>
        </NextIntlClientProvider>
        {ANALYTICS_ENABLED && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            data-exclude="/admin/**"
            src="https://plausible.io/js/script.outbound-links.file-downloads.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
