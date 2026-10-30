import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import ApproxPrice from "@/components/ui/ApproxPrice";
import { VehicleIcon } from "@/components/ui/VehicleIcon";
import ReserveButton from "@/components/sections/ReserveButton";
import { FetStockBadge } from "@/components/sections/FetStockBadge";
import { Section, Container, Label, Heading, Text, ButtonLink, TextLink } from "@/components/system";
import { SectionHead, ContactBand } from "@/components/system/blocks";
import { localeAlternates, breadcrumbs, ldJson } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import { FET_TIERS, TIER_CODE, formatUgx, engineSpanLabel } from "@/lib/fet-pricing";
import { getFetAvailability, schemaAvailability } from "@/lib/fet-availability";
import APPLICATIONS from "@/data/fet-applications.json";

/* ─── FET catalogue ───────────────────────────────────────────────────────────
   The full Fuel Eco Tech range on one page, laid out like a printed product
   catalogue: the range at a glance, a "which one fits" chooser, one spread per
   device (what it fits, the manufacturer's own application rows, the price
   installed, and whether it can be fitted from stock today), then a side-by-side
   comparison and what every device includes.

   Stock comes live from Finance's stock book (refreshed every 5 minutes) and
   only ever says in stock / only N left / available to order. Prices come from
   lib/fet-pricing.ts and engine spans from the application table, so this page
   can never disagree with the product page, the datasheet or a reservation.
   The device photograph is the same for every model: the four share one
   design, so no size difference is implied.                                  */

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.fetCatalogue" });
  return { title: t("title"), description: t("description"), alternates: localeAlternates(locale, "/products/fuel-eco-tech/catalogue") };
}

const ENQUIRE = "/enquire?sector=FET";

