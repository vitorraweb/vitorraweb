import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "Fuel Eco Tech — Proven Fuel Savings for Fleets",
  description:
    "Fuel Eco Tech is validated fuel-saving technology for commercial fleets across East Africa — lower fuel costs, extended engine life, and reduced emissions. Request a fuel savings assessment.",
};

const ENQUIRE = "/enquire?sector=FET";

/* ─── Data ───────────────────────────────────────────────────────────────── */

const benefits = [
  { icon: Fuel,      title: "Lower fuel costs",    body: "Reduce diesel and petrol consumption across your fleet — directly improving your bottom line." },
  { icon: Wrench,    title: "Extended engine life", body: "A cleaner, more complete burn means less build-up and wear on critical engine components." },
  { icon: Leaf,      title: "Reduced emissions",    body: "Burning fuel more efficiently lowers harmful exhaust output — better for compliance and the environment." },
  { icon: LineChart, title: "Measurable ROI",       body: "We benchmark your consumption before and after, so the savings are visible — not guesswork." },
];

const withoutFet = [
  "Incomplete combustion — fuel is wasted on every cycle",
  "Excess CO₂, NOx, and soot particles in exhaust gases",
  "Deposits accumulate inside the engine over time",
  "Higher fuel spend for the same kilometres driven",
];

const withFet = [
  "Patented swirl chamber ensures full oxygen integration",
  "Cleaner, more complete burn on every combustion cycle",
  "Fewer deposits — less wear on engine components",
  "Measurable reduction in fuel consumption and emissions",
];

const steps = [
  {
    n: "01",
    title: "Fitted to your fuel line",
    body: "FET integrates between the fuel pump and fuel filter — outside the high-pressure system. No modification to your engine, injection system, or electronics. Fitted in under an hour.",
  },
  {
    n: "02",
    title: "Patented swirl chamber activates",
    body: "The proprietary swirl chamber system improves the turbulence and distribution of the air-fuel mixture in the combustion chamber. Oxygen integrates more fully — so every cycle burns cleaner and more completely.",
  },
  {
    n: "03",
    title: "Measured results",
    body: "We establish your baseline consumption, then track the difference after fitting — giving you a clear, data-backed return on investment.",
  },
];

const testFindings = [
  "No further limp-mode incidents across the entire test period",
  "EGR and DPF blockages eliminated completely after installation",
  "Smoother, more stable engine behaviour throughout",
  "13.9% reduction is well above normal operational variation (±3–5%)",
];

const testMetrics = [
  { value: "3–5",  unit: " months",     label: "Full investment payback" },
  { value: "€900", unit: "–€1,300",     label: "Estimated annual savings" },
  { value: "0",    unit: " incidents",  label: "Limp-mode events post-install" },
];

const noModPoints = [
  {
    title: "No engine changes",
    body: "FET works exclusively on fuel preparation and swirling. It does not intervene in the combustion engine, control electronics, or exhaust aftertreatment system.",
  },
  {
    title: "Outside the high-pressure system",
    body: "Installation is carried out outside the high-pressure fuel system. No changes to your injection system or engine components are necessary.",
  },
  {
    title: "No chemical alteration",
    body: "FET does not change the chemical composition of your fuel or alter the way your engine works. It is a physical optimisation only.",
  },
  {
    title: "Factory systems stay intact",
    body: "The system improves combustion efficiency without any mechanical or electronic intervention in your factory-set systems. Your vehicle warranty is not affected.",
  },
];

const audiences = [
  { icon: Truck,   label: "Fleet operators" },
  { icon: Boxes,   label: "Logistics & transport" },
  { icon: Factory, label: "Manufacturing & plant" },
  { icon: Tractor, label: "Agriculture & machinery" },
  { icon: Bus,     label: "Bus & taxi operators" },
  { icon: Ship,    label: "Marine & vessels" },
];

