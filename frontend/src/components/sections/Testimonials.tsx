import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/reveal";
import { ShieldCheck } from "lucide-react";

/* ─── Proven Results — field test data section ────────────────────────────────
   Source: Official test report — FET-Test-Report-VW-T5
   Vehicle: VW T5, Landesbaubehörde Stadthagen (Hannover), Germany
   Period:  January – October 2025
   Verified by: CTI GmbH, Lippstadt — signed Holger Walprecht, 10.11.2025

   All figures are drawn directly from the signed test report.
   No data has been altered or estimated.
   ─────────────────────────────────────────────────────────────────────────── */

export default function Testimonials() {
  const t = useTranslations("testimonials");

  const KEY_FINDINGS = [t("finding1"), t("finding2"), t("finding3"), t("finding4")];

  /* Values are figures from the signed report (literal); units/labels translate. */
  const SUPPORT_METRICS = [
    { value: "3–5",  unit: t("metric1Unit"), label: t("metric1Label") },
    { value: "€900", unit: t("metric2Unit"), label: t("metric2Label") },
    { value: "0",    unit: t("metric3Unit"), label: t("metric3Label") },
  ];

  return (
    <section
      className="section-padding relative overflow-hidden"
      style={{
        backgroundColor: "#FFFFFF",
        boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)",
      }}
    >
      <div className="container-max">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Reveal className="mb-10 md:mb-12">
          <span className="eyebrow block mb-3">{t("eyebrow")}</span>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10">
            <h2
              style={{
                fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                fontSize:      "clamp(28px, 3.5vw, 48px)",
                fontWeight:    700,
                letterSpacing: "-0.025em",
                lineHeight:    1.1,
                color:         "#1E1E1E",
              }}
            >
              {t("title")}
            </h2>
            <p
              className="pb-1 max-w-sm"
              style={{ fontSize: "14px", lineHeight: 1.65, color: "#888888" }}
            >
              {t("subtitle")}
            </p>
          </div>
        </Reveal>

        {/* ── Featured case study card ─────────────────────────────────────
            Dark premium card with the actual VW T5 test data.
            Before/after bars are pure CSS — no JS required.
        ──────────────────────────────────────────────────────────────────── */}
        <Reveal>
          <div
            className="relative overflow-hidden rounded-[28px] md:rounded-[36px]"
            style={{ backgroundColor: "#101010" }}
          >
            {/* Subtle gold aurora */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background:
                  "radial-gradient(ellipse at 85% 15%, rgba(197,178,122,0.15) 0%, transparent 50%)," +
                  "radial-gradient(ellipse at 5% 90%, rgba(197,178,122,0.06) 0%, transparent 45%)",
              }}
            />
            {/* Grain */}
            <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">

              {/* ── Left: headline stat ─────────────────────────────────── */}
              <div className="flex flex-col justify-center p-8 md:p-12 lg:p-14">
                {/* Report source badge */}
                <div
                  className="inline-flex items-center gap-2 mb-6 self-start px-3 py-1.5 rounded-full"
                  style={{
                    background: "rgba(197,178,122,0.1)",
                    border: "1px solid rgba(197,178,122,0.25)",
                  }}
                >
                  <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#C5B27A" }} />
                  <span
                    style={{
                      fontSize: "10px", fontWeight: 700,
                      letterSpacing: "0.07em", textTransform: "uppercase",
                      color: "#C5B27A",
                    }}
                  >
                    {t("reportBadge")}
                  </span>
                </div>

                {/* The big number */}
                <div
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(64px, 9vw, 110px)",
                    fontWeight:    700,
                    letterSpacing: "-0.05em",
                    lineHeight:    0.9,
                    color:         "#C5B27A",
                    marginBottom:  "16px",
                  }}
                >
                  13.9%
                </div>

                <p
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(18px, 2.2vw, 26px)",
                    fontWeight:    600,
                    letterSpacing: "-0.015em",
                    lineHeight:    1.3,
                    color:         "#FFFFFF",
                    maxWidth:      "340px",
                    marginBottom:  "20px",
                  }}
                >
                  {t("bigNumberCaption")}
                </p>

                <p
                  style={{
                    fontSize:   "13px",
                    lineHeight: 1.65,
                    color:      "rgba(255,255,255,0.42)",
                    maxWidth:   "320px",
                  }}
                >
                  {t("vehicleLine")}
                </p>
              </div>

              {/* ── Right: data + findings ──────────────────────────────── */}
              <div
                className="flex flex-col justify-center p-8 md:p-12 lg:p-14"
                style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Before / after bar chart */}
                <div className="mb-8">
                  <p
                    className="mb-5"
                    style={{
                      fontSize: "11px", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {t("consumptionLabel")}
                  </p>

                  {/* Without FET */}
                  <div className="mb-4">
                    <div className="flex justify-between items-baseline mb-2">
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>
                        {t("withoutFet")}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-playfair, Georgia, serif)",
                          fontSize: "18px", fontWeight: 700,
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        11.52
                      </span>
                    </div>
                    <div
                      style={{
                        height: "10px", borderRadius: "999px",
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          /* 11.52 / 13 = 88.6% */
                          width: "88.6%",
                          borderRadius: "999px",
                          background: "rgba(255,255,255,0.22)",
                        }}
                      />
                    </div>
                  </div>

                  {/* With FET */}
                  <div>
                    <div className="flex justify-between items-baseline mb-2">
                      <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                        {t("withFet")}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-playfair, Georgia, serif)",
                          fontSize: "18px", fontWeight: 700,
                          color: "#C5B27A",
                        }}
                      >
                        9.92
                      </span>
                    </div>
                    <div
                      style={{
                        height: "10px", borderRadius: "999px",
                        background: "rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          /* 9.92 / 13 = 76.3% */
                          width: "76.3%",
                          borderRadius: "999px",
                          background: "linear-gradient(90deg, #C5B27A, #D4C49A)",
                        }}
                      />
                    </div>
                  </div>

                  {/* Saving callout */}
                  <div
                    className="flex items-center gap-2 mt-4 px-4 py-2 rounded-xl self-start inline-flex"
                    style={{
                      background: "rgba(197,178,122,0.1)",
                      border: "1px solid rgba(197,178,122,0.2)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px", fontWeight: 700,
                        color: "#C5B27A",
                      }}
                    >
                      {t("savingCallout")}
                    </span>
                  </div>
                </div>

                {/* Key findings */}
                <div className="mb-8">
                  <p
                    className="mb-3"
                    style={{
                      fontSize: "11px", fontWeight: 700,
                      letterSpacing: "0.08em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {t("findingsLabel")}
                  </p>
                  <ul className="space-y-2.5">
                    {KEY_FINDINGS.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <ShieldCheck
                          className="w-3.5 h-3.5 mt-0.5 flex-shrink-0"
                          style={{ color: "#C5B27A" }}
                        />
                        <span style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Attribution */}
                <div
                  className="pt-5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                    {t("attribution")}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </Reveal>

        {/* ── Supporting metric chips ──────────────────────────────────────
            Three key business numbers from the report's financial analysis.
        ──────────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {SUPPORT_METRICS.map((m, i) => (
            <Reveal key={m.label} delay={i * 80}>
              <div
                className="flex flex-col items-center text-center p-6 rounded-[20px]"
                style={{
                  background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                  border: "1px solid rgba(197,178,122,0.15)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(28px, 3.5vw, 40px)",
                    fontWeight:    700,
                    letterSpacing: "-0.035em",
                    lineHeight:    1,
                    color:         "#1E1E1E",
                  }}
                >
                  {m.value}
                  <span style={{ color: "#C5B27A", fontSize: "0.65em" }}>{m.unit}</span>
                </div>
                <div
                  className="mt-3"
                  style={{
                    fontSize:      "11px",
                    fontWeight:    600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color:         "#888888",
                  }}
                >
                  {m.label}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

      </div>
    </section>
  );
}
