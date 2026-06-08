import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StatementBand from "@/components/sections/StatementBand";
import Team from "@/components/sections/Team";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import FinalCTA from "@/components/sections/FinalCTA";
import { ArrowRight, ArrowUpRight, Award, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Vitorra Holdings Limited",
  description:
    "Vitorra Holdings Limited is a diversified holdings company built in Uganda — operating across fuel technology, healthcare, premium coffee, and logistics. Meet our leadership team and learn what drives us.",
};

/* ─── Data ───────────────────────────────────────────────────────────────── */

const values = [
  {
    n: "01",
    title: "Integrity in every deal",
    body: "We say what we mean and deliver what we promise — every product, every partner, every time. No fine print, no surprises.",
  },
  {
    n: "02",
    title: "Built on evidence",
    body: "From fuel savings to food safety, our claims are backed by data, independent certification, and third-party validation. We do not self-certify.",
  },
  {
    n: "03",
    title: "East Africa, world-class",
    body: "International execution standards paired with deep local knowledge — competitive at home, credible across every border we operate in.",
  },
];

const portfolio = [
  {
    label: "Fuel Eco Tech",
    desc:  "Patented fuel optimisation for commercial fleets — ISO certified, AVL-validated, 13.9% measured reduction.",
    href:  "/products/fuel-eco-tech",
    img:   "/products/fet/in-hand.png",
    badge: "B2B · Fleet",
  },
  {
    label: "SEAL Wound Spray",
    desc:  "Clinical-grade hemostatic wound spray for hospitals, emergency responders, NGOs, and military procurement.",
    href:  "/products/seal-wound-spray",
    img:   "/products/seal/trauma-tray.png",
    badge: "Medical · B2B",
  },
  {
    label: "Vitorra Coffee",
    desc:  "Traceable, responsibly sourced Ugandan coffee — for consumers, hospitality businesses, and international importers.",
    href:  "/products/coffee",
    img:   "/products/coffee/lifestyle.png",
    badge: "B2B · B2C",
  },
  {
    label: "Logistics Services",
    desc:  "End-to-end freight, warehousing, customs clearance, and supply chain management across Uganda and East Africa.",
    href:  "/products/logistics",
    img:   "/products/logistics/truck-day.png",
    badge: "B2B · Enterprise",
  },
];

