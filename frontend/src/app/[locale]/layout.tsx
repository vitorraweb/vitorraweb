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

/* Message groups read only by server components (page copy, metadata, legal
   text, Q&As). Every page used to ship the whole dictionary, about 110 KB of
   text, inside its HTML for the browser to parse; these groups are half of it
   and no browser-side component reads them. A new group is sent to the
   browser unless it is listed here. ⚠ Before a "use client" component reads
   one of these with useTranslations, take it off this list, or the visitor
   sees the message key instead of the words. */
const SERVER_ONLY_NAMESPACES = new Set([
  "meta", "legal", "team", "evidence", "banners", "visuals",
  "fetPage", "sealPage", "coffeePage", "logisticsPage", "enquirePage", "blogPage", "careersPage", "shopSoon", "fetCatalogue",
  "homeQA", "fetQA", "productQA", "sealQA", "coffeeQA", "logisticsQA", "aboutQA",
]);

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
  const all = await getMessages();
  const messages = Object.fromEntries(
    Object.entries(all).filter(([ns]) => !SERVER_ONLY_NAMESPACES.has(ns)),
  );
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
