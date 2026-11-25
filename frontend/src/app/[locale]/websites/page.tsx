import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Minus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Faq } from "@/components/ui/faq";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Section, Container, Label, Heading, Text, ButtonLink } from "@/components/system";
import { SectionHead, Steps, ContactBand } from "@/components/system/blocks";
import { SampleShowcase } from "@/components/websites/SampleShowcase";
import { WebsitePreviewForm } from "@/components/websites/WebsitePreviewForm";
import { localeAlternates, faqPage, breadcrumbs, ldJson } from "@/lib/seo";
import { screenAdsOpen } from "@/lib/screen-ads-gate";
import { CONTACT_PHONE, SITE_URL } from "@/lib/constants";

/* ─── /websites — Vitorra Digital starter websites ────────────────────────────
   The landing page for the ads. One offer: UGX 500,000 buys a one-page
   website, its web address and hosting for the first year, built in five
   working days, cared for for a year. Renewal UGX 300,000 a year from year two.

   The page is built around the three things that stop a small business owner
   buying a website, in the order they ask them:
     1. "What would mine look like?"   → four full sample sites (a firm, a
        lodge, a restaurant, a studio), each with its own look.
     2. "Will these people vanish?"    → see it before you pay, half up front,
        an office on Lumumba Avenue, a year of care in writing.
     3. "What will it really cost?"    → one price, what's in, what's not.

   Prices here must match the pricing in PROGRESS.md ("Vitorra Digital").
   The street-screen launch slot only shows while screen adverts are on sale
   (SCREEN_ADS_ENABLED), so the page never offers something we cannot sell. */

const PATH = "/websites";
const WA = CONTACT_PHONE.replace(/[^0-9]/g, "");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.websites" });
  return {
    title: t("title"),
    description: t("description"),
    alternates: localeAlternates(locale, PATH),
    openGraph: { title: t("title"), description: t("description") },
  };
}

