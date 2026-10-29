import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { QuickAnswers, quickAnswers } from "@/components/sections/QuickAnswers";
import { localeAlternates, products, faqPage, breadcrumbs, ldJson } from "@/lib/seo";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Faq } from "@/components/ui/faq";
import { ServiceChain } from "@/components/motion/ServiceChain";
import { RouteMap } from "@/components/maps/RouteMap";
import { Film } from "@/components/system/Film";
import { Section, Container, ButtonLink } from "@/components/system";
import {
  SectionHead, Steps, ContactBand,
} from "@/components/system/blocks";
import { CinematicHero, DesignedBanner, FactStrip, Picture } from "@/components/system/imagery";

/* ─── Logistics Services — Quiet Authority ────────────────────────────────────
   Built around getting a usable quote: what we do → the services → the five
   details we need to quote in one round → what you can expect from us →
   questions → contact.

   The external review flagged this page for promises nobody can keep. Removed:
   "no delays at the border", "real-time tracking", "delivered on schedule,
   every time". Border processing depends on the authorities; tracking depends
   on the route and carrier — so we say what we do and agree the rest when we
   quote. All generated imagery (Vitorra-liveried trucks, warehouse, control
   room) is gone; photographs are licensed stock (public/images/stock/README.md)
   and never captioned as Vitorra's own fleet or premises.     */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.logistics" });
  return { title: t("title"), description: t("description"), alternates: localeAlternates(locale, "/products/logistics") };
}

const ENQUIRE = "/enquire?sector=LOGISTICS";

export default async function LogisticsPage() {
  const t = await getTranslations("logisticsQA");
  const old = await getTranslations("logisticsPage");
  const home = await getTranslations("homeQA");
  const shared = await getTranslations("productQA");
  const tp = await getTranslations("products");
  const alt = await getTranslations("imageAlt");
  const bn = await getTranslations("banners");
  const vt = await getTranslations("visuals");

  const faqs = [
    { q: old("faq1Q"), a: old("faq1A") },
    { q: old("faq2Q"), a: old("faq2A") },
    { q: old("faq3Q"), a: t("faq3A") },
    { q: old("faq4Q"), a: t("faq4A") },
    { q: old("faq5Q"), a: old("faq5A") },
  ];

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([
          products.logistics,
          faqPage([...(await quickAnswers("logistics")), ...faqs]),
          breadcrumbs([{ name: "Vitorra", path: "/" }, { name: tp("logistics.name"), path: "/products/logistics" }]),
        ])} />

        <CinematicHero
          image="/images/stock/port-aerial.jpg"
          transitionName="hero-logistics"
          alt={alt("portAerial")}
          index="04"
          label={tp("logistics.name")}
          lines={[t("title")]}
          lead={t("lead")}
          primary={{ label: t("primary"), href: ENQUIRE }}
          secondary={{ label: t("secondary"), href: "#logistics-need" }}
        />
        <FactStrip
          facts={[
            { k: t("factModesK"), v: t("factModesV") },
            { k: t("factCoverK"), v: t("factCoverV") },
            { k: t("factCustomsK"), v: t("factCustomsV") },
            { k: t("factQuoteK"), v: t("factQuoteV") },
          ]}
        />
        <QuickAnswers page="logistics" />

        {/* ══ Services ══════════════════════════════════════════════════════ */}
        <Section tone="paper" rule aria-labelledby="logistics-services">
          <Container>
            <SectionHead id="logistics-services" label={t("servicesLabel")} title={t("servicesTitle")} className="mb-10 sm:mb-14" />
            <ServiceChain
              items={[
                { title: old("cap1Title"), body: t("cap1Body") },
                { title: old("cap2Title"), body: old("cap2Body") },
                { title: old("cap3Title"), body: t("cap3Body") },
                { title: old("cap4Title"), body: old("cap4Body") },
              ]}
            />
            <Film
              className="mt-16 max-w-[44rem]"
              src="/videos/logistics-hero.mp4"
              poster="/photos/poster-logistics.jpg"
              title={t("filmTitle")}
              caption={t("filmCaption")}
              playLabel={shared("playFilm")}
            />
          </Container>
        </Section>

        <DesignedBanner src="/banners/wide-logistics.webp" alt={bn("wideLogisticsAlt")} width={2880} height={1234} tone="ink" />

        {/* ══ Routes — the two port corridors, on a real map ═══════════════ */}
        <Section tone="paper" aria-labelledby="logistics-routes">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-4">
              <SectionHead id="logistics-routes" label={vt("routesLabel")} title={vt("routesTitle")} body={vt("routesBody")} />
            </div>
            <RouteMap
              className="lg:col-span-8 m-0"
              labels={{
                title: vt("routesMapTitle"),
                northern: vt("routesNorthern"),
                central: vt("routesCentral"),
                onward: vt("routesOnward"),
                schematic: vt("routesSchematic"),
                portMombasa: vt("portMombasa"),
                portDar: vt("portDar"),
              }}
            />
          </Container>
        </Section>

        {/* ══ What we need to quote ═════════════════════════════════════════ */}
        <Section tone="deep" id="logistics-need" aria-labelledby="logistics-need-heading">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="logistics-need-heading" label={t("needLabel")} title={t("needTitle")} body={t("needBody")} />
              <div className="mt-10">
                <ButtonLink href={ENQUIRE}>{t("primary")}</ButtonLink>
              </div>
              <Picture className="mt-14 max-w-[22rem]" src="/banners/keyvisual-logistics.webp" alt={bn("keyLogisticsAlt")} ratio="4/5" grade={false} sizes="(min-width: 1024px) 25vw, 90vw" />
            </div>
            <ol className="lg:col-span-6 lg:col-start-7 border-t border-line-strong">
              {[1, 2, 3, 4, 5].map((n) => (
                <li key={n} className="grid grid-cols-[3rem_1fr] gap-4 py-5 border-b border-line">
                  <span className="t-label font-numeric text-gold-ink pt-1">{String(n).padStart(2, "0")}</span>
                  <span className="t-body text-ink">{t(`need${n}`)}</span>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        {/* ══ What you can expect ═══════════════════════════════════════════ */}
        <Section tone="ink" aria-labelledby="logistics-expect">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
            <SectionHead id="logistics-expect" onInk label={t("expectLabel")} title={t("expectTitle")} className="lg:col-span-4" />
            <div className="lg:col-span-8">
              <Steps
                onInk
                items={[1, 2, 3].map((n) => ({ title: t(`expect${n}Title`), body: t(`expect${n}Body`) }))}
              />
            </div>
          </Container>
        </Section>

        {/* ══ Questions ═════════════════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="logistics-faq">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16">
            <SectionHead id="logistics-faq" label={shared("faqLabel")} title={t("faqTitle")} className="lg:col-span-4" />
            <div className="lg:col-span-8">
              <Faq items={faqs} />
            </div>
          </Container>
        </Section>

        <ContactBand
          title={t("contactTitle")}
          body={t("contactBody")}
          briefLabel={t("primary")}
          briefHref={ENQUIRE}
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