const certifications = [
  { code: "ISO 9001:2015",    label: "Quality Management",       body: "Manufactured under internationally recognised quality management standards — every unit produced to a consistent, verified specification." },
  { code: "ISO 14001:2015",   label: "Environmental Management", body: "Committed to reducing environmental impact throughout production and operation — aligned with the emissions reduction story FET delivers." },
  { code: "ISO 27001",        label: "Information Security",     body: "Business operations and customer data managed to international security standards — a hallmark of a serious, established organisation." },
  { code: "Zurich Insurance", label: "Product Liability",        body: "Backed by Zurich product liability cover. An independent insurer has assessed and underwritten the product — a strong third-party quality signal." },
  { code: "AVL Technologies", label: "Independently Lab Validated", body: "Performance independently validated by AVL Technologies — one of the world's foremost automotive engineering and testing institutions." },
  { code: "qm-solutions GmbH", label: "German Certified",        body: "Independently certified by qm-solutions GmbH, Germany — confirming the product meets rigorous European quality and compliance standards." },
];

const faqs = [
  { q: "What vehicles is Fuel Eco Tech suitable for?",  a: "Petrol and diesel engines right across the range — from small cars, mini-buses, and vans, through SUVs and light trucks, up to heavy long-haul trucks of 40 tonnes. Four device sizes cover every class; we confirm the exact fit for your specific vehicles during your free assessment." },
  { q: "Do I need to modify my engine?",                a: "No. Fuel Eco Tech works outside the high-pressure fuel system — no changes to your engine, injection system, or electronics. Your factory configuration stays completely intact." },
  { q: "Will this affect my vehicle warranty?",         a: "No. Because FET does not modify your engine or any factory-set components, your manufacturer warranty is not affected. It is a physical optimisation of the fuel preparation process only." },
  { q: "How do you prove the savings?",                 a: "We establish your current fuel consumption as a baseline, then measure consumption after fitting — so the difference is transparent and tied to real data from your fleet." },
  { q: "Is there a minimum fleet size?",                a: "No. Fuel Eco Tech works for a single vehicle or an entire fleet. Larger fleets simply see the savings multiply across every vehicle." },
  { q: "How do I get started?",                         a: "Request a fuel savings assessment. We'll review your fleet, fuel usage, and goals, then come back with tailored options and expected outcomes — at no obligation." },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function FuelEcoTechPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════
            Full-bleed product image with Ken Burns zoom. Gold aurora on the
            right + grain texture match the homepage hero treatment exactly.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col"
          style={{ minHeight: "88vh", backgroundColor: "#111111" }}
        >
          {/* Background: product image + cinematic overlay */}
          <div className="absolute inset-0">
            <Image
              src="/products/fet/in-hand.png"
              alt="Fuel Eco Tech fitted on a commercial fleet engine"
              fill priority sizes="100vw"
              className="object-cover"
              style={{ animation: "vitorra-ken-burns 16s ease-out both" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.22) 100%)" }}
            />
          </div>

          {/* Gold aurora — right-side glow */}
          <div aria-hidden="true" className="hero-aurora-right" />
          {/* Film grain */}
          <div aria-hidden="true" className="hero-grain" />

          {/* Content */}
          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 mt-auto pt-28 pb-16 md:pb-24">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">
                Fuel Eco Technology · B2B · Fleet
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
                Proven fuel savings.{" "}
                <span className="text-gold-gradient">Measurable results.</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                Validated fuel-saving technology trusted by fleet operators across
                East Africa — cutting fuel costs and extending engine life, with a
                return you can measure.
              </p>

              {/* Quick-fact pills */}
              <div className="flex flex-wrap gap-2 mb-9">
                {["13.9% measured reduction", "Fitted in under 1 hour", "No engine modification", "1-year warranty"].map((f) => (
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
                  Request a Fuel Savings Assessment
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="btn-ghost-dark">
                  Talk to our team
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BENEFITS ════════════════════════════════════════════════════════
            White — crisp contrast immediately after the dark hero.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">Why Fuel Eco Tech</span>
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
                Every litre, working harder.
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

        {/* ══ BEFORE / AFTER ══════════════════════════════════════════════════
            Dark — the science, presented as a visual contrast.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#141414" }}
        >
          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />
          <div className="container-max relative z-10">
            <Reveal className="mb-12 text-center">
              <span className="eyebrow-light mb-3 inline-flex">The science behind it</span>
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
                What changes inside your engine.
              </h2>
              <p className="mt-5 max-w-xl mx-auto" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.48)" }}>
                FET improves the turbulence and distribution of the air-fuel mixture
                in the combustion chamber — so oxygen is used more fully on every cycle.
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
                      Without FET
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
                      With FET
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

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════════
            Ivory — two-column: product image left, 3-step process right.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <ParallaxImage
                src="/products/fet/installed.png"
                alt="Fuel Eco Tech installed in an engine bay"
                className="aspect-[4/3] rounded-[40px] shadow-card"
              />
            </Reveal>
            <div>
              <Reveal>
                <span className="eyebrow block mb-3">How it works</span>
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
                  Simple to fit.<br />Built to perform.
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

        {/* ══ PROVEN RESULTS ══════════════════════════════════════════════════
            The VW T5 test report from CTI GmbH — real data, real institution,
            signed November 2025. The most powerful conversion element on this
            page: 13.9% verified reduction, 3–5 month payback.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#0D0D0D" }}
        >
          {/* Gold aurora */}
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
              <span className="eyebrow-light mb-3 inline-flex">Verified field results</span>
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
                  Proven in the field.
                </h2>
                <p className="pb-1 max-w-sm" style={{ fontSize: "14px", lineHeight: 1.65, color: "rgba(255,255,255,0.4)" }}>
                  Independent test data from a signed official report — real vehicle,
                  real conditions, verified results.
                </p>
              </div>
            </Reveal>

            {/* Featured case study card */}
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
                  {/* Left: headline stat */}
                  <div className="flex flex-col justify-center p-8 md:p-12 lg:p-14">
                    {/* Source badge */}
                    <div
                      className="inline-flex items-center gap-2 mb-6 self-start px-3 py-1.5 rounded-full"
                      style={{ background: "rgba(197,178,122,0.1)", border: "1px solid rgba(197,178,122,0.25)" }}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "#C5B27A" }}>
                        Official test report · CTI GmbH
                      </span>
                    </div>

                    {/* Big number */}
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
                      fuel consumption reduction — first full month after installation.
                    </p>

                    <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.38)", maxWidth: "300px" }}>
                      VW T5 · Landesbaubehörde Stadthagen, Germany ·
                      Tested January–October 2025 under standard service conditions.
                    </p>
                  </div>

                  {/* Right: data + findings */}
                  <div
                    className="flex flex-col justify-center p-8 md:p-12 lg:p-14"
                    style={{ borderLeft: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    {/* Before / after bars */}
                    <div className="mb-8">
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "16px" }}>
                        Fuel consumption (l / 100 km)
                      </p>

                      {/* Without FET bar */}
                      <div className="mb-4">
                        <div className="flex justify-between items-baseline mb-2">
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>Without FET · Jan–Sept 2025</span>
                          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 700, color: "rgba(255,255,255,0.5)" }}>11.52</span>
                        </div>
                        <div style={{ height: "10px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: "88.6%", borderRadius: "999px", background: "rgba(255,255,255,0.2)" }} />
                        </div>
                      </div>

                      {/* With FET bar */}
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>With FET · October 2025</span>
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
                          ↓ 1.60 l/100 km saved · 13,468 km verified baseline
                        </span>
                      </div>
                    </div>

                    {/* Findings */}
                    <div className="mb-8">
                      <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: "12px" }}>
                        Key observations post-installation
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

                    {/* Attribution */}
                    <div className="pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                      <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.28)", lineHeight: 1.6 }}>
                        Report prepared by{" "}
                        <strong style={{ color: "rgba(255,255,255,0.48)" }}>CTI GmbH</strong>{" "}
                        &amp; Landesbaubehörde Hameln · Signed by Holger Walprecht ·{" "}
                        <strong style={{ color: "rgba(255,255,255,0.48)" }}>10 November 2025</strong>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* Supporting metric chips */}
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

        {/* ══ SAVINGS CALCULATOR ══════════════════════════════════════════════
            Ivory — interactive estimator. Sits right after the proof: customers
            who believe the 13.9% now get to model their own savings & payback.
        ═══════════════════════════════════════════════════════════════════════ */}
        <FetCalculator />

        {/* ══ FULL LINE PRICING ═══════════════════════════════════════════════
            Dark — the four device tiers with exact prices. Price reveal lands
            immediately after the customer has seen their own estimated savings.
        ═══════════════════════════════════════════════════════════════════════ */}
        <FetPricing />

        {/* ══ NO ENGINE MODIFICATION ══════════════════════════════════════════
            White — reassurance section. Clean contrast after the dark proof.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">Zero interference</span>
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
                No modification to your engine. Ever.
              </h2>
              <p className="mt-5 max-w-xl" style={{ fontSize: "16px", lineHeight: 1.78, color: "#555555" }}>
                FET is a physical optimisation — it improves how fuel enters the
                combustion process without touching your engine, electronics, or
                factory systems. Your vehicle leaves our team exactly as it arrived.
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

        {/* ══ VIDEO SHOWCASE ══════════════════════════════════════════════════
            Ivory — cinematic video card, full-width within container.
        ═══════════════════════════════════════════════════════════════════════ */}
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
                <span className="eyebrow-light mb-3 inline-flex">See it in action</span>
                <p
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(22px, 3vw, 36px)",
                    fontWeight:    700,
                    color:         "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Engineered for the road ahead.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ WHO IT'S FOR ════════════════════════════════════════════════════
            Ivory — centered sector pills, mirrors homepage "Sectors" strip.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section className="section-padding-sm" style={{ backgroundColor: "#F2F2F2" }}>
          <div className="container-max text-center">
            <Reveal>
              <span className="eyebrow block mb-5">Who it&apos;s for</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(26px, 3.2vw, 44px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                }}
              >
                <span style={{ color: "#1E1E1E" }}>Built for anyone </span>
                <span style={{ color: "#AAAAAA" }}>who runs on fuel.</span>
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

        {/* ══ CERTIFICATIONS ══════════════════════════════════════════════════
            Dark — six cert cards with aurora and grain for premium depth.
        ═══════════════════════════════════════════════════════════════════════ */}
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
              <span className="eyebrow-light mb-3 inline-flex">Verified &amp; validated</span>
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
                Independently certified.{" "}
                <span style={{ color: "#C5B27A" }}>Proven in the lab.</span>
              </h2>
              <p className="mt-5 max-w-lg" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
                FET carries internationally recognised certifications and has been
                independently validated by AVL Technologies — one of the world&apos;s
                foremost automotive engineering institutions.
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
                View all certifications
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ══════════════════════════════════════════════════════════════
            White — clean reading surface for detailed answers.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
            <Reveal>
              <span className="eyebrow block mb-3">Questions</span>
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
                Everything you need to know.
              </h2>
              <p className="mt-5 text-sm" style={{ color: "#666666" }}>
                Can&apos;t find your answer?{" "}
                <Link href="/contact" className="font-semibold underline" style={{ color: "#1E1E1E" }}>
                  Talk to our team.
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
          eyebrow="Get Started"
          titleLead="Ready to cut your"
          titleAccent="fuel bill?"
          body="Book a no-obligation fuel savings assessment. We'll review your fleet and come back with tailored options and expected results."
          primaryLabel="Request a Fuel Savings Assessment"
          primaryHref={ENQUIRE}
          secondaryLabel="Contact Us"
          secondaryHref="/contact"
          caption="No obligation  ·  Tailored to your fleet  ·  Reply within 24 hours"
        />

      </main>
      <Footer />
    </>
  );
}
