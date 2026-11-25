import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { DEMOS, findDemo } from "@/components/websites/demos";
import { DemoSite } from "@/components/websites/DemoSite";

/* A sample client website, full screen: what an owner opens on their own phone
   during a sales visit or from an ad. Not indexed (it's a made-up business);
   a thin Vitorra bar on top says it is a sample and links back to the offer. */

type Props = { params: Promise<{ locale: string; slug: string }> };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => DEMOS.map((d) => ({ locale, slug: d.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const demo = findDemo(slug);
  const t = await getTranslations({ locale, namespace: "websites.demo" });
  return { title: demo ? `${demo.name} · ${t("metaSample")}` : t("metaSample"), robots: { index: false, follow: true } };
}

export default async function DemoPage({ params }: Props) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const demo = findDemo(slug);
  if (!demo) notFound();
  const t = await getTranslations("websites.demo");

  return (
    <main id="main" className="flex-1">
      <div className="bg-ink text-ink-fg">
        <div className="mx-auto max-w-[40rem] flex items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/websites" className="inline-flex items-center gap-1.5 text-[12px] text-ink-fg-muted hover:text-ink-fg">
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />{t("barBack")}
          </Link>
          <Link href="/websites#preview" className="text-[12px] font-semibold text-gold whitespace-nowrap">{t("barCta")}</Link>
        </div>
      </div>
      <div className="mx-auto max-w-[40rem]">
        <DemoSite demo={demo} />
      </div>
    </main>
  );
}
