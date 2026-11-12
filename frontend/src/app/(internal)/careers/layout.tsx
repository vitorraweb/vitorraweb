import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { locales, defaultLocale } from "@/i18n/routing";
import { loadMessages } from "@/i18n/messages";
import CareersLocaleSwitcher from "./CareersLocaleSwitcher";

/* The careers portal is a standalone, public recruitment mini-site that sits
   OUTSIDE the locale-prefixed routing (so its URL stays /careers). It resolves
   its own language from the NEXT_LOCALE cookie and provides its own next-intl
   context, so the language switcher and French work here without moving the
   route. The main marketing site is untouched. */

async function resolveLocale(): Promise<string> {
  const raw = (await cookies()).get("CAREERS_LOCALE")?.value;
  return raw && (locales as readonly string[]).includes(raw) ? raw : defaultLocale;
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveLocale();
  const t = await getTranslations({ locale, namespace: "careersPortal" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function CareersLayout({ children }: { children: React.ReactNode }) {
  const locale = await resolveLocale();
  const messages = await loadMessages(locale);
  // The footer is a server component: let it render in the cookie's language.
  setRequestLocale(locale);

  /* The main site's header and footer, so the careers portal reads as part
     of vitorra.org; only the language switch is the portal's own. */
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale} className="min-h-screen flex flex-col bg-paper text-ink">
        <Header languageSwitcher={<CareersLocaleSwitcher />} />
        <main id="main" className="flex-1 w-full">{children}</main>
        <Footer />
      </div>
    </NextIntlClientProvider>
  );
}
