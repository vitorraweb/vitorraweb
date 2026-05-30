import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoShowcase from "@/components/sections/VideoShowcase";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/* ─── Shared typography tokens ──────────────────────────────────────────────
   Mastercard scale: very large, very tight.
   We keep Playfair Display + Inter — only the numbers change.
   ───────────────────────────────────────────────────────────────────────── */

const T = {
  /** Hero H1 — Mastercard scale: fills the viewport, line-height ≈ 0.93 */
  heroH1: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(52px, 8.5vw, 96px)",
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 0.93,
    color: "#FFFFFF",
  },
  /** Section H2 — dominant, editorial */
  sectionH2: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(40px, 5.5vw, 68px)",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    lineHeight: 0.97,
    color: "#1E1E1E",
  },
  /** Card H3 */
  cardH3: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(22px, 2vw, 28px)",
    fontWeight: 600,
    letterSpacing: "-0.02em",
    lineHeight: 1.05,
    color: "#1E1E1E",
  },
  /** Lead paragraph — slightly larger than body */
  lead: {
    fontSize: "18px",
    lineHeight: 1.65,
    color: "#FFFFFF",
    opacity: 0.7,
  },
  /** Body paragraph */
  body: {
    fontSize: "16px",
    lineHeight: 1.65,
    color: "#454545",
  },
} as const;

/* ─── Gold arc divider ──────────────────────────────────────────────────────
   Thin curved SVG line — the Mastercard "orbital" motif in gold.
   ───────────────────────────────────────────────────────────────────────── */
function GoldArc({ flip = false }: { flip?: boolean }) {
  return (
    <div className="relative h-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1440 40"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={flip ? "M0 0 Q720 40 1440 0" : "M0 40 Q720 0 1440 40"}
          stroke="#C5B27A"
          strokeWidth="1.2"
          opacity="0.3"
        />
      </svg>
    </div>
  );
}

/* ─── Data ─────────────────────────────────────────────────────────────── */

const products = [
  {
    label: "Fuel Eco Tech",
    badge: "B2B · Fleet",
    tagline: "Reduce fuel costs. Extend engine life.",
    description:
      "Scientifically validated fuel-saving technology trusted by fleet operators across East Africa. Measurable ROI, proven results.",
    href: "/products/fuel-eco-tech",
    cta: "Request a Fuel Savings Assessment",
    salesMotion: "Enquiry · Consultation · Quote",
  },
  {
    label: "SEAL Wound Spray",
    badge: "Medical · B2B",
    tagline: "Stop bleeding fast. Save lives.",
    description:
      "Clinically validated hemostatic wound spray for hospitals, emergency responders, NGOs, and military procurement.",
    href: "/products/seal-wound-spray",
    cta: "Request Product Information",
    salesMotion: "Enquiry · Quote · Contract",
  },
  {
    label: "Vitorra Coffee",
    badge: "B2B · B2C",
    tagline: "Premium Ugandan coffee. Farm to cup.",
    description:
      "Traceable, responsibly sourced coffee from the heart of Uganda — for consumers, hospitality businesses, and international importers.",
    href: "/products/coffee",
    cta: "Shop Coffee",
    salesMotion: "Shop Online · Wholesale · Export",
  },
  {
    label: "Logistics Services",
    badge: "B2B · Enterprise",
    tagline: "Move goods with confidence.",
    description:
      "End-to-end freight, warehousing, customs clearance, and supply chain management across Uganda, East Africa, and global trade routes.",
    href: "/products/logistics",
    cta: "Request a Logistics Quote",
    salesMotion: "Enquiry · Quote · Contract",
  },
];

const differentiators = [
  {
    number: "01",
    title: "Strategic, not just aesthetic",
    body: "Every decision is tied to business outcomes — customer trust, lead conversion, and long-term brand equity.",
  },
  {
    number: "02",
    title: "Premium global standards",
    body: "International-quality execution with deep East African market knowledge — competitive locally, credible globally.",
  },
  {
    number: "03",
    title: "Clarity-driven by design",
    body: "Visitors immediately understand who Vitorra is, what we offer, and what to do next — within 30 seconds of landing.",
  },
];

