import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "SEAL Wound Spray — FDA-Cleared Hemostatic Bleeding Control",
  description:
    "SEAL is an FDA-cleared, chitosan-based hemostatic spray for rapid bleeding control — for EMS, military, hospitals, home, and pet first aid. Single-use, sterile, MIL-STD-810H tested. Request product information.",
};

const ENQUIRE = "/enquire?sector=SEAL";

/* ─── Data ───────────────────────────────────────────────────────────────── */

const benefits = [
  { icon: Droplets,     title: "Chitosan clotting",     body: "Chitosan binds to blood cells and platelets to form a fast, stable clot over the wound — sealing cuts, lacerations, and serious bleeds." },
  { icon: ShieldCheck,  title: "FDA-cleared",           body: "Cleared by the US FDA (510(k)) — confirmed substantially equivalent to an established, safe, and effective medical device." },
  { icon: PackageCheck, title: "Single-use & sterile",  body: "Every can is sealed, sterile, and single-use — no preparation, no cross-contamination, ready the moment you are." },
  { icon: Snowflake,    title: "Built for extremes",    body: "Tested to MIL-STD-810H for heat, cold, altitude, and humidity — performs in rain, snow, wind, and low-light conditions." },
];

const steps = [
  { n: "01", title: "Shake the can",        body: "Give it a good shake to activate the formula." },
  { n: "02", title: "Spray the wound",      body: "Hold 6–10 inches away and apply a steady spray to fully cover the bleeding area." },
  { n: "03", title: "A clot forms",         body: "Chitosan binds to blood cells and platelets, forming a fast, stable clot." },
  { n: "04", title: "Seek care if needed",  body: "For deeper or more serious wounds, follow up with professional medical attention." },
];

const variants = [
  {
    icon: Backpack,
    name: "SEAL OTC",
    tagline: "Everyday carry",
    body: "Compact enough for hiking kits, travel bags, and home medicine cabinets — bleeding control wherever life happens.",
    specs: ["1.5oz aerosol can", "Sterile chitosan powder", "Single-use", "36-month shelf life", "Room-temperature storage"],
  },
  {
    icon: Siren,
    name: "SEAL PRO",
    tagline: "Professional & tactical",
    body: "A patented, higher-velocity formula for first responders and tactical teams — rapid control of moderate to severe external hemorrhage.",
    specs: ["2.5oz aerosol can", "~80 PSI professional grade", "Single-use", "MIL-STD-810H tested", "For trained responders"],
    featured: true,
  },
  {
    icon: Dog,
    name: "HemoSEAL Pet",
    tagline: "Animal first aid",
    body: "Sting-free bleeding control for dogs, cats, horses, goats, and more — stops bleeding from cuts, abrasions, and nail injuries.",
    specs: ["2.8oz aerosol can", "Sting-free agent", "Single-use per animal", "No fur-gluing", "Field-ready"],
  },
];

const trust = [
  { icon: Award,        label: "FDA Cleared",            body: "Cleared through the US FDA 510(k) process — the pathway confirming a moderate-risk device is substantially equivalent to an established, safe, and effective product." },
  { icon: Ambulance,    label: "Field-Proven",           body: "Deployed in Emergency Medical Services, military, and tactical operations — and approved for use by agencies including Maryland EMS." },
  { icon: Activity,     label: "Coagulopathy-Tested",    body: "Tested in animal models with both normal and impaired clotting function. Always monitor patients post-application." },
  { icon: Snowflake,    label: "Extreme-Environment Rated", body: "Meets MIL-STD-810H standards for temperature, altitude, and humidity — performs in rain, snow, wind, and low light." },
  { icon: FlaskConical, label: "Sterile Chitosan",       body: "A sterile chitosan dry-powder formula — a naturally derived agent widely used in modern hemostatic dressings." },
  { icon: Factory,      label: "Made in the USA",        body: "Manufactured in the United States and backed by the FDA clearance process." },
];

const specs: [string, string][] = [
  ["Formula",    "Sterile chitosan dry powder"],
  ["Use",        "Single-use"],
  ["Shelf life", "36 months"],
  ["Storage",    "Room temperature — no refrigeration"],
  ["Tested to",  "MIL-STD-810H (heat, cold, altitude, humidity)"],
  ["Removal",    "Rinse with saline or water, wipe with sterile gauze"],
];

const safety = [
  "Not a replacement for a tourniquet — but it can reduce reliance on one, especially where a tourniquet can't be applied (neck, groin, or underarm).",
  "Single-patient use. Once a can is activated the sterile seal is broken; use it on one person only. It may be used on multiple wounds on the same patient.",
  "For deeper or more serious wounds, always seek professional medical attention.",
];

const audiences = [
  { icon: Ambulance,   label: "EMTs & paramedics"       },
  { icon: Shield,      label: "Military & combat medics" },
  { icon: Flame,       label: "Police & fire services"  },
  { icon: Building2,   label: "Hospital emergency depts" },
  { icon: Stethoscope, label: "Clinics & surgical units" },
  { icon: Dog,         label: "Veterinary & pet care"   },
];

