import type { Metadata } from "next";
import Image from "next/image";
import { Plus_Jakarta_Sans } from "next/font/google";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Check, Plus } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Faq } from "@/components/ui/faq";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Section, Container, Label, Heading, Text, ButtonLink } from "@/components/system";
import { SectionHead, ContactBand } from "@/components/system/blocks";
import { SampleShowcase } from "@/components/websites/SampleShowcase";
import { WebsitePreviewForm } from "@/components/websites/WebsitePreviewForm";
import { localeAlternates, faqPage, breadcrumbs, ldJson } from "@/lib/seo";
import { screenAdsOpen } from "@/lib/screen-ads-gate";
import { CONTACT_PHONE, SITE_URL } from "@/lib/constants";
import s from "./websites.module.css";

/* ─── /websites — Vitorra Digital starter websites ────────────────────────────
   The landing page for the ads, written for every Ugandan business owner,
   from a market stall in Owino to an office in Nakasero: short sentences,
   everyday words ("web name", not "domain"; "we keep it online", not
   "hosting"), and real photographs of Ugandan trade.

   The page answers, in order, what an owner asks:
     1. "Will customers find me?"            → hero + "they look you up first"
     2. "Is it for a business like mine?"   → photo tiles, then the samples
     3. "How does it work, and what does it cost?" → steps, one price
     4. "Can I trust you?"                  → Kampala band, our real office

   Offer: UGX 500,000 first year (website, web name, kept online, a year of
   care); UGX 250,000 to book after the free preview, 250,000 at launch;
   renewal UGX 300,000 a year. Keep in step with PROGRESS.md.

   Photographs: public/websites/{ug,samples}; licences and credits in
   marketing/websites/photo-licences.md. CC BY-SA photos are credited below. */

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--web-sans", display: "swap" });

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

const TILES = [
  { key: "market", img: "/websites/ug/owino-stall.webp", pos: "50% 50%" },
  { key: "salon", img: "/websites/samples/studio-braids.webp", pos: "50% 30%" },
  { key: "food", img: "/websites/samples/kitchen-plating.webp", pos: "50% 50%" },
  { key: "stay", img: "/websites/samples/lodge-islands.webp", pos: "60% 60%" },
  { key: "office", img: "/websites/samples/advisory-desk.webp", pos: "40% 50%" },
  { key: "makers", img: "/websites/ug/crafts.webp", pos: "50% 25%" },
] as const;

