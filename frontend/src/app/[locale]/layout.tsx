import { notFound } from "next/navigation";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import StickyQuoteBar from "@/components/layout/StickyQuoteBar";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { SmoothScroll } from "@/components/motion/SmoothScroll";
import { ScrollProgress } from "@/components/motion/ScrollProgress";
import { Cursor } from "@/components/motion/Cursor";
import { BackToTop } from "@/components/motion/BackToTop";
import { organization, website, ldJson } from "@/lib/seo";
import { RootDocument } from "@/components/layout/RootDocument";
import { siteMetadata, siteViewport } from "@/lib/site-metadata";

export const metadata = siteMetadata;
export const viewport = siteViewport;

/* Pre-render both locales at build time (/, /sw). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* Root layout of the public, localized site. It takes the language from the
   URL, never from the request, so every page under it can be built ahead and
   served from the edge cache. The console, staff portal and other private
   tools have their own root layout (app/(internal)/layout.tsx); moving
   between the two is a full page load, which nobody does mid-visit. */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const common = await getTranslations("common");
  const messages = await getMessages();
  return (
    <RootDocument locale={locale} messages={messages}>
      {/* Who Vitorra is, for search engines and AI assistants (every page). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([organization, website])} />
      {/* Cinematic layer — public site only, never the portals. */}
      <SmoothScroll />
      <ScrollProgress />
      <Cursor />
      {children}
      <StickyQuoteBar />
      <WhatsAppButton />
      <BackToTop label={common("backToTop")} />
    </RootDocument>
  );
}
