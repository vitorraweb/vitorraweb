import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Team from "@/components/sections/Team";
import { Reveal } from "@/components/ui/reveal";
import { Section, Container, Label, Text, TextLink } from "@/components/system";
import { SectionHead, FactGrid, CredentialGroups, ContactBand } from "@/components/system/blocks";
import { CinematicHero, Mosaic } from "@/components/system/imagery";
import { BusinessDoors } from "@/components/system/doors";
import { COMPANY_REG_NO } from "@/lib/constants";

/* ─── About — Quiet Authority ─────────────────────────────────────────────────
   Opens on the real head office. Then: the mission as one large statement →
   who we are, with the checkable facts (URSB registration, number, office) →
   three working rules → the four businesses → the people → what stands behind
   it → contact.

   Copy corrected on the way in: no list of client countries we can't show
   ("Uganda, Kenya, Tanzania, Rwanda", "Uganda + 5 regions"); no claim of
   food-safety certification; no "every time" absolutes; FET no longer called
   "ISO certified" while the certificate holder is unconfirmed.              */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.about" });
  return { title: t("title"), description: t("description") };
}

export default async function AboutPage() {
  const t = await getTranslations("aboutQA");
  const home = await getTranslations("homeQA");
  const alt = await getTranslations("imageAlt");

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">
        <CinematicHero
          image="/hero/about-hq.jpg"
          alt={alt("hq")}
          label={t("heroLabel")}
          lines={[t("heroLine1"), t("heroLine2")]}
          lead={t("heroLead")}
          primary={{ label: t("contactBrief"), href: "/contact" }}
          secondary={{ label: t("portfolioLabel"), href: "#about-businesses" }}
          grade={false}
        />

        {/* ══ Mission — one statement ═══════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="about-mission">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <Label className="lg:col-span-3 lg:pt-4">{t("missionLabel")}</Label>
            <Reveal className="lg:col-span-9">
              <p id="about-mission" className="t-h1 text-ink max-w-[52rem]">{t("missionStatement")}</p>
              <Text size="lead" className="mt-8 max-w-[38rem]">{t("missionBody")}</Text>
            </Reveal>
          </Container>
        </Section>

        {/* ══ Who we are ════════════════════════════════════════════════════ */}
        <Section tone="deep" aria-labelledby="about-who">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5">
              <SectionHead id="about-who" label={t("whoLabel")} title={t("whoTitle")} body={t("whoBody")} />
              <dl className="mt-10 grid grid-cols-2 gap-px bg-line border-y border-line">
                {[
                  { k: t("factRegK"), v: t("factRegV") },
                  { k: t("factNoK"), v: COMPANY_REG_NO },
                  { k: t("factOfficeK"), v: t("factOfficeV") },
                  { k: t("factReplyK"), v: t("factReplyV") },
                ].map((f) => (
                  <div key={f.k} className="bg-paper-deep py-5 pr-4">
                    <dt className="t-label text-ink-muted">{f.k}</dt>
                    <dd className="t-small text-ink mt-1.5 font-numeric">{f.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Mosaic
                a={{ src: "/hero/brand-wall.jpg", alt: alt("reception"), caption: home("companyPhotoCaption") }}
                b={{ src: "/images/stock/kampala-skyline.jpg", alt: alt("kampala") }}
              />
            </div>
          </Container>
        </Section>

        {/* ══ How we work ═══════════════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="about-values">
          <Container>
            <SectionHead id="about-values" label={t("valuesLabel")} title={t("valuesTitle")} className="mb-14" />
            <FactGrid
              columns={3}
              items={[1, 2, 3].map((n) => ({ title: t(`value${n}Title`), body: t(`value${n}Body`) }))}
            />
          </Container>
        </Section>

        {/* ══ The four businesses ═══════════════════════════════════════════ */}
        <Section tone="paper" rule id="about-businesses" aria-labelledby="about-businesses-heading">
          <Container>
            <SectionHead id="about-businesses-heading" label={t("portfolioLabel")} title={t("portfolioTitle")} className="mb-14" />
            <BusinessDoors />
          </Container>
        </Section>

        {/* ══ The people ════════════════════════════════════════════════════ */}
        <Section tone="deep" id="team" aria-labelledby="about-team">
          <Container>
            <SectionHead id="about-team" label={t("teamLabel")} title={t("teamTitle")} body={t("teamBody")} className="mb-16" />
            <Team labels={{ leadership: t("leadershipLabel"), officers: t("officersLabel") }} />
          </Container>
        </Section>

        {/* ══ What stands behind it ═════════════════════════════════════════ */}
        <Section tone="paper" aria-labelledby="about-cred">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-4">
              <SectionHead id="about-cred" label={home("credLabel")} title={home("credTitle")} body={home("credBody")} />
              <div className="mt-8"><TextLink href="/trust/certifications">{home("credCta")}</TextLink></div>
            </div>
            <div className="lg:col-span-8">
              <CredentialGroups
                groups={[
                  { title: home("credGroupProduct"), items: [
                    { name: "CTI GmbH", what: home("credCti") },
                    { name: "AVL Technologies", what: home("credAvl") },
                    { name: "qm-solutions GmbH", what: home("credQm") },
                  ] },
                  { title: home("credGroupCompany"), items: [
                    { name: "ISO 9001:2015", what: home("credIso9001") },
                    { name: "ISO 14001:2015", what: home("credIso14001") },
                    { name: "ISO 27001", what: home("credIso27001") },
                    { name: "Zurich Insurance", what: home("credZurich") },
                  ] },
                ]}
              />
              <Text size="small" muted className="mt-8">{home("credNote")}</Text>
            </div>
          </Container>
        </Section>

        <ContactBand
          title={t("contactTitle")}
          body={t("contactBody")}
          briefLabel={t("contactBrief")}
          briefHref="/contact"
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
