import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { Faq } from "@/components/ui/faq";
import FinalCTA from "@/components/sections/FinalCTA";
import FetCalculator from "@/components/sections/FetCalculator";
import FetPricing from "@/components/sections/FetPricing";
import {
  Fuel, Wrench, Leaf, LineChart,
  Truck, Boxes, Factory, Tractor, Bus, Ship,
  ArrowRight, ArrowUpRight,
  ShieldCheck, Award, Check, X,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.fet" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE = "/enquire?sector=FET";

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function FuelEcoTechPage() {
  const t = useTranslations("fetPage");

  const benefits = [
    { icon: Fuel,      title: t("benefit1Title"), body: t("benefit1Body") },
    { icon: Wrench,    title: t("benefit2Title"), body: t("benefit2Body") },
    { icon: Leaf,      title: t("benefit3Title"), body: t("benefit3Body") },
    { icon: LineChart, title: t("benefit4Title"), body: t("benefit4Body") },
  ];

  const withoutFet = [t("withoutFet1"), t("withoutFet2"), t("withoutFet3"), t("withoutFet4")];
  const withFet = [t("withFet1"), t("withFet2"), t("withFet3"), t("withFet4")];

  const steps = [
    { n: "01", title: t("step1Title"), body: t("step1Body") },
    { n: "02", title: t("step2Title"), body: t("step2Body") },
    { n: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  const testFindings = [t("finding1"), t("finding2"), t("finding3"), t("finding4")];

  const testMetrics = [
    { value: "3–5",  unit: t("metric1Unit"), label: t("metric1Label") },
    { value: "€900", unit: t("metric2Unit"), label: t("metric2Label") },
    { value: "0",    unit: t("metric3Unit"), label: t("metric3Label") },
  ];

  const noModPoints = [
    { title: t("noMod1Title"), body: t("noMod1Body") },
    { title: t("noMod2Title"), body: t("noMod2Body") },
    { title: t("noMod3Title"), body: t("noMod3Body") },
    { title: t("noMod4Title"), body: t("noMod4Body") },
  ];

  const audiences = [
    { icon: Truck,   label: t("audience1") },
    { icon: Boxes,   label: t("audience2") },
    { icon: Factory, label: t("audience3") },
    { icon: Tractor, label: t("audience4") },
    { icon: Bus,     label: t("audience5") },
    { icon: Ship,    label: t("audience6") },
  ];

  /* Cert codes are brand terms (kept literal); labels and bodies translate. */
  const certifications = [
    { code: "ISO 9001:2015",     label: t("cert1Label"), body: t("cert1Body") },
    { code: "ISO 14001:2015",    label: t("cert2Label"), body: t("cert2Body") },
    { code: "ISO 27001",         label: t("cert3Label"), body: t("cert3Body") },
    { code: "Zurich Insurance",  label: t("cert4Label"), body: t("cert4Body") },
    { code: "AVL Technologies",  label: t("cert5Label"), body: t("cert5Body") },
    { code: "qm-solutions GmbH", label: t("cert6Label"), body: t("cert6Body") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col"
          style={{ minHeight: "88vh", backgroundColor: "#111111" }}
        >
          <div className="absolute inset-0">
            <Image
              src="/products/fet/in-hand.png"
              alt="Fuel Eco Tech"
              fill priority sizes="100vw"
              className="object-cover"
              style={{ animation: "vitorra-ken-burns 16s ease-out both" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.22) 100%)" }}
            />
          </div>
          <div aria-hidden="true" className="hero-aurora-right" />
          <div aria-hidden="true" className="hero-grain" />

          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 mt-auto pt-28 pb-16 md:pb-24">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">
                {t("heroEyebrow")}
              </span>
              <h1
                className="max-w-2xl mb-5"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(40px, 5.5vw, 72px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.05,
                  color:         "#FFFFFF",
                }}
              >
                {t("heroTitleLead")}{" "}
                <span className="text-gold-gradient">{t("heroTitleAccent")}</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                {t("heroBody")}
              </p>

              <div className="flex flex-wrap gap-2 mb-9">
                {[t("heroPill1"), t("heroPill2"), t("heroPill3"), t("heroPill4")].map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
                      color: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: "999px", padding: "5px 14px",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 hero-cta">
                <Link href={ENQUIRE} className="btn-primary">
                  {t("heroCtaPrimary")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="btn-ghost-dark">
                  {t("heroCtaSecondary")}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BENEFITS ════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">{t("benefitsEyebrow")}</span>
              <h2
                className="gold-underline"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                  maxWidth:      "520px",
                }}
              >
                {t("benefitsTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((b, i) => (
                <Reveal key={b.title} delay={i * 80}>
                  <div
                    className="glow-card rounded-[24px] p-7 h-full"
                    style={{
                      background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                      border: "1px solid rgba(197,178,122,0.14)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                      style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                    >
                      <b.icon className="w-6 h-6" />
                    </span>
                    <h3
                      className="mb-2"
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E" }}
                    >
                      {b.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{b.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ BEFORE / AFTER ══════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#141414" }}
        >
          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />
          <div className="container-max relative z-10">
            <Reveal className="mb-12 text-center">
              <span className="eyebrow-light mb-3 inline-flex">{t("scienceEyebrow")}</span>
              <h2
                className="max-w-2xl mx-auto"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#FFFFFF",
                }}
              >
                {t("scienceTitle")}
              </h2>
              <p className="mt-5 max-w-xl mx-auto" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.48)" }}>
                {t("scienceBody")}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Reveal direction="right">
                <div
                  className="rounded-[28px] p-8 md:p-10 h-full"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex items-center gap-3 mb-7">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: "rgba(200,60,60,0.18)" }}>
                      <X className="w-4 h-4" style={{ color: "#E07070" }} />
                    </span>
                    <h3 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>
                      {t("withoutFetTitle")}
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {withoutFet.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <X className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#E07070" }} />
                        <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>

              <Reveal direction="left" delay={120}>
                <div
                  className="rounded-[28px] p-8 md:p-10 h-full"
                  style={{ background: "rgba(197,178,122,0.07)", border: "1px solid rgba(197,178,122,0.22)" }}
                >
                  <div className="flex items-center gap-3 mb-7">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0" style={{ background: "rgba(197,178,122,0.2)" }}>
                      <Check className="w-4 h-4" style={{ color: "#C5B27A" }} />
                    </span>
                    <h3 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#C5B27A" }}>
                      {t("withFetTitle")}
                    </h3>
                  </div>
                  <ul className="space-y-4">
                    {withFet.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#C5B27A" }} />
                        <span className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <ParallaxImage
                src="/products/fet/installed.png"
                alt="Fuel Eco Tech installed"
                className="aspect-[4/3] rounded-[40px] shadow-card"
              />
            </Reveal>
            <div>
              <Reveal>
                <span className="eyebrow block mb-3">{t("howEyebrow")}</span>
                <h2
                  className="mb-8"
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(26px, 3.2vw, 44px)",
                    fontWeight:    700,
                    letterSpacing: "-0.025em",
                    lineHeight:    1.1,
                    color:         "#1E1E1E",
                  }}
                >
                  {t("howTitleLine1")}<br />{t("howTitleLine2")}
                </h2>
              </Reveal>
              <div className="space-y-7">
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 90}>
                    <div className="flex items-start gap-5">
                      <span
                        style={{
                          fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                          fontSize:      "32px",
                          fontWeight:    700,
                          lineHeight:    1,
                          color:         "#D4C49A",
                          flexShrink:    0,
                        }}
                      >
                        {s.n}
                      </span>
                      <div>
                        <h3
                          className="mb-1.5"
                          style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "19px", fontWeight: 600, color: "#1E1E1E" }}
                        >
                          {s.title}
                        </h3>
                        <p className="text-sm leading-relaxed max-w-md" style={{ color: "#555555" }}>{s.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ PROVEN RESULTS — VW T5 / CTI GmbH ═══════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#0D0D0D" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 85% 20%, rgba(197,178,122,0.18) 0%, transparent 52%)," +
                "radial-gradient(ellipse at 5% 85%, rgba(197,178,122,0.07) 0%, transparent 45%)",
            }}
          />
          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.028 }} />

          <div className="container-max relative z-10">
            <Reveal className="mb-10">
              <span className="eyebrow-light mb-3 inline-flex">{t("resultsEyebrow")}</span>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10">
                <h2
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(28px, 3.5vw, 48px)",
                    fontWeight:    700,
                    letterSpacing: "-0.025em",
                    lineHeight:    1.1,
                    color:         "#FFFFFF",
                  }}
                >
                  {t("resultsTitle")}
                </h2>
                <p className="pb-1 max-w-sm" style={{ fontSize: "14px", lineHeight: 1.65, color: "rgba(255,255,255,0.4)" }}>
                  {t("resultsSubtitle")}
                </p>
              </div>
            </Reveal>

            <Reveal>
              <div
                className="relative overflow-hidden rounded-[28px] md:rounded-[36px]"
                style={{ backgroundColor: "#101010", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute", inset: 0, pointerEvents: "none",
                    background: "radial-gradient(ellipse at 88% 12%, rgba(197,178,122,0.14) 0%, transparent 48%)",
                  }}
                />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
                  <div className="flex flex-col justify-center p-8 md:p-12 lg:p-14">
                    <div
                      className="inline-flex items-center gap-2 mb-6 self-start px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(197,178,122,0.1)", border: "1px solid rgba(197,178,122,0.25)" }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#C5B27A" }}>
                        {t("reportBadge")}
                      </span>
                    </div>

                    <div
                      style={{
                        fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize:      "clamp(64px, 9vw, 112px)",
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
                        maxWidth:      "320px",
                        marginBottom:  "16px",
                      }}
                    >
                      {t("bigNumberCaption")}
                    </p>

                    <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.38)", maxWidth: "300px" }}>
                      {t("vehicleLine")}
                    </p>
                  </div>

                  <div
                    className="flex flex-col justify-center p-8 md:p-12 lg:p-14"
                    style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="mb-8">
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}>
                        {t("consumptionLabel")}
                      </p>

                      <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>{t("withoutFetBar")}</span>
                          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>11.52</span>
                        </div>
                        <div style={{ height: "10px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "88.6%", borderRadius: "999px", background: "rgba(255,255,255,0.2)" }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>{t("withFetBar")}</span>
                          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, color: "#C5B27A" }}>9.92</span>
                        </div>
                        <div style={{ height: "10px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "76.3%", borderRadius: "999px", background: "linear-gradient(90deg, #C5B27A, #D4C49A)" }} />
                        </div>
                      </div>

                      <div
                        className="mt-4 px-4 py-2 rounded-xl inline-flex"
                        style={{ background: "rgba(197,178,122,0.1)", border: "1px solid rgba(197,178,122,0.2)" }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#C5B27A" }}>
                          {t("savingCallout")}
                        </span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>
                        {t("findingsLabel")}
                      </p>
                      <ul className="space-y-2.5">
                        {testFindings.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#C5B27A" }} />
                            <span style={{ fontSize: "13px", lineHeight: 1.55, color: "rgba(255,255,255,0.5)" }}>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", lineHeight: 1.6 }}>
                        {t("attribution")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              {testMetrics.map((m, i) => (
                <Reveal key={m.label} delay={i * 80}>
                  <div
                    className="flex flex-col items-center text-center p-6 rounded-[20px]"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(197,178,122,0.14)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize:      "clamp(28px, 3.5vw, 40px)",
                        fontWeight:    700,
                        letterSpacing: "-0.035em",
                        lineHeight:    1,
                        color:         "#FFFFFF",
                      }}
                    >
                      {m.value}
                      <span style={{ color: "#C5B27A", fontSize: "0.65em" }}>{m.unit}</span>
                    </div>
                    <div className="mt-3" style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                      {m.label}
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SAVINGS CALCULATOR ══════════════════════════════════════════════ */}
        <FetCalculator />

        {/* ══ FULL LINE PRICING ═══════════════════════════════════════════════ */}
        <FetPricing />

        {/* ══ NO ENGINE MODIFICATION ══════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">{t("noModEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                  maxWidth:      "560px",
                }}
              >
                {t("noModTitle")}
              </h2>
              <p className="mt-5 max-w-xl" style={{ fontSize: "16px", lineHeight: 1.78, color: "#555555" }}>
                {t("noModBody")}
              </p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {noModPoints.map((pt, i) => (
                <Reveal key={pt.title} delay={i * 80}>
                  <div
                    className="glow-card rounded-[24px] p-7 h-full flex gap-5"
                    style={{
                      background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                      border: "1px solid rgba(197,178,122,0.14)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 mt-0.5"
                      style={{ background: "rgba(197,178,122,0.14)" }}
                    >
                      <ShieldCheck className="w-5 h-5" style={{ color: "#7A6020" }} />
                    </span>
                    <div>
                      <h3 className="mb-1.5" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>
                        {pt.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{pt.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ VIDEO SHOWCASE ══════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <Reveal className="container-max">
            <div
              className="card-stadium relative shadow-card"
              style={{ aspectRatio: "16/9", maxHeight: "70vh" }}
            >
              <video
                src="/videos/fet.mp4"
                poster="/videos/fet-poster.jpg"
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.1) 50%)" }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">{t("videoEyebrow")}</span>
                <p
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(22px, 3vw, 36px)",
                    fontWeight:    700,
                    color:         "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t("videoText")}
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ WHO IT'S FOR ════════════════════════════════════════════════════ */}
        <section className="section-padding-sm" style={{ backgroundColor: "#F2F2F2" }}>
          <div className="container-max text-center">
            <Reveal>
              <span className="eyebrow block mb-5">{t("audienceEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(26px, 3.2vw, 44px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                }}
              >
                <span style={{ color: "#1E1E1E" }}>{t("audienceTitleLead")}</span>
                <span style={{ color: "#AAAAAA" }}>{t("audienceTitleAccent")}</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="mt-8 flex flex-wrap justify-center gap-3">
              {audiences.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-full bg-white"
                  style={{ border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <a.icon className="w-4 h-4" style={{ color: "#C5B27A" }} />
                  <span className="text-sm font-medium" style={{ color: "#1E1E1E" }}>{a.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ══ CERTIFICATIONS ══════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#141414" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 80% 20%, rgba(197,178,122,0.12) 0%, transparent 50%)," +
                "radial-gradient(ellipse at 10% 80%, rgba(197,178,122,0.06) 0%, transparent 45%)",
            }}
          />
          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />

          <div className="container-max relative z-10">
            <Reveal className="mb-12 lg:mb-16">
              <span className="eyebrow-light mb-3 inline-flex">{t("certsEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#FFFFFF",
                  maxWidth:      "560px",
                }}
              >
                {t("certsTitleLead")}{" "}
                <span style={{ color: "#C5B27A" }}>{t("certsTitleAccent")}</span>
              </h2>
              <p className="mt-5 max-w-lg" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
                {t("certsBody")}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certifications.map((c, i) => (
                <Reveal key={c.code} delay={i * 70}>
                  <div
                    className="rounded-[24px] p-7 h-full"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                        style={{ background: "rgba(197,178,122,0.15)" }}
                      >
                        <Award className="w-4 h-4" style={{ color: "#C5B27A" }} />
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C5B27A" }}>
                        {c.label}
                      </span>
                    </div>
                    <p
                      className="font-semibold mb-2"
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "17px", color: "#FFFFFF" }}
                    >
                      {c.code}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.42)" }}>{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-10 text-center">
              <Link href="/trust/certifications" className="btn-ghost-dark inline-flex">
                {t("certsViewAll")}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
            <Reveal>
              <span className="eyebrow block mb-3">{t("faqEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(26px, 3vw, 42px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                  maxWidth:      "320px",
                }}
              >
                {t("faqTitle")}
              </h2>
              <p className="mt-5 text-sm" style={{ color: "#666666" }}>
                {t("faqCantFind")}{" "}
                <Link href="/contact" className="font-semibold underline" style={{ color: "#1E1E1E" }}>
                  {t("faqTalkToTeam")}
                </Link>
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <FinalCTA
          titleLead={t("finalCtaTitleLead")}
          titleAccent={t("finalCtaTitleAccent")}
          body={t("finalCtaBody")}
          primaryLabel={t("heroCtaPrimary")}
          primaryHref={ENQUIRE}
          caption={t("finalCtaCaption")}
        />

      </main>
      <Footer />
    </>
  );
}
