import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/ui/faq";
import { Section, Container, Text, Figure, TextLink } from "@/components/system";
import {
  ProductIntro, SectionHead, Steps, FactGrid, SpecTable, ContactBand,
} from "@/components/system/blocks";
import { Film } from "@/components/system/Film";

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

  const variants = [
    { name: "SEAL OTC", tagline: old("v1Tagline"), body: old("v1Body"), specs: [1, 2, 3, 4, 5].map((n) => old(`v1Spec${n}`)) },
    { name: "SEAL PRO", tagline: old("v2Tagline"), body: old("v2Body"), specs: [1, 2, 3, 4, 5].map((n) => old(`v2Spec${n}`)), note: old("mostCapable") },
    { name: "HemoSEAL Pet", tagline: old("v3Tagline"), body: old("v3Body"), specs: [1, 2, 3, 4, 5].map((n) => old(`v3Spec${n}`)) },
  ];

  const faqs = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ q: old(`faq${n}Q`), a: old(`faq${n}A`) }));

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">

        <ProductIntro
          index="02"
          name={tp("seal.name")}
          title={t("title")}
          lead={t("lead")}
          primary={{ label: t("primary"), href: ENQUIRE }}
          secondary={{ label: t("secondary"), href: "#seal-range" }}
          facts={[
            { k: t("factClearK"), v: t("factClearV") },
            { k: t("factShelfK"), v: t("factShelfV") },
            { k: t("factStoreK"), v: t("factStoreV") },
            { k: t("factUseK"), v: t("factUseV") },
          ]}
          media={
            <Figure
              src="/products/seal/Picture1.jpg"
              alt={t("photoAlt")}
              caption={t("photoCaption")}
              ratio="4/3"
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
            />
          }
        />

        {/* ══ How it is used ════════════════════════════════════════════════ */}
        <Section tone="paper" rule aria-labelledby="seal-how">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <SectionHead id="seal-how" label={t("howLabel")} title={t("howTitle")} body={old("benefit1Body")} />
              <Film
                className="mt-12"
                src="/videos/seal-hero.mp4"
                poster="/videos/seal-hero-poster.jpg"
                title={t("filmTitle")}
                caption={t("filmCaption")}
                playLabel={shared("playFilm")}
              />
            </div>
            <div className="lg:col-span-7">
              <Steps items={[1, 2, 3, 4].map((n) => ({ title: old(`step${n}Title`), body: old(`step${n}Body`) }))} />
            </div>
          </Container>
        </Section>

        {/* ══ The range ═════════════════════════════════════════════════════ */}
        <Section tone="deep" id="seal-range" aria-labelledby="seal-range-heading">
          <Container>
            <SectionHead id="seal-range-heading" label={t("rangeLabel")} title={old("rangeTitle")} body={old("rangeBody")} className="mb-14" />
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border-y border-line">
              {variants.map((v) => (
                <li key={v.name} className="flex flex-col bg-paper-deep py-10 md:px-8 md:first:pl-0">
                  <p className="t-label text-gold-ink">{v.note ?? v.tagline}</p>
                  <h3 className="t-h2 text-ink mt-4">{v.name}</h3>
                  {v.note && <p className="t-small text-ink-muted mt-1">{v.tagline}</p>}
                  <p className="t-body text-ink-soft mt-5">{v.body}</p>
                  <ul className="mt-8 border-t border-line">
                    {v.specs.map((s) => (
                      <li key={s} className="t-small text-ink py-3 border-b border-line">{s}</li>
                    ))}
                  </ul>
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
