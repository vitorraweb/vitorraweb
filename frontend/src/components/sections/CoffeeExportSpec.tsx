import { useTranslations } from "next-intl";
import { Section, Container, ButtonLink, TextLink, Text } from "@/components/system";
import { SectionHead, SpecTable } from "@/components/system/blocks";
import {
  COFFEE_EXPORT,
  COFFEE_GRADES,
  COFFEE_PRICE_BAND,
  formatPriceBand,
} from "@/lib/coffee-export";

/* ─── Coffee — export trade specification (Quiet Authority) ───────────────────
   The figures an importer needs before they will start a conversation: grade,
   MOQ, HS code, incoterms, loading port, lead time and an indicative band.

   A real number is published, but every route out is an enquiry, never a cart.
   The bulk caveat sits beside the price because the trade listing excludes
   bulk from the band, and a buyer who discovers that later has been misled.
   Production capacity is deliberately absent — see lib/coffee-export.ts.     */

const ENQUIRE_EXPORT = "/enquire?sector=COFFEE&channel=export";
const ENQUIRE_SAMPLE = "/enquire?sector=COFFEE&channel=export&intent=sample";

export default function CoffeeExportSpec() {
  const t = useTranslations("coffeeExport");

  const terms: [string, string][] = [
    [t("termHsCode"), COFFEE_EXPORT.hsCode],
    [t("termOrigin"), t("originValue")],
    [t("termMoq"), t("moqValue", { tonnes: COFFEE_EXPORT.moqTonnes })],
    [t("termIncoterms"), COFFEE_EXPORT.incoterms],
    [t("termLoadingPort"), COFFEE_EXPORT.loadingPort],
    [t("termLeadTime"), t("leadTimeValue", { days: COFFEE_EXPORT.leadTimeDays })],
    [t("termPackaging"), t("packagingValue")],
    [t("termTrademark"), COFFEE_EXPORT.trademark],
  ];

  return (
    <Section tone="deep" id="coffee-export" aria-labelledby="coffee-export-heading">
      <Container>
        <SectionHead
          id="coffee-export-heading"
          label={t("eyebrow")}
          title={<>{t("titleLead")} {t("titleAccent")}</>}
          body={t("body")}
          className="mb-14"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* ── Price, with its caveat beside it ─────────────────────────── */}
          <div className="lg:col-span-5">
            <p className="t-label text-ink-muted">{t("priceEyebrow")}</p>
            <p className="font-display text-[clamp(2.5rem,1.8rem+2.4vw,3.75rem)] leading-none text-ink mt-4 [font-variant-numeric:lining-nums_tabular-nums]">
              {formatPriceBand()}
            </p>
            <p className="t-small text-gold-ink mt-3">{t("perUnit", { incoterms: COFFEE_PRICE_BAND.basis })}</p>
            <p className="t-small text-ink-soft mt-8 border-l-2 border-gold pl-5">{t("bulkCaveat")}</p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
              <ButtonLink href={ENQUIRE_EXPORT}>{t("ctaQuote")}</ButtonLink>
              <TextLink href={ENQUIRE_SAMPLE}>{t("ctaSample")}</TextLink>
            </div>
            <Text size="small" muted className="mt-5">{t("sampleNote")}</Text>
          </div>

          {/* ── Trade terms ──────────────────────────────────────────────── */}
          <div className="lg:col-span-6 lg:col-start-7">
            <h3 className="t-label text-ink-muted mb-4">{t("termsTitle")}</h3>
            <SpecTable rows={terms} />
          </div>
        </div>

        {/* ── Grades ─────────────────────────────────────────────────────── */}
        <div className="mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <h3 className="t-h3 text-ink">{t("gradesTitle")}</h3>
            <p className="t-small text-ink-muted max-w-[34rem]">{t("gradesBody")}</p>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-line border-y border-line">
            {COFFEE_GRADES.map((g) => (
              <li key={g.code} className="bg-paper-deep py-7 pr-5 sm:px-5 lg:first:pl-0">
                <p className="flex items-baseline gap-2">
                  <span className={`font-display text-[2.25rem] leading-none ${g.flagship ? "text-gold-ink" : "text-ink"}`}>{g.code}</span>
                  {g.flagship && <span className="t-label text-gold-ink">{t("gradeStandard")}</span>}
                </p>
                <p className="t-small text-ink-soft mt-3">{t(`grades.${g.code}`)}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Documentation ──────────────────────────────────────────────── */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <h3 className="t-h3 text-ink">{t("docsTitle")}</h3>
            <Text size="small" className="mt-3">{t("docsBody")}</Text>
          </div>
          <ul className="lg:col-span-6 lg:col-start-7 grid grid-cols-1 sm:grid-cols-2 border-t border-line-strong">
            {[t("docOrigin"), t("docGrading"), t("docPhyto"), t("docFoodSafety")].map((d) => (
              <li key={d} className="t-small text-ink py-4 border-b border-line sm:odd:pr-6">{d}</li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
