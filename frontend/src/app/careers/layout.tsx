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

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div lang={locale} className="min-h-screen flex flex-col" style={{ backgroundColor: "#F2F2F2" }}>
        <header className="sticky top-0 z-20 bg-white/85 border-b" style={{ backdropFilter: "blur(8px)", borderColor: "rgba(0,0,0,0.07)" }}>
          <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-3">
            <Link href="/careers" className="flex items-center gap-3">
              <Image src="/logo.png" alt="Vitorra" width={32} height={32} />
              <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>
                Vitorra<span style={{ color: "#C5B27A" }}> {t("brandSuffix")}</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <CareersLocaleSwitcher />
              <a href="https://vitorra.org" className="hidden sm:inline text-sm font-semibold" style={{ color: "#7A6020" }}>{t("backToSite")}</a>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-10 md:py-14">{children}</main>

        <footer className="border-t py-6" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
          <p className="max-w-5xl mx-auto px-5 text-xs" style={{ color: "#999" }}>
            © {new Date().getFullYear()} {t("footerRights")}
          </p>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
