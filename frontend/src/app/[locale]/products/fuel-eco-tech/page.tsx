import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/ui/faq";
import FetCalculator from "@/components/sections/FetCalculator";
import FetPricing from "@/components/sections/FetPricing";
import { Section, Container, Label, Text, TextLink } from "@/components/system";
import {
  SectionHead, Steps, FactGrid, CredentialGroups, ContactBand,
} from "@/components/system/blocks";
import { Film } from "@/components/system/Film";
import { CinematicHero, FactStrip, ImageBand, Mosaic } from "@/components/system/imagery";
import { CountUp } from "@/components/system/CountUp";
import APPLICATIONS from "@/data/fet-applications.json";
import { engineSpanLabel } from "@/lib/fet-pricing";

/* ─── Fuel Eco Tech — Quiet Authority ─────────────────────────────────────────
   Rebuilt October 2026 around the FET buying journey, in the order a fleet
   owner needs it: what it is → the measured result and its limits → how it
   works → what it leaves alone → which device fits → price → their own
   estimate → how we sell (assessment, measured trial, decision) → what stands
   behind it → questions → contact.

   Copy changed on the way in, where the old page said more than we can show:
     • "trusted by fleet operators across East Africa" — removed;
     • "your vehicle warranty is not affected" — replaced with written,
       vehicle-specific guidance before fitting (external review, item 5);
     • certificates no longer described as if Vitorra holds them.          */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.fet" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE = "/enquire?sector=FET";
const DEVICE_LABEL: Record<string, string> = { FI: "FET-PRO-FI", FII: "FET-PRO-FII", FIII: "FET-PRO-FIII", FIV: "FET-PRO-FIV" };

