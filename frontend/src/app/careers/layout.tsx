import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
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
  // Cookie-locale translator for the chrome (the client pages + switcher read
  // the same locale from the provider below).
  const t = await getTranslations({ locale, namespace: "careersPortal" });

  /* Quiet Authority shell for the careers mini-site: paper, a hairline
     header with the wordmark, a quiet footer. */
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale} className="q-scope min-h-screen flex flex-col bg-paper text-ink">
        <header className="sticky top-0 z-20 bg-paper border-b border-line">
          <div className="q-container h-16 flex items-center justify-between gap-4">
            <Link href="/careers" className="flex items-center gap-3">
              <Image src="/logo.png" alt="" width={32} height={32} className="mix-blend-multiply" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[1.375rem] tracking-[-0.01em] text-ink">Vitorra</span>
                <span className="t-label text-[0.625rem] tracking-[0.22em] text-ink-muted mt-1">{t("brandSuffix")}</span>
              </span>
            </Link>
            <div className="flex items-center gap-6">
              <CareersLocaleSwitcher />
              <a href="https://vitorra.org" className="hidden sm:inline q-link t-small text-ink">{t("backToSite")}</a>
            </div>
          </div>
        </header>

        <main id="main" className="flex-1 w-full q-container py-14 md:py-20">{children}</main>

        <footer className="border-t border-line bg-paper-deep">
          <p className="q-container py-6 t-small text-ink-muted">© {new Date().getFullYear()} {t("footerRights")}</p>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