export default async function WebsitesPage({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  const t = await getTranslations("websites");
  const home = await getTranslations("homeQA");
  const screenSlot = screenAdsOpen();

  const waHref = `https://wa.me/${WA}?text=${encodeURIComponent(t("hero.waText"))}`;
  const faqs = ["computer", "own", "dislike", "after", "time", "change", "pay", "bigger"].map((k) => ({ q: t(`faq.${k}.q`), a: t(`faq.${k}.a`) }));
  const included = ["page", "items", "buttons", "name", "online", "care", "updates"].map((k) => t(`price.in.${k}`));
  const extras = [...["pages", "pay", "email", "ug", "ads"].map((k) => t(`price.out.${k}`)), ...(screenSlot ? [t("price.out.screen")] : [])];

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
      <Header />
      <main id="main" className={`flex-1 bg-paper pt-16 lg:pt-[6.25rem] ${s.page} ${sans.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={ldJson([
          service,
          faqPage(faqs),
          breadcrumbs([{ name: "Vitorra", path: "/" }, { name: t("crumb"), path: PATH }]),
        ])} />

        {/* 1 — The offer, beside a real Ugandan shop */}
        <section className={`${s.hero} q-scope`} aria-labelledby="web-hero">
          <div className={s.heroText}>
            <Label onInk>{t("hero.label")}</Label>
            <h1 id="web-hero" className={`t-h1 text-ink-fg mt-6 ${s.heroTitle}`}>{t("hero.title")}</h1>
            <Text size="lead" onInk muted className="mt-6 max-w-[34rem]">{t("hero.lead")}</Text>
            <div className={s.price}>
              <span className={s.priceFig}>UGX 500,000</span>
              <span className="t-small text-ink-fg-muted max-w-[17rem]">{t("hero.priceNote")}</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="q-btn bg-ink-fg text-ink hover:bg-white">
                <WhatsAppIcon className="h-4 w-4" />{t("hero.primary")}
              </a>
              <ButtonLink href="#preview" variant="secondary" onInk>{t("hero.secondary")}</ButtonLink>
            </div>
            <ul className={s.ticks}>
              {(["see", "half", "office"] as const).map((k) => (
                <li key={k}><Check aria-hidden="true" className="h-4 w-4 text-gold" />{t(`hero.tick.${k}`)}</li>
              ))}
            </ul>
          </div>
          <div className={s.heroPhoto}>
            <Image src="/websites/ug/shopkeeper.webp" alt={t("alt.shop")} fill priority sizes="(min-width: 1024px) 48vw, 100vw" style={{ objectFit: "cover", objectPosition: "60% 45%" }} />
          </div>
        </section>

        {/* 2 — Customers look you up first */}
        <Section aria-labelledby="web-why">
          <Container className={s.split}>
            <div>
              <Label>{t("why.label")}</Label>
              <Heading id="web-why" size="h2" className="mt-6 text-ink">{t("why.title")}</Heading>
              <Text size="lead" className="mt-6 max-w-[34rem]">{t("why.body")}</Text>
              <ul className={s.points}>
                {(["what", "where", "reach"] as const).map((k) => (
                  <li key={k}><Check aria-hidden="true" className="h-5 w-5 text-ok-ink translate-y-[0.2em]" /><span>{t(`why.points.${k}`)}</span></li>
                ))}
              </ul>
            </div>
            <div className={s.splitPhoto}>
              <Image src="/websites/ug/customer-phone.webp" alt={t("alt.customer")} fill sizes="(min-width: 1024px) 45vw, 100vw" style={{ objectFit: "cover", objectPosition: "50% 40%" }} />
            </div>
          </Container>
        </Section>

        {/* 3 — Every kind of business */}
        <Section tone="cream" aria-labelledby="web-for">
          <Container>
            <SectionHead id="web-for" label={t("for.label")} title={t("for.title")} body={t("for.body")} />
            <ul className={s.tiles}>
              {TILES.map((x) => (
                <li key={x.key} className={s.tile}>
                  <Image src={x.img} alt={t(`for.tiles.${x.key}.alt`)} fill sizes="(min-width: 1024px) 31vw, 50vw" style={{ objectFit: "cover", objectPosition: x.pos }} />
                  <p className={s.tileLabel}><b>{t(`for.tiles.${x.key}.title`)}</b><span>{t(`for.tiles.${x.key}.body`)}</span></p>
                </li>
              ))}
            </ul>
          </Container>
        </Section>

        {/* 4 — What yours could look like */}
        <Section tone="ink" aria-labelledby="web-samples">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-4">
              <SectionHead onInk id="web-samples" label={t("samples.label")} title={t("samples.title")} body={t("samples.body")} />
            </div>
            <div className="lg:col-span-8"><SampleShowcase /></div>
          </Container>
        </Section>

        {/* 5 — Four steps, beside our real office */}
        <Section aria-labelledby="web-steps">
          <Container className={s.split}>
            <div>
              <Label>{t("steps.label")}</Label>
              <Heading id="web-steps" size="h2" className="mt-6 mb-8 text-ink">{t("steps.title")}</Heading>
              <ol className={s.steps}>
                {(["1", "2", "3", "4"] as const).map((k) => (
                  <li key={k}><span className={s.stepNo} aria-hidden="true">{k}</span><h3>{t(`steps.${k}.title`)}</h3><p>{t(`steps.${k}.body`)}</p></li>
                ))}
              </ol>
            </div>
            <div>
              <div className={s.splitPhoto}>
                <Image src="/photos/company-B-reception.jpg" alt={t("alt.office")} fill sizes="(min-width: 1024px) 45vw, 100vw" style={{ objectFit: "cover" }} />
              </div>
              <p className={s.caption}>{t("steps.caption")}</p>
            </div>
          </Container>
        </Section>

        {/* 6 — One price */}
        <Section tone="deep" aria-labelledby="web-price">
          <Container>
            <SectionHead id="web-price" label={t("price.label")} title={t("price.title")} body={t("price.body")} />
            <div className={s.priceGrid}>
              <div className={s.priceCard}>
                <p className="t-label text-ink-fg-muted">{t("price.cardLabel")}</p>
                <p className={s.bigPrice}>UGX 500,000</p>
                <p className="mt-3 t-small text-ink-fg-muted">{t("price.cardNote")}</p>
                <dl className={s.pay}>
                  {(["deposit", "balance", "renewal"] as const).map((k) => (
                    <div key={k}><dt>{t(`price.split.${k}.label`)}</dt><dd>{t(`price.split.${k}.value`)}</dd></div>
                  ))}
                </dl>
                <a href={waHref} target="_blank" rel="noopener noreferrer" className="q-btn bg-ink-fg text-ink hover:bg-white mt-8 w-full justify-center">
                  <WhatsAppIcon className="h-4 w-4" />{t("price.cta")}
                </a>
              </div>
              <div className={s.lists}>
                <div>
                  <h3 className={s.listTitle}>{t("price.inTitle")}</h3>
                  <ul>{included.map((x) => <li key={x} className={s.list}><Check aria-hidden="true" className="h-4 w-4 shrink-0 text-ok-ink translate-y-[0.2em]" />{x}</li>)}</ul>
                </div>
                <div>
                  <h3 className={s.listTitle}>{t("price.outTitle")}</h3>
                  <ul>{extras.map((x) => <li key={x} className={s.list}><Plus aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-muted translate-y-[0.2em]" />{x}</li>)}</ul>
                  <p className="mt-4 t-small text-ink-muted">{t("price.outNote")}</p>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* 7 — Made in Kampala */}
        <section className={`${s.band} q-scope`} aria-labelledby="web-kampala">
          <div className={s.bandImg}>
            <Image src="/websites/ug/nakasero.webp" alt={t("alt.market")} fill sizes="100vw" style={{ objectFit: "cover" }} />
            <p className={s.credit}>
              Nakasero Market: <a href="https://commons.wikimedia.org/wiki/File:Nakasero_Market_Kampala.jpg" target="_blank" rel="noopener noreferrer">Kateregga1</a>, CC BY-SA 4.0
            </p>
          </div>
          <div className={s.panel}>
            <Label>{t("kampala.label")}</Label>
            <Heading id="web-kampala" size="h2" className="mt-5 text-ink">{t("kampala.title")}</Heading>
            <Text className="mt-5">{t("kampala.body")}</Text>
            <div className="mt-7"><ButtonLink href="#preview">{t("kampala.cta")}</ButtonLink></div>
          </div>
        </section>

        {/* 8 — Questions */}
        <Section aria-labelledby="web-faq">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <SectionHead id="web-faq" className="lg:col-span-4" label={t("faqLabel")} title={t("faqTitle")} />
            <div className="lg:col-span-8"><Faq items={faqs} /></div>
          </Container>
        </Section>

        {/* 9 — The free preview */}
        <Section tone="cream" id="preview" aria-labelledby="preview-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="preview-title" label={t("previewBlock.label")} title={t("previewBlock.title")} body={t("previewBlock.body")} />
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="q-btn bg-ink text-paper hover:bg-black mt-8">
                <WhatsAppIcon className="h-4 w-4" />{t("previewBlock.wa")}
              </a>
            </div>
            <div className="lg:col-span-7">
              <WebsitePreviewForm />
            </div>
          </Container>
          <Container>
            <p className="mt-14 t-small text-ink-muted">
              {t("credits")}{" "}
              Owino market stall: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Assorted_African_Food_spices_and_medicines.jpg" target="_blank" rel="noopener noreferrer">Alvinategyeka</a>;
              Lake Bunyonyi: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Lake_Bunyonyi_Islands_06.jpg" target="_blank" rel="noopener noreferrer">Shaayflix Dr Shaay</a>
              {" "}(<a className="underline" href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>).
            </p>
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
