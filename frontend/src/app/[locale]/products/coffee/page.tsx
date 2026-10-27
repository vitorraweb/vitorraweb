import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Faq } from "@/components/ui/faq";
import CoffeeExportSpec from "@/components/sections/CoffeeExportSpec";
import { HorizontalSteps } from "@/components/motion/HorizontalSteps";
import { OriginMap } from "@/components/maps/OriginMap";
import { Film } from "@/components/system/Film";
import { Section, Container, TextLink } from "@/components/system";
import {
  SectionHead, SpecTable, ContactBand,
} from "@/components/system/blocks";
import { CinematicHero, DesignedBanner, FactStrip, Picture } from "@/components/system/imagery";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";

/* ─── Vitorra Coffee — Quiet Authority ────────────────────────────────────────
   Built around the export buyer — the motion that is actually selling — with
   wholesale and (gated) retail as the other two ways in:
   what it is → origin and process → export terms, grades, documents →
   ways to buy → questions → contact.

   Removed on the way in: the claim that "every bag carries a QR code that
   traces your coffee back to its source". Retail bags aren't on sale yet and
   nothing shows that tracing working; it can come back when it does.
   Generated imagery (a "farmer", branded export cartons) is no longer used;
   photographs are licensed stock (public/images/stock/README.md).                     */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.coffee" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE_EXPORT = "/enquire?sector=COFFEE&channel=export";

export default async function CoffeePage() {
  const t = await getTranslations("coffeeQA");
  const old = await getTranslations("coffeePage");
  const home = await getTranslations("homeQA");
  const shared = await getTranslations("productQA");
  const tp = await getTranslations("products");
  const alt = await getTranslations("imageAlt");
  const bn = await getTranslations("banners");
  const vt = await getTranslations("visuals");

  const ways = [
    { title: old("exportTitle"), body: old("exportBody"), href: "#coffee-export", cta: old("exportCta") },
    { title: old("wholesaleTitle"), body: old("wholesaleBody"), href: "/enquire?sector=COFFEE&channel=local", cta: old("wholesaleCta") },
    COFFEE_SHOP_ENABLED
      ? { title: old("retailShopTitle"), body: old("retailShopBody"), href: "/shop", cta: old("retailShopCta") }
      : { title: old("retailSoonTitle"), body: old("retailSoonBody"), href: "/enquire?sector=COFFEE", cta: old("retailSoonCta") },
  ];

  /* faq4 (QR bag-to-farm tracing) is deliberately left out — see above. */
  const faqs = [3, 7, 8, 6, 1, 2, 5].map((n) => ({ q: old(`faq${n}Q`), a: old(`faq${n}A`) }));

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">

        <CinematicHero
          image="/photos/hero-04-coffee.jpg"
          transitionName="hero-coffee"
          alt={alt("coffeeWarehouse")}
          index="03"
          label={tp("coffee.name")}
          lines={[t("title")]}
          lead={t("lead")}
          primary={{ label: t("primary"), href: ENQUIRE_EXPORT }}
          secondary={{ label: t("secondary"), href: "#coffee-export" }}
        />
        <FactStrip
          facts={[
            { k: t("factGradeK"), v: t("factGradeV") },
            { k: t("factMoqK"), v: t("factMoqV") },
            { k: t("factHsK"), v: t("factHsV") },
            { k: t("factTermsK"), v: t("factTermsV") },
          ]}
        />

        {/* ══ Origin and process — cherry to export, travelling sideways ═════ */}
        <HorizontalSteps
          id="coffee-origin"
          tone="deep"
          label={t("originLabel")}
          title={t("originTitle")}
          intro={t("originBody")}
          steps={[
            { title: old("ftcStep1Title"), body: old("ftcStep1Body"), image: { src: "/photos/process-coffee-cherries.jpg", alt: alt("coffeeCherries") } },
            { title: old("ftcStep2Title"), body: old("ftcStep2Body"), image: { src: "/photos/process-coffee-hands.jpg", alt: alt("coffeeHands") } },
            { title: old("ftcStep3Title"), body: old("ftcStep3Body"), image: { src: "/photos/process-coffee-roaster.jpg", alt: alt("coffeeRoaster") } },
          ]}
          after={
            <Film
              className="max-w-[44rem]"
              src="/videos/coffee-hero.mp4"
              poster="/photos/poster-coffee.jpg"
              title={t("filmTitle")}
              caption={t("filmCaption")}
              playLabel={shared("playFilm")}
            />
          }
        />

        {/* ══ Origin — where it grows, on a real map ═══════════════════════ */}
        <Section tone="paper" aria-labelledby="coffee-origin-map">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <SectionHead id="coffee-origin-map" label={vt("originLabel")} title={vt("originTitle")} body={vt("originBody")} />
            </div>
            <OriginMap className="lg:col-span-6 lg:col-start-7 m-0" title={vt("originMapTitle")} elgon={vt("elgon")} />
          </Container>
        </Section>

        <DesignedBanner src="/banners/wide-coffee.webp" alt={bn("wideCoffeeAlt")} width={2880} height={1234} />

        <Section tone="paper" aria-labelledby="coffee-blend">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 id="coffee-blend" className="t-h2 text-ink">{old("blendTitle")}</h2>
              <p className="t-body text-ink-soft mt-6">{old("blendBody")}</p>
              <Picture className="mt-12 max-w-[22rem]" src="/banners/keyvisual-coffee.webp" alt={bn("keyCoffeeAlt")} ratio="4/5" grade={false} sizes="(min-width: 1024px) 25vw, 90vw" />
            </div>
            <div className="lg:col-span-7">
              <SpecTable rows={[1, 2, 3, 4, 5].map((n) => [old(`spec${n}Key`), old(`spec${n}Value`)] as [string, string])} />
            </div>
          </Container>
        </Section>


        <CoffeeExportSpec />

        {/* ══ Ways to buy ═══════════════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="coffee-ways">
          <Container>
            <SectionHead id="coffee-ways" label={t("waysLabel")} title={t("waysTitle")} className="mb-14" />
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border-y border-line">
              {ways.map((w, i) => (
                <li key={w.title} className="flex flex-col bg-paper py-10 md:px-8 md:first:pl-0">
                  <span className="t-label font-numeric text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-h3 text-ink mt-4">{w.title}</h3>
                  <p className="t-small text-ink-soft mt-3 mb-8">{w.body}</p>
                  <div className="mt-auto">
                    <TextLink href={w.href}>{w.cta}</TextLink>
                  </div>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        {/* ══ Questions ═════════════════════════════════════════════════════ */}
        <Section tone="paper" rule aria-labelledby="coffee-faq">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <SectionHead id="coffee-faq" label={shared("faqLabel")} title={t("faqTitle")} className="lg:col-span-4" />
            <div className="lg:col-span-8">
              <Faq items={faqs} />
            </div>
          </Container>
        </Section>

        <ContactBand
          title={t("contactTitle")}
          body={t("contactBody")}
          briefLabel={t("primary")}
          briefHref={ENQUIRE_EXPORT}
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