const faqs = [
  { q: "What is SEAL Wound Spray?",                a: "SEAL is an FDA-cleared, chitosan-based hemostatic aerosol designed for rapid bleeding control. It forms a gel-like clot over minor cuts and lacerations as well as more serious bleeds, for professional, home, and field first aid." },
  { q: "How does it work?",                        a: "Shake the can, then spray from 6–10 inches to cover the bleeding area. The chitosan binds to blood cells and platelets, forming a fast, stable clot. For deeper wounds, follow up with professional care." },
  { q: "Is it regulated?",                         a: "SEAL is cleared by the US FDA through the 510(k) process and tested to MIL-STD-810H. Our team provides the full regulatory, clinical, and compliance documentation for your market and procurement process on request." },
  { q: "What variants are available?",             a: "Three: SEAL OTC for everyday and home use, SEAL PRO for first responders and tactical teams, and HemoSEAL Pet for animal first aid. We'll help you choose the right format and volumes." },
  { q: "Can it replace a tourniquet?",             a: "No. SEAL does not replace a tourniquet, but it can reduce reliance on one — particularly in areas where a tourniquet can't be applied, such as the neck, groin, or underarm. Always seek care for serious wounds." },
  { q: "How is it stored, and how long does it last?", a: "Each unit has a 36-month shelf life and is stored at room temperature with no refrigeration required — making it well suited to trauma kits, ambulances, clinics, and field packs." },
  { q: "Can I order at procurement volumes?",      a: "Yes. We support institutional and bulk procurement for hospitals, responders, NGOs, and defence. Request product information and our team will share pricing, documentation, and supply options for your volumes." },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function SealWoundSprayPage() {
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
              alt="Emergency responder preparing SEAL wound spray from a trauma kit"
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
              <span className="eyebrow-light mb-5 inline-flex">SEAL Hemostatic Wound Spray · Medical · B2B</span>
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
                Stop bleeding fast.{" "}
                <span className="text-gold-gradient">Save lives.</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                An FDA-cleared, chitosan-based hemostatic spray for rapid bleeding
                control — trusted by EMS, military, and emergency teams, and ready
                for the home, the field, and even the family pet.
              </p>

              {/* Quick-fact pills */}
              <div className="flex flex-wrap gap-2 mb-9">
                {["FDA-cleared · US 510(k)", "Chitosan-based", "Single-use & sterile", "MIL-STD-810H tested"].map((f) => (
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
                  Request Product Information
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

        {/* ══ BENEFITS ════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">Why SEAL</span>
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
                Control when it counts.
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
                alt="Gloved hand holding SEAL wound spray, ready to apply"
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
                  Four simple steps.
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
              <span className="eyebrow block mb-3">The range</span>
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
                One formula. Three formats.
              </h2>
              <p className="mt-5" style={{ fontSize: "16px", lineHeight: 1.75, color: "#555555", maxWidth: "560px" }}>
                The same chitosan hemostatic technology, packaged for everyday carry,
                professional response, and animal first aid.
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
                          Most capable
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
                Not sure which format fits your team?{" "}
                <Link href={ENQUIRE} className="font-semibold underline" style={{ color: "#7A6020" }}>Ask us</Link> — we&apos;ll recommend the right one for your use and volumes.
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
                alt="SEAL wound spray on a sterile trauma tray beside a first-aid kit"
                fill sizes="100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.1) 55%)" }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">Ready where it counts</span>
                <p
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(22px, 3vw, 36px)",
                    fontWeight:    700,
                    color:         "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  In the kit. On the line. In seconds.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ TESTED · TRUSTED · APPROVED ═════════════════════════════════════
            Dark proof section — mirrors the FET certifications treatment.
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
              <span className="eyebrow-light mb-3 inline-flex">Tested · Trusted · Approved</span>
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
                Proven where the stakes{" "}
                <span style={{ color: "#C5B27A" }}>are highest.</span>
              </h2>
              <p className="mt-5 max-w-lg" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
                FDA-cleared, field-deployed, and tested to military environmental
                standards — SEAL is built to perform when it matters most.
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
            {/* Specifications */}
            <Reveal>
              <span className="eyebrow block mb-3">Specifications</span>
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
                The essentials.
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

            {/* Safety */}
            <Reveal delay={120}>
              <span className="eyebrow block mb-3">Important safety information</span>
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
                Used responsibly.
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
                Full regulatory, clinical, and usage documentation is provided with
                every procurement enquiry.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ WHO IT'S FOR ════════════════════════════════════════════════════ */}
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
                <span style={{ color: "#1E1E1E" }}>Where lives </span>
                <span style={{ color: "#AAAAAA" }}>are on the line.</span>
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
                Need specifications or compliance documents?{" "}
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
          titleLead="Equip your team with"
          titleAccent="SEAL."
          body="Request product information and our team will share specifications, certifications, and procurement options — within 24 hours."
          primaryLabel="Request Product Information"
          primaryHref={ENQUIRE}
          secondaryLabel="Contact Us"
          secondaryHref="/contact"
          caption="FDA-cleared  ·  Single-use & sterile  ·  Reply within 24 hours"
        />

      </main>
      <Footer />
    </>
  );
}
