import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import StickyQuoteBar from "@/components/layout/StickyQuoteBar";

/* Pre-render both locales at build time (/, /sw). */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/* Public, localized layout. The <html>/<body> + providers live in the root
   layout (so the non-localized /admin tree shares them); here we just validate
   the locale segment and register it for static rendering of descendants. */
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
  return (
    <>
      {children}
      <StickyQuoteBar />
    </>
  );
}
