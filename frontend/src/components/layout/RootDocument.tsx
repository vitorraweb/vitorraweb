import { Hanken_Grotesk, Fraunces } from "next/font/google";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import "@/app/globals.css";
import { CookieBanner } from "@/components/ui/cookie-banner";
import { CONSENT_HEAD_SCRIPT } from "@/lib/cookies";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";
import { AttributionCapture } from "@/components/AttributionCapture";
import { GoogleTag } from "@/components/GoogleTag";
import { PostHogAnalytics } from "@/components/PostHogAnalytics";

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

/* The <html> document both root layouts share. The public site has its own
   root layout so its pages can be built ahead and served from Vercel's edge
   cache (a root layout that read the visitor's language from the request made
   every page render on every visit, 0.6 to 1.7 s before the first byte). */
export function RootDocument({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <html
      lang={locale}
      className={`${hanken.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: CONSENT_HEAD_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            {children}
            <AttributionCapture />
            <GoogleTag />
            <PostHogAnalytics />
            <CookieBanner />
            <Toaster position="bottom-right" />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