const credentials = [
  { code: "ISO 9001:2015",    label: "Quality Management"   },
  { code: "ISO 14001:2015",   label: "Environmental"        },
  { code: "ISO 27001",        label: "Information Security" },
  { code: "AVL Technologies", label: "Lab Validated"        },
  { code: "Zurich Insurance", label: "Product Liability"    },
  { code: "qm-solutions",     label: "German Certified"     },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ══ 1. STATEMENT BAND ════════════════════════════════════════════════
            Cinematic full-screen purpose moment. Kinetic headline reveals on
            scroll, count-up proof strip adds substance. See StatementBand.tsx.
        ═══════════════════════════════════════════════════════════════════════ */}
        <StatementBand image="/hero/purpose.png" />

        {/* ══ 2. MISSION ═══════════════════════════════════════════════════════
            Bold editorial "why we exist" — white, generous whitespace.
            The conviction statement before we explain what we do.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.06)" }}
        >
          {/* Faint concentric rings */}
          <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            {[300, 500, 700].map((d) => (
              <div key={d} className="absolute rounded-full"
                style={{ width: d, height: d, border: "1px solid rgba(197,178,122,0.06)" }} />
            ))}
          </div>

          <div className="container-max relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            {/* Left: mission statement */}
            <Reveal>
              <span className="eyebrow block mb-5">Our mission</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(36px, 5vw, 68px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.06,
                  color:         "#1E1E1E",
                }}
              >
                One conviction.
              </h2>
              <div
                style={{
                  width: 48, height: 2,
                  background: "linear-gradient(90deg, #C5B27A, #D4C49A)",
                  borderRadius: 999,
                  margin: "24px 0",
                }}
              />
              <p style={{ fontSize: "17px", lineHeight: 1.8, color: "#555555", maxWidth: "480px" }}>
                East Africa deserves access to the same quality of technology,
                healthcare products, and business services available anywhere in
                the world.
              </p>
              <p className="mt-5" style={{ fontSize: "17px", lineHeight: 1.8, color: "#555555", maxWidth: "480px" }}>
                Vitorra exists to deliver exactly that — with the rigour,
                certifications, and integrity that serious buyers and partners
                demand.
              </p>
            </Reveal>

            {/* Right: editorial quote pull */}
            <Reveal direction="left" delay={120}>
              <div
                className="relative rounded-[28px] p-8 md:p-10"
                style={{
                  background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                  border: "1px solid rgba(197,178,122,0.18)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
                }}
              >
                {/* Large quote mark */}
                <div
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "80px", fontWeight: 700, lineHeight: 0.75,
                    color: "#C5B27A", marginBottom: "16px", userSelect: "none",
                  }}
                >
                  &ldquo;
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize: "clamp(18px, 2vw, 22px)",
                    fontStyle: "italic",
                    fontWeight: 500,
                    lineHeight: 1.65,
                    color: "#1E1E1E",
                    marginBottom: "24px",
                  }}
                >
                  Innovative products and dependable solutions — across fuel
                  technology, healthcare, premium coffee, and logistics — for
                  businesses and consumers across Uganda, East Africa, and
                  international markets.
                </p>
                <div style={{ width: 36, height: 2, background: "linear-gradient(90deg, #C5B27A, #D4C49A)", borderRadius: 999, marginBottom: "16px" }} />
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E1E1E" }}>Vitorra Holdings Limited</div>
                <div style={{ fontSize: "12px", color: "#AAAAAA", marginTop: "2px" }}>Brand positioning statement</div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ 3. WHO WE ARE ════════════════════════════════════════════════════
            Company overview — warm ivory, 2-column text + image.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F2F2F2" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal>
              <span className="eyebrow block mb-4">Who we are</span>
              <h2
                className="mb-6"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                }}
              >
                A diversified company<br />built for the long term.
              </h2>
              <p className="mb-5" style={{ fontSize: "16px", lineHeight: 1.78, color: "#555555" }}>
                Vitorra Holdings Limited is registered in Uganda and operates
                across fuel technology, healthcare, premium coffee, and logistics —
                bringing international-standard products to East African markets,
                and East African products to the world.
              </p>
              <p style={{ fontSize: "16px", lineHeight: 1.78, color: "#555555" }}>
                Every product line is held to the same standard: independently
                certified, evidenced by data, and delivered with integrity.
                We serve B2B clients across Uganda, Kenya, Tanzania, Rwanda, and
                international markets — with a 24-hour response commitment on
                every enquiry.
              </p>

              {/* Key facts */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { label: "Registered", value: "Uganda (URSB)" },
                  { label: "Reg. No.",   value: "80034340923220" },
                  { label: "Markets",    value: "Uganda + 5 regions" },
                  { label: "Response",   value: "Within 24 hours" },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="px-4 py-3 rounded-[14px] bg-white"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A6020" }}>
                      {f.label}
                    </div>
                    <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "15px", fontWeight: 600, color: "#1E1E1E", marginTop: "2px" }}>
                      {f.value}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120} direction="left">
              <ParallaxImage
                src="/hero/overview.png"
                alt="Vitorra — East Africa operations"
                className="aspect-[4/3] rounded-[40px] shadow-card"
              />
            </Reveal>
          </div>
        </section>

        {/* ══ 4. VALUES ════════════════════════════════════════════════════════
            What we stand for — dark background, glass panels, arc vectors.
            Same treatment as "Why Vitorra" on homepage for visual consistency.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#141414" }}
        >
          {/* Semi-circle arcs */}
          <div aria-hidden="true" className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none">
            {[180, 340, 520, 700].map((d) => (
              <div key={d} className="absolute" style={{
                width: d, height: d / 2, bottom: 0,
                left: "50%", transform: "translateX(-50%)",
                borderRadius: `${d / 2}px ${d / 2}px 0 0`,
                border: "1px solid rgba(197,178,122,0.065)",
                borderBottom: "none",
              }} />
            ))}
          </div>
          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />

          <div className="container-max relative z-10">
            <Reveal className="text-center mb-14">
              <span className="eyebrow-light mb-4 inline-flex">What we stand for</span>
              <h2
                className="max-w-xl mx-auto"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(30px, 4vw, 54px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.08,
                  color:         "#FFFFFF",
                }}
              >
                Our values{" "}
                <span style={{ color: "#C5B27A" }}>in practice.</span>
              </h2>
            </Reveal>

            <div
              className="grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-[24px]"
              style={{ border: "1px solid rgba(255,255,255,0.07)" }}
            >
              {values.map((v, i) => (
                <Reveal key={v.n} delay={i * 90}>
                  <div
                    className="p-8 md:p-10 h-full"
                    style={{
                      background:  "rgba(255,255,255,0.03)",
                      borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
                    }}
                  >
                    <div
                      style={{
                        fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize:      "clamp(36px, 4vw, 52px)",
                        fontWeight:    700,
                        letterSpacing: "-0.04em",
                        lineHeight:    1,
                        color:         "rgba(197,178,122,0.25)",
                        marginBottom:  "20px",
                      }}
                    >
                      {v.n}
                    </div>
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
                      {v.title}
                    </h3>
                    <p style={{ fontSize: "14px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
                      {v.body}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 5. PORTFOLIO ═════════════════════════════════════════════════════
            Four product lines — white, compact cards with hover glow.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-14">
              <span className="eyebrow block mb-3">Our portfolio</span>
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
                  Four lines.<br />One trusted name.
                </h2>
                <Link
                  href="/enquire"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 pb-1"
                  style={{ color: "#7A6020" }}
                >
                  Request a quote
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {portfolio.map((p, i) => (
                <Reveal key={p.label} delay={i * 80}>
                  <Link
                    href={p.href}
                    className="group flex flex-col bg-white rounded-[24px] overflow-hidden h-full glow-card"
                    style={{ border: "1px solid rgba(0,0,0,0.06)", backgroundColor: "#FAFAF8" }}
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: "4/3" }}>
                      <Image
                        src={p.img}
                        alt={p.label}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                      <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)" }}
                      />
                      <span
                        className="absolute top-3 left-3"
                        style={{
                          fontSize: "9px", fontWeight: 700, letterSpacing: "0.06em",
                          textTransform: "uppercase", color: "#1E1E1E",
                          background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
                          borderRadius: "999px", padding: "3px 10px",
                        }}
                      >
                        {p.badge}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-5">
                      <h3
                        className="mb-1.5"
                        style={{
                          fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                          fontSize:      "18px",
                          fontWeight:    600,
                          letterSpacing: "-0.01em",
                          color:         "#1E1E1E",
                        }}
                      >
                        {p.label}
                      </h3>
                      <p className="flex-1 mb-4" style={{ fontSize: "12px", lineHeight: 1.65, color: "#777777" }}>
                        {p.desc}
                      </p>
                      <span
                        className="inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: "#7A6020" }}
                      >
                        Learn more <ArrowRight className="w-3 h-3 arrow-nudge" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ 6. TEAM ══════════════════════════════════════════════════════════
            Full leadership constellation — all 8 members now with real photos.
            Hierarchical: CEO → leadership tier (arc) → officers.
        ═══════════════════════════════════════════════════════════════════════ */}
        <Team />

        {/* ══ 7. CREDENTIALS ═══════════════════════════════════════════════════
            Compact certification + registration strip — white background.
            Six cert badges + URSB registration + link to full certs page.
        ═══════════════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-10">
                <div>
                  <span className="eyebrow block mb-3">Our credentials</span>
                  <h2
                    style={{
                      fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                      fontSize:      "clamp(26px, 3vw, 40px)",
                      fontWeight:    700,
                      letterSpacing: "-0.02em",
                      lineHeight:    1.1,
                      color:         "#1E1E1E",
                    }}
                  >
                    Independently certified.<br />
                    <span style={{ color: "#C5B27A" }}>Externally audited.</span>
                  </h2>
                </div>
                <Link
                  href="/trust/certifications"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 pb-1"
                  style={{ color: "#7A6020" }}
                >
                  View full certifications
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </Reveal>

            {/* Certification badges */}
            <Reveal className="flex flex-wrap gap-3 mb-8">
              {credentials.map((c, i) => (
                <div
                  key={c.code}
                  className="flex flex-col items-center text-center px-5 py-4 rounded-[16px]"
                  style={{
                    background:  "#FAFAF8",
                    border:      "1px solid rgba(197,178,122,0.2)",
                    boxShadow:   "0 2px 8px rgba(0,0,0,0.03)",
                    minWidth:    "130px",
                    animationDelay: `${i * 60}ms`,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#C5B27A", marginBottom: 8 }} />
                  <div style={{ fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7A6020", marginBottom: 4 }}>
                    {c.label}
                  </div>
                  <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "14px", fontWeight: 600, color: "#1E1E1E", lineHeight: 1.25 }}>
                    {c.code}
                  </div>
                </div>
              ))}
            </Reveal>

            {/* URSB registration strip */}
            <Reveal>
              <div
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[18px] px-6 py-4"
                style={{ background: "rgba(197,178,122,0.08)", border: "1px solid rgba(197,178,122,0.22)" }}
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0" style={{ color: "#7A6020" }} />
                  <p className="text-sm" style={{ color: "#555555" }}>
                    <span className="font-semibold" style={{ color: "#1E1E1E" }}>Vitorra Holdings Limited</span>
                    {" "}— Registered in Uganda · Reg. No.{" "}
                    <span className="font-semibold" style={{ color: "#1E1E1E" }}>80034340923220</span>
                    {" "}(Uganda Registration Services Bureau, URSB)
                  </p>
                </div>
                <Link
                  href="/trust/certifications"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0"
                  style={{ color: "#7A6020" }}
                >
                  View all <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ 8. FINAL CTA ══════════════════════════════════════════════════════ */}
        <FinalCTA
          eyebrow="Work with us"
          titleLead="Ready to work with"
          titleAccent="Vitorra?"
          body="Whether you need a fuel savings assessment, a logistics quote, or premium Ugandan coffee — our team responds within 24 hours."
          primaryLabel="Request a Quote"
          primaryHref="/enquire"
          secondaryLabel="Contact Us"
          secondaryHref="/contact"
        />

      </main>
      <Footer />
    </>
  );
}
