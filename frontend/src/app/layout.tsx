import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Hanken_Grotesk, Fraunces } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";
import { AttributionCapture } from "@/components/AttributionCapture";
import { ANALYTICS_ENABLED, PLAUSIBLE_DOMAIN } from "@/lib/constants";

/* ── Type pairing — Quiet Authority (October 2026) ─────────────────────────────
   Display: Fraunces — a variable serif with an optical-size axis, the closest
   free relative of Canela and Noe Display (the typefaces many luxury houses
   use). At headline sizes the opsz axis sharpens contrast; WONK and SOFT are
   left at 0 so it reads crisp and classical, not quirky. Replaces Cormorant
   Garamond, whose hairlines broke up at small sizes and on cheap screens.

   Body/UI: Hanken Grotesk — a clean grotesk that holds up at 12–16px. Chosen
   over Inter/DM Sans, which external research names as the type of the
   "generic AI site".

   Both keep the old CSS variable names (--font-playfair, --font-inter) so the
   pages not yet redesigned — and the admin portal — pick the change up with
   no component edits. ⚠ This changes the brand typography in the design
   system doc (CLAUDE.md); Olivia should sign it off.                        */
const hanken = Hanken_Grotesk({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
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
      className={`${hanken.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            {children}
            <AttributionCapture />
            <CookieBanner />
            <Toaster position="bottom-right" />
          </CartProvider>
        </NextIntlClientProvider>
        {ANALYTICS_ENABLED && (
          <Script
            defer
            data-domain={PLAUSIBLE_DOMAIN}
            data-exclude="/admin/**,/display/**"
            src="https://plausible.io/js/script.outbound-links.file-downloads.js"
            strategy="afterInteractive"
          />
        )}
        {/* Google tag (gtag.js) — Google Ads conversion tracking */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18227983736"
          strategy="afterInteractive"
        />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18227983736');
          `}
        </Script>
      </body>
    </html>
  );
}
