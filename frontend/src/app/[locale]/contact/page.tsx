import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/sections/ContactForm";
import { Section, Container, Label, Heading, TextLink } from "@/components/system";
import { PageHero } from "@/components/sections/PageHero";
import { Picture } from "@/components/system/imagery";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_ALT, CONTACT_ADDRESS } from "@/lib/constants";

/* ─── Contact — Quiet Authority ───────────────────────────────────────────────
   Set like the homepage: the statement opening, then every way to reach a
   person (with hours) beside a short form on cream, then the real head
   office beside the map on sage.                                           */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return { title: t("title"), description: t("description") };
}

const tel = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;
const telAlt = `tel:${CONTACT_PHONE_ALT.replace(/\s+/g, "")}`;
const wa = `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}`;
const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(CONTACT_ADDRESS.join(", "))}&output=embed`;

export default async function ContactPage() {
  const t = await getTranslations("contact");
  const alt = await getTranslations("imageAlt");

  const methods: { k: string; v: React.ReactNode }[] = [
    { k: t("emailUs"), v: <a href={`mailto:${CONTACT_EMAIL}`} className="q-link">{CONTACT_EMAIL}</a> },
    {
      k: t("callUs"),
      v: (
        <span className="flex flex-col gap-1.5">
          <a href={tel} className="q-link w-fit font-numeric">{CONTACT_PHONE}</a>
          <a href={telAlt} className="q-link w-fit font-numeric">{CONTACT_PHONE_ALT}</a>
        </span>
      ),
    },
    { k: t("whatsapp"), v: <a href={wa} target="_blank" rel="noopener noreferrer" className="q-link">{t("whatsappValue")}</a> },
    { k: t("visitLabel"), v: <span className="text-ink-soft">{CONTACT_ADDRESS.join(", ")}</span> },
    { k: t("hoursLabel"), v: <span className="flex flex-col gap-1 text-ink-soft"><span>{t("hoursWeekday")}</span><span>{t("hoursSaturday")}</span></span> },
  ];

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper">
        <PageHero
          id="contact-title"
          label={t("eyebrow")}
          title={t("title")}
          lead={t("subtitle")}
          cta={{ label: t("quoteCta"), href: "/enquire" }}
        />

        {/* Every way to reach a person, and the short form, on cream. */}
        <Section tone="cream" aria-labelledby="contact-direct">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <Label className="mb-6">{t("eyebrow")}</Label>
              <Heading id="contact-direct" size="h2" className="text-ink mb-10">{t("directTitle")}</Heading>
              <dl className="border-t border-line-strong">
                {methods.map((m) => (
                  <div key={m.k} className="grid grid-cols-[7rem_1fr] gap-4 py-5 border-b border-line">
                    <dt className="t-label text-ink-muted pt-0.5">{m.k}</dt>
                    <dd className="t-body text-ink">{m.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-12 border-l-2 border-gold pl-6">
                <p className="font-display text-[1.375rem] text-ink">{t("quoteTitle")}</p>
                <p className="t-small text-ink-muted mt-2 mb-5">{t("quoteBody")}</p>
                <TextLink href="/enquire">{t("quoteCta")}</TextLink>
              </div>
            </div>
            <div className="lg:col-span-7">
              <ContactForm />
            </div>
          </Container>
        </Section>

        {/* Where we are: the real building beside the map, on sage. */}
        <Section tone="sage" aria-labelledby="contact-visit">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            <div className="lg:col-span-5">
              <Label className="mb-6">{t("visitLabel")}</Label>
              <h2 id="contact-visit" className="sr-only">{t("visitLabel")}</h2>
              <Picture src="/photos/company-A-head-office.jpg" alt={alt("hq")} caption={CONTACT_ADDRESS.join(", ")} ratio="4/5" grade={false} sizes="(min-width: 1024px) 38vw, 100vw" />
            </div>
            {/* The map, toned to sit with the page instead of Google's colours. */}
            <figure className="lg:col-span-7 m-0 min-h-[24rem] overflow-hidden rounded-frame border border-line bg-paper-deep">
              <iframe
                title={t("mapTitle")}
                src={mapSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="block w-full h-full min-h-[24rem] border-0 [filter:grayscale(1)_contrast(1.05)_opacity(0.92)]"
              />
            </figure>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