const team = [
  { name: "John Oluwaseyi", role: "IT Officer", file: "John Oluwaseyi - IT Officer.jpeg" },
  { name: "Thurayya Nakayima", role: "Senior Marketing Officer", file: "Thurayya Nakayima - Senior Marketing Officer.jpg" },
  { name: "Sarah Nuwamanya", role: "Marketing Officer", file: "Sarah Nuwamanya - Marketing Officer.jpg" },
  { name: "Joseph Rwabu", role: "Senior Finance Officer", file: "Joseph Rwabu - Senior Finance Officer.jpeg" },
  { name: "Olivia Sandra", role: "Brand Designer", file: "Olivia Sandra - Brand Designer.jpeg" },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1 bg-canvas">

        {/* ══ HERO ══════════════════════════════════════════════════════════
            Text hero stays primary. Mastercard scale: H1 fills the screen.
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="bg-hero-dark min-h-[94vh] flex items-end relative overflow-hidden">

          {/* Watermark — z-0, barely visible */}
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span className="ghost-text-dark pl-6 md:pl-12 lg:pl-20 whitespace-nowrap" style={{ opacity: 0.04 }}>
              Vitorra
            </span>
          </div>

          <div className="container-max w-full px-6 md:px-12 lg:px-20 pb-24 md:pb-32 pt-44 relative z-10">
            <div className="max-w-5xl">
              <span className="eyebrow-light mb-8 inline-flex">
                Vitorra Holdings Limited — Uganda &amp; East Africa
              </span>

              <h1 style={T.heroH1} className="mb-10">
                Innovative products.{" "}
                <span className="text-gold-gradient">
                  Dependable solutions.
                </span>
              </h1>

              <p className="mb-12 max-w-2xl" style={{ ...T.lead, fontSize: "19px" }}>
                A diversified distribution and management company delivering
                Fuel Eco Tech, logistics, healthcare products, and premium
                coffee across Uganda, East Africa, and international markets.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/enquire" className="btn-primary">
                  Request a Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/about" className="btn-ghost-dark">
                  About Vitorra
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ GOLD TRUST BAR ════════════════════════════════════════════════ */}
        <section className="bg-gold-strip py-4 px-6">
          <div className="container-max mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-1.5 text-sm font-semibold" style={{ color: "#1E1E1E" }}>
            {["Uganda · East Africa · International", "4 Product Lines", "Verified Certifications", "B2B & B2C"].map(
              (item, i) => <span key={i}>{item}</span>
            )}
          </div>
        </section>

        {/* ══ VIDEO SHOWCASE — below hero, additive to the text ═════════════
            Mastercard Image 1: large stadium video + info panel.
            Carousel controls appear automatically once 2+ slides are live.
        ═══════════════════════════════════════════════════════════════════ */}
        <VideoShowcase />

        {/* Gold arc — connects video section to products */}
        <GoldArc />

        {/* ══ PRODUCTS — stadium cards on ivory canvas ══════════════════════ */}
        <section className="section-padding bg-canvas relative overflow-hidden">

          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span className="ghost-text px-6 md:px-12 lg:px-20 whitespace-nowrap" style={{ opacity: 0.07 }}>
              Portfolio
            </span>
          </div>

          <div className="container-max relative z-10">
            <div className="mb-16">
              <span className="eyebrow block mb-5">Our Portfolio</span>
              <h2 style={{ ...T.sectionH2 }} className="gold-underline">
                Four product lines.<br />One trusted name.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <Link
                  key={product.label}
                  href={product.href}
                  className="group flex flex-col bg-white rounded-[40px] p-10 hover:shadow-card transition-all duration-500 border border-black/[0.04] hover:border-gold/30"
                >
                  <span className="inline-block self-start text-[10px] font-bold uppercase tracking-widest bg-[#F2F2F2] px-3 py-1.5 rounded-[999px] mb-6" style={{ color: "#696969" }}>
                    {product.badge}
                  </span>

                  <h3 className="mb-2 group-hover:opacity-70 transition-opacity" style={T.cardH3}>
                    {product.label}
                  </h3>

                  <p className="text-sm font-semibold mb-3" style={{ color: "#7A6020" }}>
                    {product.tagline}
                  </p>

                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "#454545" }}>
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-black/[0.05]">
                    <span className="text-[11px] font-medium" style={{ color: "#999" }}>
                      {product.salesMotion}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold transition-colors shrink-0 ml-4 group-hover:opacity-70" style={{ color: "#1E1E1E" }}>
                      {product.cta}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Gold arc */}
        <GoldArc flip />

        {/* ══ WHY VITORRA — Mastercard "headline left + copy right" ══════════
            Large dominant headline left column, supporting copy + link right.
            Differentiator cards full-width below.
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="section-padding bg-canvas-lifted">
          <div className="container-max">

            {/* Split header — Mastercard Image 7 pattern */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-16 lg:items-end">
              <div>
                <span className="eyebrow block mb-6">Why Vitorra</span>
                <h2 style={{ ...T.sectionH2, color: "#1E1E1E" }}>
                  Built on trust.<br />Driven by innovation.
                </h2>
              </div>
              <div className="flex flex-col justify-end">
                <p className="mb-7" style={{ ...T.body, fontSize: "17px", color: "#454545", maxWidth: "420px" }}>
                  International-quality execution with deep East African market
                  knowledge — competitive locally, credible globally. Every
                  decision ties to a business outcome.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-60"
                  style={{ fontSize: "14px", color: "#1E1E1E" }}
                >
                  Learn about Vitorra
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Differentiator cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {differentiators.map((item) => (
                <div key={item.number} className="bg-white rounded-[32px] p-8 border border-black/[0.04]">
                  <span
                    className="block mb-5"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "52px",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: "#D4C49A",
                    }}
                  >
                    {item.number}
                  </span>
                  <h3 className="mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "19px", fontWeight: 600, letterSpacing: "-0.01em", color: "#1E1E1E" }}>
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gold arc */}
        <GoldArc />

        {/* ══ TEAM — circular portraits with satellite CTAs ═════════════════ */}
        <section className="section-padding bg-canvas relative overflow-hidden">

          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span className="ghost-text px-6 md:px-12 lg:px-20 whitespace-nowrap" style={{ opacity: 0.07 }}>
              Team
            </span>
          </div>

          <div className="container-max relative z-10">
            <div className="mb-16">
              <span className="eyebrow block mb-5">Our People</span>
              <h2 style={{ ...T.sectionH2, maxWidth: "500px" }}>
                The team behind Vitorra.
              </h2>
            </div>

            <div className="flex flex-wrap gap-10 md:gap-14">
              {team.map((member) => (
                <div key={member.name} className="flex flex-col items-center text-center">
                  <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4 shrink-0">
                    <div className="portrait-circle w-full h-full">
                      <Image
                        src={`/team/${encodeURIComponent(member.file)}`}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <Link href="/about" className="satellite-cta" aria-label={`About ${member.name}`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <span className="eyebrow block mb-1" style={{ fontSize: "9px" }}>{member.role}</span>
                  <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em", color: "#1E1E1E" }}>
                    {member.name}
                  </p>
                </div>
              ))}

              {/* "Meet the full team" orbit */}
              <div className="flex items-start">
                <Link
                  href="/about"
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-center hover:opacity-70 transition-opacity"
                  style={{ borderColor: "rgba(197,178,122,0.35)" }}
                >
                  <span style={{ color: "#C5B27A", fontSize: "18px", marginBottom: "2px" }}>+</span>
                  <span style={{ fontSize: "11px", color: "#666666", fontWeight: 500, lineHeight: 1.3, padding: "0 12px", display: "block" }}>
                    Meet the team
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CERTIFICATIONS — dark ══════════════════════════════════════════ */}
        <section className="section-padding-sm bg-canvas-dark relative overflow-hidden">

          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span className="ghost-text-dark pl-6 md:pl-12 lg:pl-20 whitespace-nowrap" style={{ opacity: 0.05 }}>
              Trust
            </span>
          </div>

          <div className="container-max relative z-10 text-center">
            <span className="eyebrow-light block mb-6">Verified &amp; Certified</span>
            <h2 className="mb-5 max-w-xl mx-auto" style={{ ...T.sectionH2, color: "#FFFFFF", fontSize: "clamp(30px, 4vw, 52px)" }}>
              Products you can trust.
            </h2>
            <p className="max-w-lg mx-auto mb-10" style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
              All Vitorra products are supported by verified certifications,
              lab results, and third-party validations. Presented on request.
            </p>
            <Link href="/trust/certifications" className="btn-ghost-dark inline-flex items-center gap-2">
              View Certifications &amp; Trust Documents
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ══ FINAL CTA — dark stadium card ════════════════════════════════ */}
        <section className="section-padding bg-canvas">
          <div className="container-max">
            <div
              className="rounded-[40px] px-8 md:px-16 py-16 md:py-24 text-center"
              style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}
            >
              <span className="eyebrow-light block mb-6">Get Started</span>
              <h2
                className="max-w-2xl mx-auto mb-6"
                style={{
                  ...T.sectionH2,
                  color: "#FFFFFF",
                  fontSize: "clamp(34px, 5vw, 68px)",
                  lineHeight: 0.95,
                }}
              >
                Ready to work with Vitorra?
              </h2>
              <p className="max-w-lg mx-auto mb-12" style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.6)" }}>
                Whether you need a fuel savings assessment, a logistics quote,
                or want to stock premium Ugandan coffee — our team responds
                within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/enquire" className="btn-primary inline-flex items-center gap-2">
                  Request a Quote
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="btn-ghost-dark inline-flex items-center gap-2">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  );
}
