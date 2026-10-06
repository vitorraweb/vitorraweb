import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Faq } from "@/components/ui/faq";
import { Section, Container, ButtonLink } from "@/components/system";
import {
  ProductIntro, SectionHead, FactGrid, Steps, ContactBand,
} from "@/components/system/blocks";
import { Film } from "@/components/system/Film";

/* ─── Logistics Services — Quiet Authority ────────────────────────────────────
   Built around getting a usable quote: what we do → the services → the five
   details we need to quote in one round → what you can expect from us →
   questions → contact.

   The external review flagged this page for promises nobody can keep. Removed:
   "no delays at the border", "real-time tracking", "delivered on schedule,
   every time". Border processing depends on the authorities; tracking depends
   on the route and carrier — so we say what we do and agree the rest when we
   quote. All generated imagery (Vitorra-liveried trucks, warehouse, control
   room) is gone; the one film is licensed stock and its caption says so.     */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.logistics" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE = "/enquire?sector=LOGISTICS";

export default async function LogisticsPage() {
  const t = await getTranslations("logisticsQA");
  const old = await getTranslations("logisticsPage");
  const home = await getTranslations("homeQA");
  const shared = await getTranslations("productQA");
  const tp = await getTranslations("products");

  const faqs = [
    { q: old("faq1Q"), a: old("faq1A") },
    { q: old("faq2Q"), a: old("faq2A") },
    { q: old("faq3Q"), a: t("faq3A") },
    { q: old("faq4Q"), a: t("faq4A") },
    { q: old("faq5Q"), a: old("faq5A") },
  ];

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">

        <ProductIntro
          index="04"
          name={tp("logistics.name")}
          title={t("title")}
          lead={t("lead")}
          primary={{ label: t("primary"), href: ENQUIRE }}
          secondary={{ label: t("secondary"), href: "#logistics-need" }}
          facts={[
            { k: t("factModesK"), v: t("factModesV") },
            { k: t("factCoverK"), v: t("factCoverV") },
            { k: t("factCustomsK"), v: t("factCustomsV") },
            { k: t("factQuoteK"), v: t("factQuoteV") },
          ]}
          media={
            <Film
              src="/videos/logistics-hero.mp4"
              poster="/videos/logistics-hero-poster.jpg"
              title={t("filmTitle")}
              caption={t("filmCaption")}
              playLabel={shared("playFilm")}
              ratio="4/5"
            />
          }
        />

        {/* ══ Services ══════════════════════════════════════════════════════ */}
        <Section tone="paper" rule aria-labelledby="logistics-services">
          <Container>
            <SectionHead id="logistics-services" label={t("servicesLabel")} title={t("servicesTitle")} className="mb-14" />
            <FactGrid
              columns={4}
              items={[
                { title: old("cap1Title"), body: t("cap1Body") },
                { title: old("cap2Title"), body: old("cap2Body") },
                { title: old("cap3Title"), body: t("cap3Body") },
                { title: old("cap4Title"), body: old("cap4Body") },
              ]}
            />
          </Container>
        </Section>

        {/* ══ What we need to quote ═════════════════════════════════════════ */}
        <Section tone="deep" id="logistics-need" aria-labelledby="logistics-need-heading">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="logistics-need-heading" label={t("needLabel")} title={t("needTitle")} body={t("needBody")} />
              <div className="mt-10">
                <ButtonLink href={ENQUIRE}>{t("primary")}</ButtonLink>
              </div>
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
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
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
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
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
