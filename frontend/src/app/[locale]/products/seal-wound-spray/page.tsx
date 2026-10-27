import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/ui/faq";
import { HorizontalSteps } from "@/components/motion/HorizontalSteps";
import { TiltCard } from "@/components/motion/TiltCard";
import { Section, Container, Text, TextLink } from "@/components/system";
import {
  SectionHead, FactGrid, SpecTable, ContactBand,
} from "@/components/system/blocks";
import { Film } from "@/components/system/Film";
import { CinematicHero, DesignedBanner, FactStrip, Picture } from "@/components/system/imagery";

/* ─── SEAL Hemostatic Wound Spray — Quiet Authority ───────────────────────────
   Built around a procurement journey, because SEAL is bought by institutions:
   what it is → how it is used → the three formats → what stands behind it and
   its regulatory status → specifications and safety → what a procurement team
   receives → questions → contact.

   The product's real US FDA 510(k) facts are stated plainly; no Uganda
   National Drug Authority approval is claimed (BRD: NDA status pending).
   The manufacturer film shows an open wound, so it plays only when asked and
   carries a note saying so.                                                  */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.seal" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE = "/enquire?sector=SEAL";

export default async function SealPage() {
  const t = await getTranslations("sealQA");
  const old = await getTranslations("sealPage");
  const home = await getTranslations("homeQA");
  const shared = await getTranslations("productQA");
  const tp = await getTranslations("products");
  const alt = await getTranslations("imageAlt");
  const bn = await getTranslations("banners");

  const variants = [
    { name: "SEAL OTC", image: "/photos/seal-range-otc.png", imageAlt: alt("sealOtc"), tagline: old("v1Tagline"), body: old("v1Body"), specs: [1, 2, 3, 4, 5].map((n) => old(`v1Spec${n}`)) },
    { name: "SEAL PRO", image: "/photos/seal-range-pro.png", imageAlt: alt("sealPro"), tagline: old("v2Tagline"), body: old("v2Body"), specs: [1, 2, 3, 4, 5].map((n) => old(`v2Spec${n}`)), note: old("mostCapable") },
    { name: "HemoSEAL Pet", image: "/photos/seal-range-pet.png", imageAlt: alt("sealPet"), tagline: old("v3Tagline"), body: old("v3Body"), specs: [1, 2, 3, 4, 5].map((n) => old(`v3Spec${n}`)) },
  ];

  const faqs = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ q: old(`faq${n}Q`), a: old(`faq${n}A`) }));

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">

        <CinematicHero
          image="/photos/hero-03-seal.jpg"
          transitionName="hero-seal"
          alt={alt("sealKit")}
          index="02"
          label={tp("seal.name")}
          lines={[t("title")]}
          lead={t("lead")}
          primary={{ label: t("primary"), href: ENQUIRE }}
          secondary={{ label: t("secondary"), href: "#seal-range" }}
        />
        <FactStrip
          facts={[
            { k: t("factClearK"), v: t("factClearV") },
            { k: t("factShelfK"), v: t("factShelfV") },
            { k: t("factStoreK"), v: t("factStoreV") },
            { k: t("factUseK"), v: t("factUseV") },
          ]}
        />

        {/* ══ How it is used — four steps that travel sideways on scroll ═════ */}
        <HorizontalSteps
          id="seal-how"
          tone="ink"
          label={t("howLabel")}
          title={t("howTitle")}
          intro={old("benefit1Body")}
          steps={[1, 2, 3, 4].map((n) => ({ title: old(`step${n}Title`), body: old(`step${n}Body`) }))}
          after={
            <Film
              onInk
              className="max-w-[44rem]"
              src="/videos/seal-hero.mp4"
              poster="/photos/poster-seal.jpg"
              title={t("filmTitle")}
              caption={t("filmCaption")}
              playLabel={shared("playFilm")}
            />
          }
        />

        {/* ══ The range ═════════════════════════════════════════════════════ */}
        <Section tone="deep" id="seal-range" aria-labelledby="seal-range-heading">
          <Container>
            <SectionHead id="seal-range-heading" label={t("rangeLabel")} title={old("rangeTitle")} body={old("rangeBody")} className="mb-14" />
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {variants.map((v) => (
                <li key={v.name}>
                  <TiltCard className="flex flex-col bg-paper border border-line rounded-frame p-8 lg:p-10">
                  {/* The real cans, cut out from the product photos. Shown at
                      one display height: their true relative sizes aren't
                      known, so the net weight in the specs carries that. */}
                  <div className="relative mx-auto mb-8 h-56 w-full">
                    <Image src={v.image} alt={v.imageAlt} fill sizes="(min-width: 768px) 20vw, 60vw" className="object-contain" />
                  </div>
                  <p className="t-label text-gold-ink">{v.note ?? v.tagline}</p>
                  <h3 className="t-h2 text-ink mt-4">{v.name}</h3>
                  {v.note && <p className="t-small text-ink-muted mt-1">{v.tagline}</p>}
                  <p className="t-body text-ink-soft mt-5">{v.body}</p>
                  <ul className="mt-8 border-t border-line">
                    {v.specs.map((s) => (
                      <li key={s} className="t-small text-ink py-3 border-b border-line">{s}</li>
                    ))}
                  </ul>
                  </TiltCard>
                </li>
              ))}
            </ul>
            <p className="t-small text-ink-muted mt-8">
              {old("rangeFootText")}{" "}
              <TextLink href={ENQUIRE}>{old("rangeFootLink")}</TextLink>
              {old("rangeFootSuffix")}
            </p>
          </Container>
        </Section>

        {/* ══ What stands behind it + regulatory status ═════════════════════ */}
        <Section tone="paper" aria-labelledby="seal-trust">
          <Container>
            <SectionHead id="seal-trust" label={t("trustLabel")} title={<>{old("trustTitleLead")} {old("trustTitleAccent")}</>} body={old("trustBody")} className="mb-14" />
            <FactGrid
              columns={3}
              items={[1, 2, 3, 4, 5, 6].map((n) => ({ title: old(`trust${n}Label`), body: old(`trust${n}Body`) }))}
            />
            <Reveal className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6 border-l-2 border-gold pl-6">
              <h3 className="lg:col-span-3 t-h3 text-ink">{t("regTitle")}</h3>
              <Text className="lg:col-span-8">{t("regBody")}</Text>
            </Reveal>
          </Container>
        </Section>

        <DesignedBanner src="/banners/wide-seal.webp" alt={bn("wideSealAlt")} width={2880} height={1234} />

        {/* ══ Specifications and safety ═════════════════════════════════════ */}
        <Section tone="deep" aria-labelledby="seal-specs">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-6">
              <SectionHead id="seal-specs" label={t("specsLabel")} title={old("specsTitle")} className="mb-10" />
              <SpecTable rows={[1, 2, 3, 4, 5, 6].map((n) => [old(`spec${n}Key`), old(`spec${n}Value`)] as [string, string])} />
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <SectionHead label={old("safetyEyebrow")} title={old("safetyTitle")} className="mb-10" />
              <ul className="border-t border-line-strong">
                {[old("safety1"), old("safety2"), old("safety3")].map((s) => (
                  <li key={s} className="t-body text-ink-soft py-5 border-b border-line">{s}</li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>

        {/* ══ For procurement teams ═════════════════════════════════════════ */}
        <Section tone="ink" aria-labelledby="seal-proc">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="seal-proc" onInk label={t("procLabel")} title={t("procTitle")} body={t("procBody")} />
              <Picture className="mt-12 max-w-[22rem]" src="/banners/keyvisual-seal.webp" alt={bn("keySealAlt")} ratio="4/5" grade={false} sizes="(min-width: 1024px) 30vw, 100vw" />
            </div>
            <ol className="lg:col-span-6 lg:col-start-7 border-t border-ink-line">
              {[t("proc1"), t("proc2"), t("proc3"), t("proc4")].map((p, i) => (
                <li key={p} className="grid grid-cols-[3rem_1fr] gap-4 py-5 border-b border-ink-line">
                  <span className="t-label font-numeric text-gold pt-1">{String(i + 1).padStart(2, "0")}</span>
                  <span className="t-body text-ink-fg">{p}</span>
                </li>
              ))}
            </ol>
          </Container>
        </Section>

        {/* ══ Questions ═════════════════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="seal-faq">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <SectionHead id="seal-faq" label={shared("faqLabel")} title={t("faqTitle")} className="lg:col-span-4" />
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