export default async function FetCataloguePage() {
  const t = await getTranslations("fetCatalogue");
  const tt = await getTranslations("fetTiers");
  const tr = await getTranslations("fetPricing");
  const tp = await getTranslations("products");
  const home = await getTranslations("homeQA");
  const stock = await getFetAvailability();

  const byDevice = APPLICATIONS.rows.reduce<Record<string, typeof APPLICATIONS.rows>>((acc, r) => {
    (acc[r.device] ||= []).push(r);
    return acc;
  }, {});
  const inStock = stock ? FET_TIERS.filter((tier) => stock.models[TIER_CODE[tier.id]]?.status !== "order").length : null;
  const included = [tr("included1"), tr("included2"), tr("included3")];

  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Fuel Eco Tech catalogue",
    url: `${SITE_URL}/products/fuel-eco-tech/catalogue`,
    itemListElement: FET_TIERS.map((tier, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: tier.model,
        brand: { "@type": "Brand", name: "Fuel Eco Tech" },
        image: `${SITE_URL}/products/fet/packshot.png`,
        description: `${tier.fits}. ${engineSpanLabel(TIER_CODE[tier.id])}. Installation included.`,
        url: `${SITE_URL}/products/fuel-eco-tech/catalogue#fet-${TIER_CODE[tier.id].toLowerCase()}`,
        offers: {
          "@type": "Offer",
          price: tier.priceUgx,
          priceCurrency: "UGX",
          areaServed: "UG",
          ...(schemaAvailability(stock?.models[TIER_CODE[tier.id]]) ? { availability: schemaAvailability(stock?.models[TIER_CODE[tier.id]]) } : {}),
        },
      },
    })),
  };

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([
          schema,
          breadcrumbs([
            { name: "Vitorra", path: "/" },
            { name: tp("fet.name"), path: "/products/fuel-eco-tech" },
            { name: t("crumb"), path: "/products/fuel-eco-tech/catalogue" },
          ]),
        ])} />

        {/* ══ The range at a glance ═════════════════════════════════════════ */}
        <section aria-labelledby="cat-title" className="q-scope relative isolate overflow-hidden bg-ink text-ink-fg pt-28 sm:pt-36 pb-16 sm:pb-24">
          <div aria-hidden="true" className="absolute -z-10 right-[-20%] top-[-10%] h-[90%] w-[80%] rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(closest-side, rgba(197,178,122,0.55), rgba(197,178,122,0))" }} />
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <Label onInk index="FET">{t("eyebrow")}</Label>
              <Heading as="h1" size="display" id="cat-title" className="mt-8 text-ink-fg">
                {t("titleLead")} <span className="text-gold italic">{t("titleAccent")}</span>
              </Heading>
              <Text size="lead" onInk muted className="mt-6 max-w-[34rem]">{t("lead")}</Text>
              {inStock !== null && (
                <p className="mt-6 inline-flex items-center gap-2 t-small text-ink-fg">
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#2F8F5B]" />
                  {t("heroStock", { count: inStock, total: FET_TIERS.length })}
                </p>
              )}
              <div className="mt-10 flex flex-wrap gap-3">
                <ButtonLink href="#fet-finder" onInk>{t("ctaFind")}</ButtonLink>
                <ButtonLink href={ENQUIRE} onInk variant="secondary">{t("ctaAssess")}</ButtonLink>
              </div>
            </div>
            <div className="lg:col-span-5 flex items-end justify-center gap-8 sm:gap-12">
              <div className="relative shrink-0 h-[20rem] sm:h-[28rem] w-[8.5rem] sm:w-[12rem]">
                <Image src="/products/fet/packshot.png" alt={tr("deviceAlt")} fill priority sizes="(min-width: 1024px) 14rem, 40vw" className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.55)]" />
              </div>
              <dl className="grid gap-1 border-l border-gold pl-4 mb-6">
                <dt className="t-label text-ink-fg-muted">{t("proofK")}</dt>
                <dd className="font-display text-[2.25rem] leading-none text-ink-fg [font-variant-numeric:lining-nums]">13.9%</dd>
                <dd className="t-small text-ink-fg-muted max-w-[10rem]">{t("proofV")}</dd>
              </dl>
            </div>
          </Container>
        </section>

        {/* ══ Which one fits ════════════════════════════════════════════════ */}
        <Section tone="deep" tight id="fet-finder" aria-labelledby="fet-finder-title">
          <Container>
            <SectionHead id="fet-finder-title" label={t("finderLabel")} title={t("finderTitle")} className="mb-8 sm:mb-10" />
            <ul className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
              {FET_TIERS.map((tier) => {
                const code = TIER_CODE[tier.id];
                return (
                  <li key={tier.id}>
                    <a href={`#fet-${code.toLowerCase()}`} className="group flex h-full flex-col bg-paper p-5 sm:p-6 transition-colors duration-500 hover:bg-paper-deep">
                      <VehicleIcon kind={tier.id} className="h-10 sm:h-12 w-auto self-start text-ink transition-colors duration-500 group-hover:text-gold-ink" />
                      <span className="t-h3 text-ink mt-5">{tt(`${tier.id}.label`)}</span>
                      <span className="t-small text-ink-muted mt-1 font-numeric">{engineSpanLabel(code)}</span>
                      <span className="t-label text-gold-ink mt-4">{tier.model}</span>
                      <FetStockBadge stock={stock?.models[code]} className="mt-3" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Container>
        </Section>

        {/* ══ One spread per device ═════════════════════════════════════════ */}
        {FET_TIERS.map((tier, i) => {
          const code = TIER_CODE[tier.id];
          const rows = byDevice[code] ?? [];
          const flip = i % 2 === 1;
          return (
            <Section key={tier.id} tone={flip ? "deep" : "paper"} id={`fet-${code.toLowerCase()}`} aria-labelledby={`fet-${code}-title`}>
              <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                {/* The device, on a lit plinth with the model code behind it */}
                <Reveal className={flip ? "lg:col-span-5 lg:col-start-8 lg:order-2" : "lg:col-span-5"}>
                  <div className="relative overflow-hidden rounded-frame bg-ink aspect-[4/5] flex items-center justify-center">
                    <span aria-hidden="true" className="absolute left-5 top-3 font-display text-[6rem] sm:text-[8rem] leading-none text-white/[0.07] select-none">{code}</span>
                    <div aria-hidden="true" className="absolute inset-x-[10%] bottom-[8%] h-[30%] rounded-[50%] blur-2xl" style={{ background: "radial-gradient(closest-side, rgba(197,178,122,0.45), rgba(197,178,122,0))" }} />
                    <div className="relative h-[72%] w-[38%]">
                      <Image src="/products/fet/packshot.png" alt={`${tier.model}, ${tr("deviceAlt")}`} fill sizes="(min-width: 1024px) 16rem, 45vw" className="object-contain drop-shadow-[0_24px_30px_rgba(0,0,0,0.6)]" />
                    </div>
                    <div className="absolute left-5 bottom-5 right-5 flex items-end justify-between gap-4">
                      <VehicleIcon kind={tier.id} className="h-8 w-auto text-ink-fg/80" />
                      <span className="t-label text-gold">{tier.model}</span>
                    </div>
                  </div>
                </Reveal>

                <div className={flip ? "lg:col-span-7 lg:order-1" : "lg:col-span-7"}>
                  <Label index={String(i + 1).padStart(2, "0")}>{tier.model}</Label>
                  <Heading id={`fet-${code}-title`} size="h2" className="mt-6 text-ink">{tt(`${tier.id}.label`)}</Heading>
                  <Text size="lead" className="mt-4 max-w-[34rem]">{tt(`${tier.id}.fits`)}</Text>
                  <FetStockBadge stock={stock?.models[code]} className="mt-5" />

                  <dl className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-px bg-line border-y border-line">
                    {[
                      [t("specEngine"), engineSpanLabel(code)],
                      [t("specExamples"), tt(`${tier.id}.examples`)],
                      [t("specInstall"), t("specInstallV")],
                    ].map(([k, v], n) => (
                      <div key={k} className={`${flip ? "bg-paper-deep" : "bg-paper"} py-4 pr-4 ${n === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                        <dt className="t-label text-ink-muted">{k}</dt>
                        <dd className="t-small text-ink mt-1.5">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  {rows.length > 0 && (
                    <div className="mt-8">
                      <p className="t-label text-ink-muted mb-3">{t("appsLabel")}</p>
                      <ul className="divide-y divide-line border-t border-line">
                        {rows.map((r) => (
                          <li key={`${r.class}-${r.displacement}`} className="grid grid-cols-12 gap-3 py-2.5 t-small">
                            <span className="col-span-5 text-ink">{r.class}</span>
                            <span className="col-span-3 text-ink font-numeric whitespace-nowrap">{r.displacement} L</span>
                            <span className="col-span-4 text-ink-muted">{r.typical}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-8 items-end border-t border-line-strong pt-8">
                    <div>
                      <p className="t-label text-ink-muted">{t("priceLabel")}</p>
                      <p className="font-display text-[2.15rem] sm:text-[2.6rem] leading-none text-ink mt-3 whitespace-nowrap [font-variant-numeric:lining-nums_tabular-nums]">{formatUgx(tier.priceUgx)}</p>
                      <p className="t-small text-ink-muted mt-2">{tr("perDevice")}</p>
                      <ApproxPrice ugx={tier.priceUgx} className="block t-small text-ink-muted mt-1" />
                    </div>
                    <div>
                      <ReserveButton tier={tier} />
                      <div className="mt-3 text-center">
                        <TextLink href={`/enquire?sector=FET&vehicle=${tier.id}`}>{tr("requestQuote")}</TextLink>
                      </div>
                    </div>
                  </div>
                </div>
              </Container>
            </Section>
          );
        })}

        {/* ══ Side by side ══════════════════════════════════════════════════ */}
        <Section tone="paper" rule aria-labelledby="fet-compare">
          <Container>
            <SectionHead id="fet-compare" label={t("compareLabel")} title={t("compareTitle")} className="mb-10" />
            <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0">
              <table className="w-full min-w-[46rem] border-collapse text-left">
                <caption className="sr-only">{t("compareTitle")}</caption>
                <thead>
                  <tr className="border-b border-line-strong">
                    <th scope="col" className="py-4 pr-6 w-[18%]"><span className="sr-only">{t("compareLabel")}</span></th>
                    {FET_TIERS.map((tier) => (
                      <th key={tier.id} scope="col" className="py-4 pr-6 align-bottom">
                        <VehicleIcon kind={tier.id} className="h-8 w-auto text-ink" />
                        <span className="block t-label text-gold-ink mt-3">{tier.model}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="t-small">
                  {[
                    { k: t("rowFor"), v: (id: typeof FET_TIERS[number]["id"]) => tt(`${id}.label`) },
                    { k: t("specEngine"), v: (id: typeof FET_TIERS[number]["id"]) => engineSpanLabel(TIER_CODE[id]), num: true },
                    { k: t("specExamples"), v: (id: typeof FET_TIERS[number]["id"]) => tt(`${id}.examples`) },
                  ].map((row) => (
                    <tr key={row.k} className="border-b border-line">
                      <th scope="row" className="t-label text-ink-muted font-medium py-4 pr-6 align-top">{row.k}</th>
                      {FET_TIERS.map((tier) => <td key={tier.id} className={`py-4 pr-6 align-top text-ink ${row.num ? "font-numeric" : ""}`}>{row.v(tier.id)}</td>)}
                    </tr>
                  ))}
                  <tr className="border-b border-line">
                    <th scope="row" className="t-label text-ink-muted font-medium py-4 pr-6 align-top">{t("rowPrice")}</th>
                    {FET_TIERS.map((tier) => <td key={tier.id} className="py-4 pr-6 align-top font-display text-[1.35rem] leading-none text-ink [font-variant-numeric:lining-nums_tabular-nums]">{formatUgx(tier.priceUgx)}</td>)}
                  </tr>
                  {stock && (
                    <tr className="border-b border-line">
                      <th scope="row" className="t-label text-ink-muted font-medium py-4 pr-6 align-top">{t("rowStock")}</th>
                      {FET_TIERS.map((tier) => <td key={tier.id} className="py-4 pr-6 align-top"><FetStockBadge stock={stock.models[TIER_CODE[tier.id]]} /></td>)}
                    </tr>
                  )}
                  <tr>
                    <td />
                    {FET_TIERS.map((tier) => (
                      <td key={tier.id} className="py-5 pr-6">
                        <TextLink href={`#fet-${TIER_CODE[tier.id].toLowerCase()}`}>{t("rowOpen")}</TextLink>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Container>
        </Section>

        {/* ══ What every device includes ════════════════════════════════════ */}
        <Section tone="ink" aria-labelledby="fet-included">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="fet-included" onInk label={t("includedLabel")} title={t("includedTitle")} body={t("includedBody")} />
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <ul className="border-t border-ink-line">
                {included.map((item, n) => (
                  <li key={item} className="flex items-baseline gap-5 py-5 border-b border-ink-line">
                    <span className="font-numeric t-small text-gold">{String(n + 1).padStart(2, "0")}</span>
                    <span className="t-lead text-ink-fg">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col items-start gap-4">
                {[
                  { href: "/downloads/vitorra-fet-application-guide.pdf", label: tr("downloadGuide") },
                  { href: "/downloads/vitorra-fet-datasheet.pdf", label: tr("downloadDatasheet") },
                ].map((d) => (
                  <a key={d.href} href={d.href} target="_blank" rel="noopener noreferrer" className="q-link t-small text-ink-fg">
                    <Download aria-hidden="true" className="h-3.5 w-3.5" />
                    {d.label}
                  </a>
                ))}
                <TextLink href="/products/fuel-eco-tech" onInk>{t("backToFet")}</TextLink>
              </div>
              <Text size="small" onInk muted className="mt-8 max-w-[34rem]">{tr("footnote")}</Text>
              {stock && <Text size="small" onInk muted className="mt-3 max-w-[34rem]">{t("stockNote")}</Text>}
            </div>
          </Container>
        </Section>

        <ContactBand
          title={t("contactTitle")}
          body={t("contactBody")}
          briefLabel={t("ctaAssess")}
          briefHref={ENQUIRE}
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
