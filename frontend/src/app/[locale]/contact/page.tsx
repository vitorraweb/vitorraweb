import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/sections/ContactForm";
import { Section, Container, Label, Heading, Text, TextLink } from "@/components/system";
import { Picture } from "@/components/system/imagery";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_ALT, CONTACT_ADDRESS } from "@/lib/constants";

/* ─── Contact — Quiet Authority ───────────────────────────────────────────────
   Calm and direct: who we are and where, every way to reach a person (with
   hours), a short message form, and the map. The photograph is the real head
   office — on a contact page, the actual building is the useful image.      */

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
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <Section tone="paper" className="!pt-14 lg:!pt-20" aria-labelledby="contact-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-end">
            <div className="lg:col-span-6 lg:pb-8">
              <Label className="mb-8 q-rise">{t("eyebrow")}</Label>
              <Heading as="h1" size="display" id="contact-title" className="text-ink q-rise">{t("title")}</Heading>
              <Text size="lead" className="mt-8 max-w-[32rem] q-rise">{t("subtitle")}</Text>
            </div>
            <div className="lg:col-span-5 lg:col-start-8">
              <Picture src="/hero/about-hq.jpg" alt={alt("hq")} caption={CONTACT_ADDRESS.join(", ")} ratio="4/5" grade={false} sizes="(min-width: 1024px) 38vw, 100vw" />
            </div>
          </Container>
        </Section>

        <Section tone="deep" aria-labelledby="contact-direct">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <h2 id="contact-direct" className="t-h2 text-ink mb-10">{t("directTitle")}</h2>
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

        {/* The map, toned to sit with the page instead of Google's colours. */}
        <figure className="q-scope m-0 bg-paper-deep border-t border-line">
          <iframe
            title={t("mapTitle")}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="block w-full h-[52svh] border-0 [filter:grayscale(1)_contrast(1.05)_opacity(0.92)]"
          />
        </figure>
      </main>
      <Footer />
    </>
  );
}
