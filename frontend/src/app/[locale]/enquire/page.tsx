import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EnquiryForm from "@/components/sections/EnquiryForm";
import { Section, Container, Label, Heading, Text } from "@/components/system";
import { CONTACT_ADDRESS, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";
import { FET_TIERS } from "@/lib/fet-pricing";

/* ─── Enquire — Quiet Authority ───────────────────────────────────────────────
   A task page, so it is calm: no cinematic opening, the form within one
   scroll, and the reassurances plus a direct way to reach a person beside it,
   staying in view while the visitor fills it in.

   Prefill: the FET tools pass `vehicle`, `fleet` and a `message`; the coffee
   page passes `channel` (export | local) and `intent=sample`, so "Request a
   sample" arrives with the export channel and the sample question answered. */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.enquire" });
  return { title: t("title"), description: t("description") };
}

const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

export default async function EnquirePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; message?: string; vehicle?: string; fleet?: string; channel?: string; intent?: string }>;
}) {
  const t = await getTranslations("enquirePage");
  const home = await getTranslations("homeQA");
  const params = await searchParams;

  let sector = params.sector?.toUpperCase() ?? "";
  const initialMessage = params.message?.trim() ?? "";
  const initialAnswers: Record<string, string> = {};
  if (params.vehicle && FET_TIERS.some((tier) => tier.id === params.vehicle)) {
    initialAnswers.vehicle_type = params.vehicle;
    if (!sector) sector = "FET";
  }
  if (params.fleet && /^\d+$/.test(params.fleet)) initialAnswers.fleet_size = params.fleet;
  if (sector === "COFFEE") {
    if (params.channel === "export" || params.channel === "local") initialAnswers.channel = params.channel;
    if (params.intent === "sample") {
      initialAnswers.channel = "export";
      initialAnswers.sample = "yes";
    }
  }

  const key = ["FET", "SEAL", "COFFEE", "LOGISTICS"].includes(sector) ? sector.toLowerCase() : "default";

  const assurances = [
    { title: t("assurance1Title"), body: t("assurance1Body") },
    { title: t("assurance2Title"), body: t("assurance2Body") },
    { title: t("assurance3Title"), body: t("assurance3Body") },
  ];

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <Section tone="paper" className="!pt-14 lg:!pt-20 !pb-10 lg:!pb-14" aria-labelledby="enquire-title">
          <Container>
            <Label className="mb-8 q-rise">{t(`${key}Eyebrow`)}</Label>
            <Heading as="h1" size="h1" id="enquire-title" className="text-ink max-w-[44rem] q-rise" >
              {t(`${key}Title`)}
            </Heading>
            <Text size="lead" className="mt-6 max-w-[36rem] q-rise">{t(`${key}Body`)}</Text>
          </Container>
        </Section>

        <Section tone="deep" className="!pt-12 lg:!pt-16" aria-label={t(`${key}Title`)}>
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7 lg:order-2">
              <EnquiryForm initialSector={sector} initialMessage={initialMessage} initialAnswers={initialAnswers} />
            </div>

            <aside className="lg:col-span-4 lg:order-1 lg:sticky lg:top-28">
              <ol className="border-t border-line-strong">
                {assurances.map((a, i) => (
                  <li key={a.title} className="grid grid-cols-[2.5rem_1fr] gap-3 py-5 border-b border-line">
                    <span className="t-label font-numeric text-gold-ink pt-1">{String(i + 1).padStart(2, "0")}</span>
                    <span>
                      <span className="block font-display text-[1.25rem] leading-tight text-ink">{a.title}</span>
                      <span className="block t-small text-ink-muted mt-1">{a.body}</span>
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-10">
                <p className="t-label text-ink-muted mb-4">{t("preferTalk")}</p>
                <dl className="space-y-3 t-small">
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <dt className="text-ink-muted">{home("closeCall")}</dt>
                    <dd><a href={telHref} className="q-link text-ink">{CONTACT_PHONE}</a></dd>
                  </div>
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <dt className="text-ink-muted">{home("closeEmail")}</dt>
                    <dd><a href={`mailto:${CONTACT_EMAIL}`} className="q-link text-ink">{CONTACT_EMAIL}</a></dd>
                  </div>
                  <div className="grid grid-cols-[5rem_1fr] gap-3">
                    <dt className="text-ink-muted">{home("closeVisit")}</dt>
                    <dd className="text-ink-soft">{CONTACT_ADDRESS.join(", ")}</dd>
                  </div>
                </dl>
              </div>
            </aside>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
