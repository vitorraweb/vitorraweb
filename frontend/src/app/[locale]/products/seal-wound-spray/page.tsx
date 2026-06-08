import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { Faq } from "@/components/ui/faq";
import {
  Droplets, ShieldCheck, PackageCheck, Snowflake,
  Backpack, Siren, Dog,
  Building2, Ambulance, Shield, Flame, Stethoscope,
  Award, Activity, FlaskConical, Factory, AlertTriangle,
  ArrowRight, ArrowUpRight,
} from "lucide-react";

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

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SealWoundSprayPage() {
  const t = useTranslations("sealPage");

  const benefits = [
    { icon: Droplets,     title: t("benefit1Title"), body: t("benefit1Body") },
    { icon: ShieldCheck,  title: t("benefit2Title"), body: t("benefit2Body") },
    { icon: PackageCheck, title: t("benefit3Title"), body: t("benefit3Body") },
    { icon: Snowflake,    title: t("benefit4Title"), body: t("benefit4Body") },
  ];

  const steps = [
    { n: "01", title: t("step1Title"), body: t("step1Body") },
    { n: "02", title: t("step2Title"), body: t("step2Body") },
    { n: "03", title: t("step3Title"), body: t("step3Body") },
    { n: "04", title: t("step4Title"), body: t("step4Body") },
  ];

  /* Product names are brand terms (kept literal). */
  const variants = [
    { icon: Backpack, name: "SEAL OTC", tagline: t("v1Tagline"), body: t("v1Body"),
      specs: [t("v1Spec1"), t("v1Spec2"), t("v1Spec3"), t("v1Spec4"), t("v1Spec5")] },
    { icon: Siren, name: "SEAL PRO", tagline: t("v2Tagline"), body: t("v2Body"),
      specs: [t("v2Spec1"), t("v2Spec2"), t("v2Spec3"), t("v2Spec4"), t("v2Spec5")], featured: true },
    { icon: Dog, name: "HemoSEAL Pet", tagline: t("v3Tagline"), body: t("v3Body"),
      specs: [t("v3Spec1"), t("v3Spec2"), t("v3Spec3"), t("v3Spec4"), t("v3Spec5")] },
  ];

  const trust = [
    { icon: Award,        label: t("trust1Label"), body: t("trust1Body") },
    { icon: Ambulance,    label: t("trust2Label"), body: t("trust2Body") },
    { icon: Activity,     label: t("trust3Label"), body: t("trust3Body") },
    { icon: Snowflake,    label: t("trust4Label"), body: t("trust4Body") },
    { icon: FlaskConical, label: t("trust5Label"), body: t("trust5Body") },
    { icon: Factory,      label: t("trust6Label"), body: t("trust6Body") },
  ];

  const specs: [string, string][] = [
    [t("spec1Key"), t("spec1Value")],
    [t("spec2Key"), t("spec2Value")],
    [t("spec3Key"), t("spec3Value")],
    [t("spec4Key"), t("spec4Value")],
    [t("spec5Key"), t("spec5Value")],
    [t("spec6Key"), t("spec6Value")],
  ];

  const safety = [t("safety1"), t("safety2"), t("safety3")];

  const audiences = [
    { icon: Ambulance,   label: t("audience1") },
    { icon: Shield,      label: t("audience2") },
    { icon: Flame,       label: t("audience3") },
    { icon: Building2,   label: t("audience4") },
    { icon: Stethoscope, label: t("audience5") },
    { icon: Dog,         label: t("audience6") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
    { q: t("faq6Q"), a: t("faq6A") },
    { q: t("faq7Q"), a: t("faq7A") },
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
              src="/hero/seal.png"
              alt="SEAL wound spray"
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
              <span className="eyebrow-light mb-5 inline-flex">{t("heroEyebrow")}</span>
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

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <ParallaxImage
                src="/products/seal/in-hand.png"
                alt="SEAL wound spray in hand"
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
                  {t("howTitle")}
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

        {/* ══ PRODUCT RANGE ═══════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 max-w-2xl">
              <span className="eyebrow block mb-3">{t("rangeEyebrow")}</span>
              <h2
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
                {t("rangeTitle")}
              </h2>
              <p className="mt-5" style={{ fontSize: "16px", lineHeight: 1.75, color: "#555555", maxWidth: "560px" }}>
                {t("rangeBody")}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {variants.map((v, i) => (
                <Reveal key={v.name} delay={i * 90}>
                  <div
                    className="flex flex-col h-full rounded-[24px] p-7"
                    style={{
                      background: v.featured ? "#141414" : "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                      border: v.featured ? "1px solid rgba(197,178,122,0.3)" : "1px solid rgba(197,178,122,0.14)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-5">
                      <span
                        className="flex items-center justify-center w-12 h-12 rounded-2xl"
                        style={{ background: v.featured ? "rgba(197,178,122,0.18)" : "rgba(197,178,122,0.14)", color: "#C5B27A" }}
                      >
                        <v.icon className="w-6 h-6" />
                      </span>
                      {v.featured && (
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C5B27A" }}>
                          {t("mostCapable")}
                        </span>
                      )}
                    </div>
                    <h3
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "24px", fontWeight: 600, color: v.featured ? "#FFFFFF" : "#1E1E1E" }}
                    >
                      {v.name}
                    </h3>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] mt-1 mb-3" style={{ color: "#C5B27A" }}>
                      {v.tagline}
                    </p>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: v.featured ? "rgba(255,255,255,0.6)" : "#555555" }}>
                      {v.body}
                    </p>
                    <ul className="mt-auto space-y-2 pt-4" style={{ borderTop: v.featured ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.06)" }}>
                      {v.specs.map((s) => (
                        <li key={s} className="flex items-center gap-2 text-xs" style={{ color: v.featured ? "rgba(255,255,255,0.7)" : "#555555" }}>
                          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "#C5B27A" }} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-6">
              <p className="text-xs" style={{ color: "#999999" }}>
                {t("rangeFootText")}{" "}
                <Link href={ENQUIRE} className="font-semibold underline" style={{ color: "#7A6020" }}>{t("rangeFootLink")}</Link>{t("rangeFootSuffix")}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ MEDIA BAND ══════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <Reveal className="container-max">
            <div className="card-stadium relative shadow-card" style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
              <Image
                src="/products/seal/trauma-tray.png"
                alt="SEAL wound spray on a trauma tray"
                fill sizes="100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.1) 55%)" }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">{t("mediaEyebrow")}</span>
                <p
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(22px, 3vw, 36px)",
                    fontWeight:    700,
                    color:         "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t("mediaText")}
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ TESTED · TRUSTED · APPROVED ═════════════════════════════════════ */}
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
              <span className="eyebrow-light mb-3 inline-flex">{t("trustEyebrow")}</span>
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
                {t("trustTitleLead")}{" "}
                <span style={{ color: "#C5B27A" }}>{t("trustTitleAccent")}</span>
              </h2>
              <p className="mt-5 max-w-lg" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
                {t("trustBody")}
              </p>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trust.map((c, i) => (
                <Reveal key={c.label} delay={i * 70}>
                  <div
                    className="rounded-[24px] p-7 h-full"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0"
                        style={{ background: "rgba(197,178,122,0.15)" }}
                      >
                        <c.icon className="w-4 h-4" style={{ color: "#C5B27A" }} />
                      </span>
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C5B27A" }}>
                        {c.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{c.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SPECIFICATIONS + SAFETY ═════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            <Reveal>
              <span className="eyebrow block mb-3">{t("specsEyebrow")}</span>
              <h2
                className="mb-7"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(24px, 3vw, 38px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                }}
              >
                {t("specsTitle")}
              </h2>
              <dl className="border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                {specs.map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-6 py-3.5 border-b"
                    style={{ borderColor: "rgba(0,0,0,0.08)" }}
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-[0.12em] shrink-0" style={{ color: "#999999" }}>{k}</dt>
                    <dd className="text-sm text-right font-medium" style={{ color: "#1E1E1E" }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={120}>
              <span className="eyebrow block mb-3">{t("safetyEyebrow")}</span>
              <h2
                className="mb-7"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(24px, 3vw, 38px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                }}
              >
                {t("safetyTitle")}
              </h2>
              <ul className="space-y-5">
                {safety.map((s) => (
                  <li key={s} className="flex items-start gap-3.5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5" style={{ background: "rgba(197,178,122,0.14)" }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: "#7A6020" }} />
                    </span>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{s}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-7 text-xs leading-relaxed" style={{ color: "#999999" }}>
                {t("safetyFoot")}
              </p>
            </Reveal>
          </div>
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
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#1E1E1E", whiteSpace: "nowrap" }}>{a.label}</span>
                </div>
              ))}
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