export default async function FuelEcoTechPage() {
  const t = await getTranslations("fetQA");
  const old = await getTranslations("fetPage");
  const home = await getTranslations("homeQA");
  const shared = await getTranslations("productQA");
  const tp = await getTranslations("products");
  const pricing = await getTranslations("fetPricing");
  const alt = await getTranslations("imageAlt");

  const evidenceRows: [string, string][] = [
    [home("evidenceRowBefore"), `11.52 ${home("evidenceUnit")}`],
    [home("evidenceRowAfter"), `9.92 ${home("evidenceUnit")}`],
    [home("evidenceRowNoise"), "± 3–5%"],
  ];

  /* Group the manufacturer's application rows by device. */
  const byDevice = APPLICATIONS.rows.reduce<Record<string, typeof APPLICATIONS.rows>>((acc, r) => {
    (acc[r.device] ||= []).push(r);
    return acc;
  }, {});

  const faqs = [
    { q: old("faq1Q"), a: old("faq1A") },
    { q: old("faq2Q"), a: old("faq2A") },
    { q: old("faq3Q"), a: t("faq3A") },
    { q: old("faq4Q"), a: old("faq4A") },
    { q: old("faq5Q"), a: old("faq5A") },
    { q: old("faq6Q"), a: old("faq6A") },
  ];

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">

        {/* ══ Intro ═════════════════════════════════════════════════════════ */}
        <CinematicHero
          image="/images/stock/road-mountains.jpg"
          alt={alt("roadMountains")}
          index="01"
          label={tp("fet.name")}
          lines={[t("title")]}
          lead={t("lead")}
          primary={{ label: t("primary"), href: ENQUIRE }}
          secondary={{ label: t("secondary"), href: "#fet-calculator" }}
        />
        <FactStrip
          facts={[
            { k: t("factFitK"), v: t("factFitV") },
            { k: t("factEngineK"), v: t("factEngineV") },
            { k: t("factSizesK"), v: t("factSizesV") },
            { k: t("factWarrantyK"), v: t("factWarrantyV") },
          ]}
        />

        {/* ══ Evidence ══════════════════════════════════════════════════════ */}
        <Section tone="ink" aria-labelledby="fet-evidence">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <Reveal className="lg:col-span-6">
              <Label onInk className="mb-10">{home("evidenceLabel")}</Label>
              <p id="fet-evidence" className="t-figure text-ink-fg">
                <CountUp value={13.9} /><span className="text-gold">%</span>
              </p>
              <Text size="lead" onInk className="mt-6 max-w-[30rem]">{home("evidenceFigureCaption")}</Text>

              <p className="t-label text-ink-fg-muted mt-12 mb-4">{t("observedLabel")}</p>
              <ul className="space-y-3">
                {[old("finding1"), old("finding2"), old("finding3")].map((f) => (
                  <li key={f} className="flex items-baseline gap-3 t-small text-ink-fg">
                    <span aria-hidden="true" className="h-px w-4 shrink-0 bg-gold translate-y-[-0.3em]" />
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal className="lg:col-span-6 lg:pt-16">
              <dl className="border-t border-ink-line">
                {evidenceRows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-6 border-b border-ink-line py-5">
                    <dt className="t-small text-ink-fg-muted">{k}</dt>
                    <dd className="font-display text-[1.75rem] leading-none text-ink-fg whitespace-nowrap [font-variant-numeric:lining-nums_tabular-nums]">{v}</dd>
                  </div>
                ))}
              </dl>
              <Text size="small" muted onInk className="mt-6">{home("evidenceSource")}</Text>
              <Text size="small" onInk className="mt-4 max-w-[32rem]">{home("evidenceHonest")}</Text>
            </Reveal>
          </Container>
        </Section>

        {/* ══ How it works ══════════════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="fet-how">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="fet-how" label={t("howLabel")} title={t("howTitle")} body={old("scienceBody")} />
              <Film
                className="mt-12"
                src="/videos/fet-hero.mp4"
                poster="/videos/fet-hero-poster.jpg"
                title={t("filmTitle")}
                caption={t("filmCaption")}
                playLabel={shared("playFilm")}
              />
            </div>
            <div className="lg:col-span-7 lg:pt-2">
              <Steps
                items={[
                  { title: old("step1Title"), body: old("step1Body") },
                  { title: old("step2Title"), body: old("step2Body") },
                  { title: old("step3Title"), body: old("step3Body") },
                ]}
              />
            </div>
          </Container>
        </Section>

        <ImageBand image="/images/stock/engine-hands.jpg" alt={alt("engineHands")} height="medium" />

        {/* ══ What it doesn't touch — with Vitorra's own fitting photographs ═ */}
        <Section tone="deep" aria-labelledby="fet-notouch">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end mb-16">
              <SectionHead id="fet-notouch" label={t("noTouchLabel")} title={t("noTouchTitle")} className="lg:col-span-5" />
              <div className="lg:col-span-6 lg:col-start-7">
                <Mosaic
                  a={{ src: "/products/fet/field-installed.jpg", alt: t("howCaption"), caption: t("howCaption") }}
                  b={{ src: "/products/fet/field-in-hand.jpg", alt: t("fieldDeviceAlt") }}
                />
              </div>
            </div>
            <FactGrid
              surface="deep"
              columns={4}
              items={[
                { title: old("noMod1Title"), body: old("noMod1Body") },
                { title: old("noMod2Title"), body: old("noMod2Body") },
                { title: old("noMod3Title"), body: old("noMod3Body") },
                { title: t("noTouch4Title"), body: t("noTouch4Body") },
              ]}
            />
          </Container>
        </Section>

        {/* ══ Which device fits — straight from the manufacturer's tables ══ */}
        <Section tone="paper" aria-labelledby="fet-fit">
          <Container>
            <SectionHead id="fet-fit" label={t("fitLabel")} title={t("fitTitle")} body={t("fitBody")} className="mb-14" />
            {/* Summary first — one row per device — with the manufacturer's
                full 26-row table one click away. Native <details>, no JS. */}
            <ul className="border-t border-line-strong">
              {Object.entries(byDevice).map(([device, rows]) => (
                <li key={device} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-8 py-6 border-b border-line">
                  <p className="md:col-span-3 t-label text-gold-ink pt-1.5">{DEVICE_LABEL[device]}</p>
                  <p className="md:col-span-2 font-display text-[1.5rem] leading-none text-ink [font-variant-numeric:lining-nums_tabular-nums]">
                    {engineSpanLabel(device)}
                  </p>
                  <p className="md:col-span-7 t-small text-ink-soft">
                    {[...new Set(rows.map((r) => r.class))].join(" · ")}
                  </p>
                </li>
              ))}
            </ul>

            <details className="group mt-8">
              <summary className="q-link t-small text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">{t("fitShowAll", { count: APPLICATIONS.rows.length })}</span>
                <span className="hidden group-open:inline">{t("fitHideAll")}</span>
              </summary>
              <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 mt-8">
              <table className="w-full min-w-[40rem] border-collapse text-left">
                <caption className="sr-only">{t("fitTitle")}</caption>
                <thead>
                  <tr className="border-b border-line-strong">
                    {[t("fitColClass"), t("fitColEngine"), t("fitColTypical"), t("fitColDevice")].map((h) => (
                      <th key={h} scope="col" className="t-label text-ink-muted font-medium py-4 pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                {Object.entries(byDevice).map(([device, rows]) => (
                  <tbody key={device} className="border-b border-line-strong">
                    {rows.map((r, i) => (
                      <tr key={`${r.class}-${r.displacement}`} className="border-b border-line last:border-b-0">
                        <td className="t-small text-ink py-3.5 pr-6">
                          {r.class}
                          <span className="block text-ink-muted">{r.role}</span>
                        </td>
                        <td className="t-small text-ink py-3.5 pr-6 font-numeric whitespace-nowrap">{r.displacement}</td>
                        <td className="t-small text-ink-soft py-3.5 pr-6">{r.typical}</td>
                        {i === 0 && (
                          <td rowSpan={rows.length} className="align-top py-3.5 border-l border-line pl-6">
                            <span className="t-label text-gold-ink whitespace-nowrap">{DEVICE_LABEL[device]}</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
              </div>
            </details>
            <div className="mt-8">
              <TextLink href="/downloads/vitorra-fet-application-guide.pdf" external>
                {pricing("downloadGuide")}
              </TextLink>
            </div>
          </Container>
        </Section>

        {/* ══ Price, then the customer's own estimate ═══════════════════════ */}
        <FetPricing />
        <FetCalculator />

        {/* ══ How we sell ═══════════════════════════════════════════════════ */}
        <Section tone="ink" aria-labelledby="fet-sell">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <SectionHead id="fet-sell" onInk label={t("sellLabel")} title={t("sellTitle")} className="lg:col-span-4" />
            <div className="lg:col-span-8">
              <Steps
                onInk
                items={[
                  { title: t("sell1Title"), body: t("sell1Body") },
                  { title: t("sell2Title"), body: t("sell2Body") },
                  { title: t("sell3Title"), body: t("sell3Body") },
                ]}
              />
            </div>
          </Container>
        </Section>

        {/* ══ Credentials, separated by what they cover ═════════════════════ */}
        <Section tone="paper" aria-labelledby="fet-cred">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHead id="fet-cred" label={home("credLabel")} title={home("credTitle")} body={home("credBody")} />
              <div className="mt-8">
                <TextLink href="/trust/certifications">{home("credCta")}</TextLink>
              </div>
            </div>
            <div className="lg:col-span-8">
              <CredentialGroups
                groups={[
                  {
                    title: home("credGroupProduct"),
                    items: [
                      { name: "CTI GmbH", what: home("credCti") },
                      { name: "AVL Technologies", what: home("credAvl") },
                      { name: "qm-solutions GmbH", what: home("credQm") },
                    ],
                  },
                  {
                    title: home("credGroupCompany"),
                    items: [
                      { name: "ISO 9001:2015", what: home("credIso9001") },
                      { name: "ISO 14001:2015", what: home("credIso14001") },
                      { name: "ISO 27001", what: home("credIso27001") },
                      { name: "Zurich Insurance", what: home("credZurich") },
                    ],
                  },
                ]}
              />
              <Text size="small" muted className="mt-8">{home("credNote")}</Text>
            </div>
          </Container>
        </Section>

        {/* ══ Questions ═════════════════════════════════════════════════════ */}
        <Section tone="paper" rule aria-labelledby="fet-faq">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <SectionHead id="fet-faq" label={t("faqLabel")} title={t("faqTitle")} className="lg:col-span-4" />
            <div className="lg:col-span-8">
              <Faq items={faqs} />
            </div>
          </Container>
        </Section>

        <ContactBand
          title={t("contactTitle")}
          body={t("contactBody")}
          briefLabel={t("contactBrief")}
          briefHref={ENQUIRE}
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
