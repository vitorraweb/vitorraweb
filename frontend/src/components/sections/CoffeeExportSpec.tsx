import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight, Ship, FileText, Package, Beaker } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import {
  COFFEE_EXPORT,
  COFFEE_GRADES,
  COFFEE_PRICE_BAND,
  formatPriceBand,
} from "@/lib/coffee-export";

/* ─── Coffee — export trade specification ─────────────────────────────────────
   The figures an importer needs before they will start a conversation: grade,
   MOQ, HS code, incoterms, loading port, lead time and an indicative band.

   Mirrors FetPricing's motion — a real number is published, but every route out
   is an enquiry, never a cart. Bulk is explicitly excluded from the band
   because the trade listing excludes it, and a buyer who later discovers that
   has been misled.

   Server component: presentational only, no state or handlers.                */

const ENQUIRE_EXPORT = "/enquire?sector=COFFEE&channel=export";
const ENQUIRE_SAMPLE = "/enquire?sector=COFFEE&channel=export&intent=sample";

export default function CoffeeExportSpec() {
  const t = useTranslations("coffeeExport");

  /* The trade terms, as a two-column definition list. Production capacity is
     deliberately absent — see the note in lib/coffee-export.ts. */
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

  const documents = [
    t("docOrigin"),
    t("docGrading"),
    t("docPhyto"),
    t("docFoodSafety"),
  ];

  return (
    <section
      id="coffee-export"
      className="section-padding"
      style={{ backgroundColor: "#F8F7F5", scrollMarginTop: "96px" }}
    >
      <div className="container-max">

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <Reveal className="mb-12 lg:mb-16 max-w-2xl">
          <span className="eyebrow block mb-3">{t("eyebrow")}</span>
          <h2
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(28px, 3.5vw, 48px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              color: "#1E1E1E",
              maxWidth: "560px",
            }}
          >
            {t("titleLead")} <span style={{ color: "#7A6020" }}>{t("titleAccent")}</span>
          </h2>
          <p className="mt-5 max-w-lg" style={{ fontSize: "16px", lineHeight: 1.75, color: "#666666" }}>
            {t("body")}
          </p>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6 lg:gap-10 items-start">

          {/* ── Price card ─────────────────────────────────────────────────── */}
          <Reveal>
            <div
              className="rounded-[28px] p-8 lg:p-10 h-full"
              style={{
                background: "linear-gradient(150deg, #1E1E1E 0%, #141414 100%)",
                border: "1px solid rgba(197,178,122,0.22)",
                boxShadow: "0 18px 48px rgba(0,0,0,0.18)",
              }}
            >
              <span className="eyebrow-light mb-5 inline-flex">{t("priceEyebrow")}</span>

              <p
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(32px, 4vw, 46px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.05,
                  color: "#FFFFFF",
                }}
              >
                {formatPriceBand()}
              </p>
              <p className="mt-1.5" style={{ fontSize: "14px", color: "#C5B27A", fontWeight: 600 }}>
                {t("perUnit", { incoterms: COFFEE_PRICE_BAND.basis })}
              </p>

              {/* The bulk caveat sits with the price, never below the fold. A
                  buyer must not discover it only at quote stage. */}
              <p
                className="mt-6 rounded-2xl p-4"
                style={{
                  fontSize: "13px",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.62)",
                  background: "rgba(197,178,122,0.08)",
                  border: "1px solid rgba(197,178,122,0.16)",
                }}
              >
                {t("bulkCaveat")}
              </p>

              <div className="mt-7 flex flex-col gap-2.5">
                <Link href={ENQUIRE_EXPORT} className="btn-primary justify-center">
                  {t("ctaQuote")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href={ENQUIRE_SAMPLE} className="btn-ghost-dark justify-center">
                  <Beaker className="w-4 h-4" />
                  {t("ctaSample")}
                </Link>
              </div>
              <p className="mt-3 text-center" style={{ fontSize: "11.5px", color: "rgba(255,255,255,0.4)" }}>
                {t("sampleNote")}
              </p>
            </div>
          </Reveal>

          {/* ── Trade terms ────────────────────────────────────────────────── */}
          <Reveal delay={120}>
            <div
              className="rounded-[28px] p-8 lg:p-10"
              style={{
                background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                border: "1px solid rgba(197,178,122,0.16)",
                boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <span
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                >
                  <Ship className="w-5 h-5" />
                </span>
                <h3
                  style={{
                    fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                  }}
                >
                  {t("termsTitle")}
                </h3>
              </div>

              <dl className="border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                {terms.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-6 py-3 border-b"
                    style={{ borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <dt
                      className="text-[11px] font-bold uppercase tracking-[0.12em] shrink-0"
                      style={{ color: "#999999" }}
                    >
                      {k}
                    </dt>
                    <dd className="text-sm text-right font-medium" style={{ color: "#1E1E1E" }}>
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>

        {/* ── Grades ───────────────────────────────────────────────────────── */}
        <Reveal className="mt-10 lg:mt-14">
          <div className="flex items-center gap-3 mb-6">
            <span
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
            >
              <Package className="w-5 h-5" />
            </span>
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "22px",
                  fontWeight: 600,
                  color: "#1E1E1E",
                }}
              >
                {t("gradesTitle")}
              </h3>
              <p className="text-sm mt-0.5" style={{ color: "#777777" }}>{t("gradesBody")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {COFFEE_GRADES.map((g, i) => (
              <Reveal key={g.code} delay={i * 60}>
                <div
                  className="glow-card rounded-[22px] p-6 h-full"
                  style={{
                    background: g.flagship
                      ? "linear-gradient(145deg, #FFFFFF 0%, #F6F1E4 100%)"
                      : "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                    border: g.flagship
                      ? "1px solid rgba(197,178,122,0.45)"
                      : "1px solid rgba(197,178,122,0.14)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                  }}
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span
                      style={{
                        fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "30px",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: g.flagship ? "#7A6020" : "#1E1E1E",
                      }}
                    >
                      {g.code}
                    </span>
                    {g.flagship && (
                      <span
                        style={{
                          fontSize: "9.5px",
                          fontWeight: 700,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "#7A6020",
                        }}
                      >
                        {t("gradeStandard")}
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#666666" }}>
                    {t(`grades.${g.code}`)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        {/* ── Documentation ────────────────────────────────────────────────── */}
        <Reveal delay={80} className="mt-10 lg:mt-14">
          <div
            className="rounded-[28px] p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start"
            style={{
              background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
              border: "1px solid rgba(197,178,122,0.16)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
              >
                <FileText className="w-5 h-5" />
              </span>
              <div>
                <h3
                  style={{
                    fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "22px",
                    fontWeight: 600,
                    color: "#1E1E1E",
                  }}
                >
                  {t("docsTitle")}
                </h3>
                <p className="text-sm mt-1.5 leading-relaxed" style={{ color: "#666666" }}>
                  {t("docsBody")}
                </p>
              </div>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {documents.map((d) => (
                <li key={d} className="flex items-start gap-2.5 auth-cert">
                  <span
                    aria-hidden="true"
                    className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: "#C5B27A" }}
                  />
                  <span className="text-sm" style={{ color: "#454545" }}>{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

      </div>
    </section>
  );
}
