import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import TrustMarquee from "@/components/sections/TrustMarquee";
import StatsBand from "@/components/sections/StatsBand";
import Testimonials from "@/components/sections/Testimonials";
import BlogPreview from "@/components/sections/BlogPreview";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import TeamTeaser from "@/components/sections/TeamTeaser";
import Certifications from "@/components/sections/Certifications";
import FinalCTA from "@/components/sections/FinalCTA";
import {
  ArrowRight, ArrowUpRight, ShieldCheck,
  Truck, Tractor, Bus, Ship, Factory, Building2,
} from "lucide-react";

/* ─── Metadata ──────────────────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.home" });
  return { title: { absolute: t("title") }, description: t("description") };
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const t = useTranslations("home");
  const tp = useTranslations("products");

  /* Certification codes are brand terms (kept literal); labels translate. */
  const certBadges = [
    { code: "ISO 9001:2015",    label: t("authority.qualityManagement")   },
    { code: "ISO 14001:2015",   label: t("authority.environmental")        },
    { code: "ISO 27001",        label: t("authority.informationSecurity")  },
    { code: "AVL Technologies", label: t("authority.labValidated")         },
    { code: "Zurich Insurance", label: t("authority.productLiability")     },
    { code: "qm-solutions",     label: t("authority.germanCertified")      },
  ];

  const fetProofPoints = [t("fet.proof1"), t("fet.proof2"), t("fet.proof3")];

  const otherProducts = [
    {
      label:       tp("seal.name"),
      badge:       t("suite.sealBadge"),
      image:       "/products/seal/trauma-tray.png",
      tagline:     t("suite.sealTagline"),
      description: t("suite.sealDescription"),
      href:        "/products/seal-wound-spray",
      cta:         t("suite.sealCta"),
    },
    {
      label:       tp("coffee.name"),
      badge:       t("suite.coffeeBadge"),
      image:       "/products/coffee/lifestyle.png",
      tagline:     t("suite.coffeeTagline"),
      description: t("suite.coffeeDescription"),
      href:        "/products/coffee",
      cta:         t("suite.coffeeCta"),
    },
    {
      label:       tp("logistics.name"),
      badge:       t("suite.logisticsBadge"),
      image:       "/products/logistics/truck-day.png",
      tagline:     t("suite.logisticsTagline"),
      description: t("suite.logisticsDescription"),
      href:        "/products/logistics",
      cta:         t("suite.logisticsCta"),
    },
  ];

  const sectors = [
    { icon: Truck,     label: t("sectors.fleetOperators")  },
    { icon: Tractor,   label: t("sectors.agriculture")     },
    { icon: Bus,       label: t("sectors.publicTransport") },
    { icon: Factory,   label: t("sectors.construction")    },
    { icon: Ship,      label: t("sectors.marine")          },
    { icon: Building2, label: t("sectors.healthcareNgos")  },
  ];

  const whyPoints = [
    { headline: t("why.point1Headline"), body: t("why.point1Body") },
    { headline: t("why.point2Headline"), body: t("why.point2Body") },
    { headline: t("why.point3Headline"), body: t("why.point3Body") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══════════════════════════════════════════════════════════════════
            1. HERO  —  dark · aurora · grain
        ══════════════════════════════════════════════════════════════════ */}
        <Hero />

        {/* ══════════════════════════════════════════════════════════════════
            2. TRUST MARQUEE  —  gold strip
        ══════════════════════════════════════════════════════════════════ */}
        <TrustMarquee />

        {/* ══════════════════════════════════════════════════════════════════
            3. AUTHORITY  —  compact split panel · dark left / warm right
            Option B: earn trust BEFORE showing the product.
            Dark editorial statement left; certification evidence right.
            Tight, no wasted space — authority sections should be confident,
            not padded.
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden"
          style={{ boxShadow: "inset 0 1px 0 rgba(0,0,0,0.07), inset 0 -1px 0 rgba(0,0,0,0.07)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2">

            {/* ── LEFT: light editorial panel ──────────────────────────────── */}
            <div
              className="relative overflow-hidden flex flex-col justify-center px-8 md:px-14 lg:px-16 py-14 md:py-16"
              style={{
                /* Warm directional gradient — white core, ivory edge */
                background:  "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                minHeight:   "300px",
              }}
            >
              {/* Very faint concentric rings — depth on light surface */}
              <div
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
              >
                {[220, 380, 540].map((d) => (
                  <div
                    key={d}
                    className="absolute rounded-full"
                    style={{ width: d, height: d, border: "1px solid rgba(197,178,122,0.07)" }}
                  />
                ))}
              </div>

              {/* Single corner bracket — top-left */}
              <svg
                aria-hidden="true"
                className="absolute top-6 left-6 pointer-events-none"
                width={44} height={44} fill="none"
              >
                <path
                  d="M44 2 L2 2 L2 44"
                  stroke="rgba(197,178,122,0.55)"
                  strokeWidth="1.5"
                  strokeLinecap="square"
                />
              </svg>

              <Reveal>
                {/* Large "6" — gold on white, establishes scale immediately */}
                <div
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(52px, 6vw, 80px)",
                    fontWeight:    700,
                    letterSpacing: "-0.04em",
                    lineHeight:    1,
                    color:         "#C5B27A",
                    marginBottom:  8,
                  }}
                >
                  6
                </div>

                {/* Eyebrow — charcoal + gold dot (correct for light bg) */}
                <span className="eyebrow mb-4 inline-flex">
                  {t("authority.eyebrow")}
                </span>

                <h2
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(26px, 2.8vw, 40px)",
                    fontWeight:    700,
                    letterSpacing: "-0.02em",
                    lineHeight:    1.15,
                    color:         "#1E1E1E",
                    maxWidth:      "380px",
                  }}
                >
                  {t("authority.titleLead")}{" "}
                  <span className="text-gold-gradient">{t("authority.titleAccent")}</span>
                </h2>

                <p
                  className="mt-4"
                  style={{
                    fontSize:   "14px",
                    lineHeight: 1.72,
                    color:      "#777777",
                    maxWidth:   "340px",
                  }}
                >
                  {t("authority.body")}
                </p>

                <Link
                  href="/trust/certifications"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold group"
                  style={{ color: "#7A6020" }}
                >
                  {t("authority.cta")}
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Reveal>
            </div>

            {/* ── RIGHT: warm certification list ───────────────────────────── */}
            <div
              className="flex flex-col justify-center px-8 md:px-14 lg:px-16 py-14 md:py-16"
              style={{
                backgroundColor: "#FAFAF8",
                borderLeft:      "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Reveal className="mb-5">
                <span className="eyebrow block">{t("authority.verifiedBy")}</span>
              </Reveal>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-0.5">
                {certBadges.map((c, i) => (
                  <Reveal key={c.code} delay={i * 55}>
                    <div
                      className="auth-cert flex items-start gap-3 px-3 py-3.5"
                    >
                      {/* Gold dot */}
                      <div
                        style={{
                          width:           5,
                          height:          5,
                          borderRadius:    "50%",
                          backgroundColor: "#C5B27A",
                          marginTop:       7,
                          flexShrink:      0,
                        }}
                      />
                      <div>
                        {/* Cert name */}
                        <div
                          style={{
                            fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                            fontSize:   "15px",
                            fontWeight: 600,
                            color:      "#1E1E1E",
                            lineHeight: 1.3,
                          }}
                        >
                          {c.code}
                        </div>
                        {/* Category label */}
                        <div
                          style={{
                            fontSize:      "11px",
                            fontWeight:    500,
                            color:         "#AAAAAA",
                            marginTop:     2,
                            letterSpacing: "0.02em",
                          }}
                        >
                          {c.label}
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Subtle separator + note */}
              <Reveal delay={360}>
                <div
                  className="mt-5 pt-5 flex items-center gap-3"
                  style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <div
                    style={{
                      width:           8,
                      height:          8,
                      borderRadius:    "50%",
                      backgroundColor: "#C5B27A",
                      flexShrink:      0,
                    }}
                  />
                  <p style={{ fontSize: "12px", color: "#AAAAAA", lineHeight: 1.55 }}>
                    {t("authority.footnote")}
                  </p>
                </div>
              </Reveal>
            </div>

          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            4. FET SPOTLIGHT  —  dark · gold aurora
            Now seen AFTER the trust is established — the visitor already
            knows FET is certified before they read the product pitch.
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#121212" }}
        >
          {/* Gold aurora */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at 80% 35%, rgba(197,178,122,0.22) 0%, transparent 50%)," +
                "radial-gradient(ellipse at 10% 90%, rgba(197,178,122,0.08) 0%, transparent 45%)",
            }}
          />
          <div aria-hidden="true" className="hero-grain" />

          <div className="container-max relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Left: content */}
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">
                {t("fet.eyebrow")}
              </span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(38px, 5vw, 68px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.06,
                  color:         "#FFFFFF",
                  maxWidth:      "520px",
                }}
              >
                {t("fet.titleLead")}{" "}
                <span className="text-gold-gradient">{t("fet.titleAccent")}</span>
              </h2>

              <p
                className="mt-6 mb-8 max-w-[440px]"
                style={{ fontSize: "16px", lineHeight: 1.8, color: "rgba(255,255,255,0.55)" }}
              >
                {t("fet.body")}
              </p>

              <ul className="flex flex-col gap-3.5 mb-10">
                {fetProofPoints.map((pt) => (
                  <li key={pt} className="flex items-start gap-3">
                    <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#C5B27A" }} />
                    <span style={{ fontSize: "14px", lineHeight: 1.65, color: "rgba(255,255,255,0.60)" }}>
                      {pt}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Quick-fact pills */}
              <div className="flex flex-wrap gap-2 mb-10">
                {[t("fet.pill1"), t("fet.pill2"), t("fet.pill3")].map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize:      "11px",
                      fontWeight:    600,
                      letterSpacing: "0.04em",
                      color:         "rgba(255,255,255,0.5)",
                      border:        "1px solid rgba(255,255,255,0.12)",
                      borderRadius:  "999px",
                      padding:       "5px 14px",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/enquire?sector=FET" className="btn-primary">
                  {t("fet.ctaPrimary")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/products/fuel-eco-tech" className="btn-ghost-dark">
                  {t("fet.ctaSecondary")}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            {/* Right: floating product image */}
            <Reveal direction="left" delay={150}>
              <div className="relative float-element">
                <div
                  className="rounded-[40px] overflow-hidden"
                  style={{
                    border:     "1px solid rgba(255,255,255,0.09)",
                    boxShadow:  "0 48px 96px rgba(0,0,0,0.55)",
                  }}
                >
                  <ParallaxImage
                    src="/products/fet/in-hand.png"
                    alt="Fuel Eco Tech device — installed on a commercial engine"
                    className="aspect-[4/3]"
                  />
                </div>

                {/* Floating badge — bottom-left */}
                <div
                  className="absolute -bottom-5 -left-4 md:-bottom-6 md:-left-6 bg-white rounded-[18px] px-4 py-3"
                  style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.18)" }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#7A6020", marginBottom: "2px" }}>
                    {t("fet.badgeAvlLabel")}
                  </div>
                  <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "15px", fontWeight: 600, color: "#1E1E1E" }}>
                    {t("fet.badgeAvlValue")}
                  </div>
                </div>

                {/* Floating badge — top-right */}
                <div
                  className="absolute -top-4 -right-3 md:-top-5 md:-right-4 bg-white rounded-[16px] px-4 py-2.5"
                  style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.14)" }}
                >
                  <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#7A6020", marginBottom: "2px" }}>
                    {t("fet.badgeCertified")}
                  </div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E1E1E" }}>
                    ISO 9001 · 14001 · 27001
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            5. PRODUCT SUITE  —  white
            Three product cards. White after dark FET = breathing room.
        ══════════════════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16">
              <span className="eyebrow block mb-3">{t("suite.eyebrow")}</span>
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10">
                <h2
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(30px, 3.5vw, 48px)",
                    fontWeight:    700,
                    letterSpacing: "-0.025em",
                    lineHeight:    1.1,
                    color:         "#1E1E1E",
                  }}
                >
                  {t("suite.title")}
                </h2>
                <Link
                  href="/enquire"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 pb-1"
                  style={{ color: "#7A6020" }}
                >
                  {t("suite.cta")}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {otherProducts.map((p, i) => (
                <Reveal key={p.label} delay={i * 80}>
                  <Link
                    href={p.href}
                    className="group block rounded-[28px] overflow-hidden h-full glow-card"
                    style={{ backgroundColor: "#FAFAF8", border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                      <Image
                        src={p.image}
                        alt={p.label}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 50%)" }}
                      />
                      <span
                        className="absolute top-4 left-4"
                        style={{
                          fontSize:       "10px",
                          fontWeight:     700,
                          letterSpacing:  "0.06em",
                          textTransform:  "uppercase",
                          color:          "#1E1E1E",
                          background:     "rgba(255,255,255,0.9)",
                          backdropFilter: "blur(8px)",
                          borderRadius:   "999px",
                          padding:        "4px 12px",
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>
                    <div className="p-6 lg:p-7">
                      <h3
                        className="mb-1"
                        style={{
                          fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                          fontSize:      "22px",
                          fontWeight:    600,
                          letterSpacing: "-0.01em",
                          color:         "#1E1E1E",
                        }}
                      >
                        {p.label}
                      </h3>
                      <p className="mb-3" style={{ fontSize: "13px", fontWeight: 600, color: "#7A6020" }}>
                        {p.tagline}
                      </p>
                      <p className="mb-6" style={{ fontSize: "13px", lineHeight: 1.7, color: "#666666" }}>
                        {p.description}
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                        {p.cta}
                        <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            6. TESTIMONIALS  —  white · client quotes
            Placed after products so visitors see the range THEN hear from
            real clients who use those products. Social proof confirms belief
            already forming — not trying to create it from scratch.
        ══════════════════════════════════════════════════════════════════ */}
        <Testimonials />

        {/* ══════════════════════════════════════════════════════════════════
            7. STATS BAND  —  warm ivory · count-up + scramble
            Stats land HERE — after the visitor has seen the certifications
            and the products. Numbers now CONFIRM belief, not try to CREATE
            it. See StatsBand.tsx.
        ══════════════════════════════════════════════════════════════════ */}
        <StatsBand />

        {/* ══════════════════════════════════════════════════════════════════
            7. SECTORS STRIP  —  ivory · centered
        ══════════════════════════════════════════════════════════════════ */}
        <section className="section-padding-sm" style={{ backgroundColor: "#F2F2F2" }}>
          <div className="container-max text-center">
            <Reveal>
              <span className="eyebrow block mb-5">{t("sectors.eyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.8vw, 52px)",
                  fontWeight:    700,
                  letterSpacing: "-0.02em",
                  lineHeight:    1.15,
                }}
              >
                <span style={{ color: "#1E1E1E" }}>{t("sectors.titleLead")}</span>
                <span style={{ color: "#AAAAAA" }}>{t("sectors.titleAccent")}</span>
              </h2>
            </Reveal>

            <Reveal delay={120} className="mt-10 flex flex-wrap justify-center gap-3">
              {sectors.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-5 py-3 rounded-full bg-white"
                  style={{ border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <s.icon className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#1E1E1E", whiteSpace: "nowrap" }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            8. WHY VITORRA  —  dark · 3-panel glass grid + arc vectors
        ══════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#141414" }}
        >
          {/* Semi-circle arcs rising from bottom */}
          <div
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          >
            {[180, 340, 520, 700, 900].map((d) => (
              <div
                key={d}
                className="absolute"
                style={{
                  width:         d,
                  height:        d / 2,
                  bottom:        0,
                  left:          "50%",
                  transform:     "translateX(-50%)",
                  borderRadius:  `${d / 2}px ${d / 2}px 0 0`,
                  border:        "1px solid rgba(197,178,122,0.065)",
                  borderBottom:  "none",
                }}
              />
            ))}
          </div>

          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />

          <div className="container-max relative z-10">
            <Reveal className="text-center mb-14 md:mb-16">
              <span className="eyebrow-light mb-4 inline-flex">{t("why.eyebrow")}</span>
              <h2
                className="max-w-2xl mx-auto"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(32px, 4.2vw, 58px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.08,
                  color:         "#FFFFFF",
                }}
              >
                {t("why.titleLead")}{" "}
                <span style={{ color: "#C5B27A" }}>{t("why.titleAccent")}</span>
              </h2>
              <p
                className="mt-5 max-w-lg mx-auto"
                style={{ fontSize: "16px", lineHeight: 1.78, color: "rgba(255,255,255,0.42)" }}
              >
                {t("why.body")}
              </p>
            </Reveal>

            <div
              className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-[24px]"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {whyPoints.map((pt, i) => (
                <Reveal key={pt.headline} delay={i * 90}>
                  <div
                    className="p-8 md:p-10 h-full"
                    style={{
                      background:  "rgba(255,255,255,0.03)",
                      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mb-7" style={{ backgroundColor: "#C5B27A" }} />
                    <h3
                      className="mb-3"
                      style={{
                        fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize:      "clamp(18px, 1.8vw, 22px)",
                        fontWeight:    600,
                        letterSpacing: "-0.01em",
                        lineHeight:    1.25,
                        color:         "#FFFFFF",
                      }}
                    >
                      {pt.headline}
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
                      {pt.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="mt-10 text-center">
              <Link href="/about" className="btn-ghost-dark inline-flex">
                {t("why.cta")}
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            9. TEAM TEASER  —  lifted ivory
        ══════════════════════════════════════════════════════════════════ */}
        <TeamTeaser />

        {/* ══════════════════════════════════════════════════════════════════
            10. BLOG PREVIEW  —  lifted ivory · 3 recent posts
            Server component — fetches from API, falls back to editorial
            placeholders when backend is not yet live. See BlogPreview.tsx.
        ══════════════════════════════════════════════════════════════════ */}
        <BlogPreview />

        {/* ══════════════════════════════════════════════════════════════════
            11. CERTIFICATIONS  —  URSB incorporation credential card
        ══════════════════════════════════════════════════════════════════ */}
        <Certifications />

        {/* ══════════════════════════════════════════════════════════════════
            11. FINAL CTA  —  white · corner brackets · arc vectors
        ══════════════════════════════════════════════════════════════════ */}
        <FinalCTA />

      </main>
      <Footer />
    </>
  );
}