export default async function WebsitesPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("websites");
  const home = await getTranslations("homeQA");
  const screenSlot = screenAdsOpen();

  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(t("hero.waText"))}`;

  const promises = ["see", "fast", "care", "office"].map((k) => ({ title: t(`promise.${k}.title`), body: t(`promise.${k}.body`) }));
  const steps = ["1", "2", "3", "4"].map((k) => ({ title: t(`steps.${k}.title`), body: t(`steps.${k}.body`) }));
  const included = ["page", "items", "order", "address", "hosting", "secure", "stats", "care", "updates"].map((k) => t(`price.in.${k}`));
  const extra = ["pages", "pay", "email", "ug", "ads"].map((k) => t(`price.out.${k}`));
  const checks = ["company", "office", "own", "writing", "preview", "price"] as const;
  const types = ["shop", "salon", "restaurant", "hardware", "hotel", "school", "clinic", "services", "farm"] as const;
  const faqs = ["computer", "own", "dislike", "after", "time", "change", "pay", "ads", "bigger"].map((k) => ({ q: t(`faq.${k}.q`), a: t(`faq.${k}.a`) }));

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t("schemaName"),
    serviceType: "Website design",
    provider: { "@type": "Organization", name: "Vitorra Holdings Limited", url: SITE_URL },
    areaServed: { "@type": "Country", name: "Uganda" },
    offers: { "@type": "Offer", price: 500000, priceCurrency: "UGX", url: `${SITE_URL}${PATH}` },
  };

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([
          service,
          faqPage(faqs),
          breadcrumbs([{ name: "Vitorra", path: "/" }, { name: t("crumb"), path: PATH }]),
        ])} />

        {/* 1 — The offer, and the phone that proves it */}
        <Section tone="ink" className="pt-32 sm:pt-36 lg:pt-36">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-12 items-start">
            <div className="lg:col-span-5">
              <Label onInk>{t("hero.label")}</Label>
              <Heading as="h1" size="h1" className="mt-6 text-ink-fg">
                {t("hero.title1")}<br /><span className="text-gold">{t("hero.title2")}</span>
              </Heading>
              <Text size="lead" onInk muted className="mt-6 max-w-[34rem]">{t("hero.lead")}</Text>

              <div className="mt-7 flex items-baseline gap-4 flex-wrap">
                <p className="font-numeric text-ink-fg text-[clamp(2.4rem,5vw,3.6rem)] leading-none tracking-[-0.02em]">UGX 500,000</p>
                <p className="t-small text-ink-fg-muted max-w-[15rem]">{t("hero.priceNote")}</p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="q-btn bg-ink-fg text-ink hover:bg-white">
                  <WhatsAppIcon className="h-4 w-4" />{t("hero.primary")}
                </a>
                <ButtonLink href="#preview" variant="secondary" onInk>{t("hero.secondary")}</ButtonLink>
              </div>
              <p className="mt-5 t-small text-ink-fg-muted">{t("hero.assure")}</p>
            </div>
            <div className="lg:col-span-7">
              <SampleShowcase />
            </div>
          </Container>
        </Section>

        {/* 2 — Why owners can say yes without thinking twice */}
        <Section tone="cream" tight aria-labelledby="promise-title">
          <Container>
            <h2 id="promise-title" className="sr-only">{t("promise.title")}</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border-y border-line">
              {promises.map((p, i) => (
                <li key={p.title} className="bg-cream py-7 sm:p-7">
                  <p className="t-label font-numeric text-gold-ink">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="t-h3 text-ink mt-3">{p.title}</h3>
                  <p className="t-small text-ink-soft mt-2">{p.body}</p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>

        {/* 3 — How it works */}
        <Section aria-labelledby="steps-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <SectionHead id="steps-title" className="lg:col-span-4" label={t("steps.label")} title={t("steps.title")} body={t("steps.body")} />
            <Steps className="lg:col-span-8" items={steps} />
          </Container>
        </Section>

        {/* 4 — One price, in writing */}
        <Section tone="deep" aria-labelledby="price-title">
          <Container>
            <SectionHead id="price-title" label={t("price.label")} title={t("price.title")} body={t("price.body")} />
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-ink text-ink-fg p-8 sm:p-10 rounded-[var(--radius-frame)]">
                <p className="t-label text-ink-fg-muted">{t("price.cardLabel")}</p>
                <p className="mt-4 font-numeric text-[clamp(2.6rem,6vw,4rem)] leading-none tracking-[-0.02em]">UGX 500,000</p>
                <p className="mt-3 t-small text-ink-fg-muted">{t("price.cardNote")}</p>
                <dl className="mt-8 border-t border-ink-line">
                  {(["deposit", "balance", "renewal"] as const).map((k) => (
                    <div key={k} className="flex items-baseline justify-between gap-4 py-4 border-b border-ink-line">
                      <dt className="t-small text-ink-fg-muted">{t(`price.split.${k}.label`)}</dt>
                      <dd className="font-numeric text-ink-fg text-right whitespace-nowrap">{t(`price.split.${k}.value`)}</dd>
                    </div>
                  ))}
                </dl>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="q-btn bg-ink-fg text-ink hover:bg-white mt-8 w-full justify-center">
                  <WhatsAppIcon className="h-4 w-4" />{t("price.cta")}
                </a>
              </div>
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="t-label text-ink pb-4 border-b border-line-strong">{t("price.inTitle")}</h3>
                  <ul>
                    {included.map((x) => (
                      <li key={x} className="flex gap-3 py-3 border-b border-line t-small text-ink">
                        <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-ok-ink translate-y-[0.15em]" />{x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="t-label text-ink pb-4 border-b border-line-strong">{t("price.outTitle")}</h3>
                  <ul>
                    {extra.map((x) => (
                      <li key={x} className="flex gap-3 py-3 border-b border-line t-small text-ink-soft">
                        <Minus aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted translate-y-[0.15em]" />{x}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 t-small text-ink-muted">{t("price.outNote")}</p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* 5 — After launch: getting customers to the site */}
        <Section aria-labelledby="addons-title">
          <Container>
            <SectionHead id="addons-title" label={t("addons.label")} title={t("addons.title")} body={t("addons.body")} />
            <ul className={`mt-12 grid grid-cols-1 gap-px bg-line border-y border-line ${screenSlot ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
              <li className="bg-paper py-8 md:p-8">
                <p className="t-label text-gold-ink">{t("addons.ads.tag")}</p>
                <h3 className="t-h3 text-ink mt-3">{t("addons.ads.title")}</h3>
                <p className="font-numeric text-ink text-[1.6rem] mt-4">UGX 70,000</p>
                <p className="t-small text-ink-soft mt-3">{t("addons.ads.body")}</p>
              </li>
              {screenSlot && (
                <li className="bg-paper py-8 md:p-8">
                  <p className="t-label text-gold-ink">{t("addons.screen.tag")}</p>
                  <h3 className="t-h3 text-ink mt-3">{t("addons.screen.title")}</h3>
                  <p className="mt-4"><span className="font-numeric text-ink text-[1.6rem]">UGX 100,000</span> <s className="t-small text-ink-muted">UGX 150,000</s></p>
                  <p className="t-small text-ink-soft mt-3">{t("addons.screen.body")}</p>
                </li>
              )}
              <li className="bg-paper py-8 md:p-8">
                <p className="t-label text-gold-ink">{t("addons.grow.tag")}</p>
                <h3 className="t-h3 text-ink mt-3">{t("addons.grow.title")}</h3>
                <p className="font-numeric text-ink text-[1.6rem] mt-4">{t("addons.grow.price")}</p>
                <p className="t-small text-ink-soft mt-3">{t("addons.grow.body")}</p>
              </li>
            </ul>
          </Container>
        </Section>

        {/* 6 — The questions to ask any web designer */}
        <Section tone="ink" aria-labelledby="ask-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <SectionHead onInk id="ask-title" className="lg:col-span-5" label={t("ask.label")} title={t("ask.title")} body={t("ask.body")} />
            <dl className="lg:col-span-7 border-t border-ink-line">
              {checks.map((k) => (
                <div key={k} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-2 sm:gap-4 py-5 border-b border-ink-line">
                  <dt className="t-body text-ink-fg">{t(`ask.${k}.q`)}</dt>
                  <dd className="flex items-start gap-2.5 t-small text-ink-fg-muted">
                    <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-gold translate-y-[0.15em]" />
                    <span>{t(`ask.${k}.a`)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Container>
        </Section>

        {/* 7 — Who it's for */}
        <Section aria-labelledby="for-title">
          <Container>
            <SectionHead id="for-title" label={t("for.label")} title={t("for.title")} body={t("for.body")} />
            <ul className="mt-10 flex flex-wrap gap-2.5">
              {types.map((k) => (
                <li key={k} className="rounded-full border border-line-strong px-4 py-2 t-small text-ink">{t(`form.types.${k}`)}</li>
              ))}
            </ul>
          </Container>
        </Section>

        {/* 8 — Questions */}
        <Section tone="deep" aria-labelledby="faq-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <SectionHead id="faq-title" className="lg:col-span-4" label={t("faqLabel")} title={t("faqTitle")} />
            <div className="lg:col-span-8"><Faq items={faqs} /></div>
          </Container>
        </Section>

        {/* 9 — The free preview */}
        <Section tone="cream" id="preview" aria-labelledby="preview-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="preview-title" label={t("previewBlock.label")} title={t("previewBlock.title")} body={t("previewBlock.body")} />
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="q-btn border border-line-strong text-ink hover:border-ink mt-8">
                <WhatsAppIcon className="h-4 w-4" />{t("previewBlock.wa")}
              </a>
            </div>
            <div className="lg:col-span-7">
              <WebsitePreviewForm />
            </div>
          </Container>
        </Section>

        <ContactBand
          title={t("close.title")}
          body={t("close.body")}
          briefLabel={t("close.brief")}
          briefHref="#preview"
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
