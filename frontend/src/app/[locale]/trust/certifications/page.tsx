import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { Section, Container, Label, Heading, Text, TextLink } from "@/components/system";
import { ContactBand } from "@/components/system/blocks";
import { EVIDENCE, EVIDENCE_GROUPS, type EvidenceRecord } from "@/lib/evidence";

/* ─── Certifications — the evidence centre ────────────────────────────────────
   One record per credential: what it is, who issued it, what it covers, what
   it does NOT establish, and how to get the document. Management-system
   certificates, product tests, regulatory clearances and insurance are kept
   apart, as the external review asked. Details appear only once someone has
   seen them on the document (lib/evidence.ts); a blank beats a guess.

   Removed on the way in: "farm-to-cup traceability" and "we can trace and
   evidence our chain", which nothing on record supports.                    */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.trust" });
  return { title: t("title"), description: t("description") };
}

function Row({ k, v }: { k: string; v?: React.ReactNode }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[11rem_1fr] gap-1 sm:gap-6 py-3 border-b border-line last:border-b-0">
      <dt className="t-label text-ink-muted pt-0.5">{k}</dt>
      <dd className="t-small text-ink">{v}</dd>
    </div>
  );
}

export default async function CertificationsPage() {
  const t = await getTranslations("evidence");
  const home = await getTranslations("homeQA");

  const record = (r: EvidenceRecord) => {
    const name = t(`records.${r.id}.name`);
    const request = `/enquire?message=${encodeURIComponent(t("requestMessage", { name }))}`;
    return (
      <Reveal as="li" key={r.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 py-10 border-b border-line">
        <div className="lg:col-span-4">
          <p className="t-label text-gold-ink">{t(`records.${r.id}.kind`)}</p>
          <h3 className="t-h3 text-ink mt-3">{name}</h3>
          <div className="mt-5">
            {r.document === "public" && r.href ? (
              <a href={r.href} target="_blank" rel="noopener noreferrer" className="q-link t-small text-ink">
                <Download aria-hidden="true" className="h-3.5 w-3.5" />
                {t("docPublic")}
              </a>
            ) : (
              <TextLink href={request}>{t("requestCta")}</TextLink>
            )}
          </div>
        </div>
        <dl className="lg:col-span-8 border-t border-line-strong lg:border-t-0">
          <Row k={t("fieldIssuer")} v={t(`records.${r.id}.issuer`)} />
          <Row k={t("fieldCovers")} v={t(`records.${r.id}.covers`)} />
          <Row k={t("fieldHolder")} v={r.holder} />
          <Row k={t("fieldIssued")} v={r.issued} />
          <Row k={t("fieldReference")} v={r.reference && <span className="font-numeric">{r.reference}</span>} />
          <Row k={t("fieldValid")} v={r.validUntil} />
          <Row k={t("fieldLimits")} v={<span className="text-ink-soft">{t(`records.${r.id}.limits`)}</span>} />
          <Row k={t("fieldDocument")} v={r.document === "public" ? t("docPublic") : t("docRequest")} />
        </dl>
      </Reveal>
    );
  };

  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <Section tone="paper" className="!pt-14 lg:!pt-20 !pb-10" aria-labelledby="evidence-title">
          <Container>
            <Label className="mb-8 q-rise">{t("label")}</Label>
            <Heading as="h1" size="display" id="evidence-title" className="text-ink max-w-[48rem] q-rise">{t("title")}</Heading>
            <Text size="lead" className="mt-8 max-w-[40rem] q-rise">{t("lead")}</Text>

            {/* Jump links — one per group */}
            <nav aria-label={t("label")} className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {EVIDENCE_GROUPS.map((g, i) => (
                <a key={g} href={`#evidence-${g}`} className="q-link t-small text-ink">
                  <span className="font-numeric text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
                  {t(`groups.${g}`)}
                </a>
              ))}
            </nav>
          </Container>
        </Section>

        {EVIDENCE_GROUPS.map((g, i) => (
          <Section key={g} tone={i % 2 ? "deep" : "paper"} rule={i === 0} id={`evidence-${g}`} aria-labelledby={`evidence-${g}-h`}>
            <Container>
              <Label index={String(i + 1).padStart(2, "0")} className="mb-4">{t("label")}</Label>
              <h2 id={`evidence-${g}-h`} className="t-h2 text-ink">{t(`groups.${g}`)}</h2>
              <ul className="mt-6 border-t border-line-strong">
                {EVIDENCE.filter((r) => r.group === g).map(record)}
              </ul>
            </Container>
          </Section>
        ))}

        <Section tone="paper" rule tight aria-labelledby="evidence-note">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <h2 id="evidence-note" className="lg:col-span-4 t-h3 text-ink">{t("noteTitle")}</h2>
            <Text className="lg:col-span-7">{t("noteBody")}</Text>
          </Container>
        </Section>

        <ContactBand
          title={t("contactTitle")}
          body={t("contactBody")}
          briefLabel={t("contactBrief")}
          labels={{ call: home("closeCall"), email: home("closeEmail"), visit: home("closeVisit"), whatsapp: home("closeWhatsApp") }}
        />
      </main>
      <Footer />
    </>
  );
}
