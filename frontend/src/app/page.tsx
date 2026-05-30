import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import VideoShowcase from "@/components/sections/VideoShowcase";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/* ─── Typography tokens ─────────────────────────────────────────────────────
   Calibrated for our actual content — Playfair headings, Inter body.
   Sizes are impressive without breaking layout or overlapping glyphs.
   ─────────────────────────────────────────────────────────────────────── */

const T = {
  heroH1: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(40px, 5.5vw, 68px)",
    fontWeight: 700,
    letterSpacing: "-0.025em",
    lineHeight: 1.06,
    color: "#FFFFFF",
  } as React.CSSProperties,

  sectionH2: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(28px, 3.2vw, 44px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.12,
    color: "#1E1E1E",
  } as React.CSSProperties,

  cardH3: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "22px",
    fontWeight: 600,
    letterSpacing: "-0.015em",
    lineHeight: 1.15,
    color: "#1E1E1E",
  } as React.CSSProperties,

  lead: {
    fontSize: "17px",
    lineHeight: 1.7,
    color: "rgba(255,255,255,0.68)",
  } as React.CSSProperties,

  body: {
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#555555",
  } as React.CSSProperties,
};

/* ─── Data ──────────────────────────────────────────────────────────────── */

const products = [
  {
    label: "Fuel Eco Tech",
    badge: "B2B · Fleet",
    tagline: "Reduce fuel costs. Extend engine life.",
    description:
      "Validated fuel-saving technology trusted by fleet operators across East Africa. Measurable ROI, proven results.",
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
      "Traceable, responsibly sourced coffee from Uganda — for consumers, hospitality businesses, and international importers.",
    href: "/products/coffee",
    cta: "Shop Coffee",
    salesMotion: "Shop Online · Wholesale · Export",
  },
  {
    label: "Logistics Services",
    badge: "B2B · Enterprise",
    tagline: "Move goods with confidence.",
    description:
      "End-to-end freight, warehousing, customs clearance, and supply chain management across Uganda, East Africa, and beyond.",
    href: "/products/logistics",
    cta: "Request a Logistics Quote",
    salesMotion: "Enquiry · Quote · Contract",
  },
];

const differentiators = [
  {
    number: "01",
    title: "Strategic, not just aesthetic",
    body: "Every decision ties to business outcomes — customer trust, lead conversion, and long-term brand equity.",
  },
  {
    number: "02",
    title: "Premium global standards",
    body: "International-quality execution with deep East African market knowledge — competitive locally, credible globally.",
  },
  {
    number: "03",
    title: "Clarity by design",
    body: "Visitors understand who Vitorra is, what we offer, and what to do next — within 30 seconds of landing.",
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
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col justify-end"
          style={{
            background: "linear-gradient(160deg, #181818 0%, #242424 100%)",
            minHeight: "88vh",
          }}
        >
          {/* Subtle watermark */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none select-none z-0 flex items-center overflow-hidden"
          >
            <span
              className="ghost-text-dark whitespace-nowrap pl-6 md:pl-12 lg:pl-20"
              style={{ opacity: 0.04 }}
            >
              Vitorra
            </span>
          </div>

          <div className="relative z-10 container-max w-full px-6 md:px-12 lg:px-20 pb-20 md:pb-28 pt-36 md:pt-40">
            <span className="eyebrow-light mb-6 inline-flex">
              Vitorra Holdings Limited · Uganda &amp; East Africa
            </span>

            <h1 style={T.heroH1} className="mb-6 max-w-4xl">
              Innovative products.{" "}
              <span className="text-gold-gradient">Dependable solutions.</span>
            </h1>

            <p style={T.lead} className="mb-10 max-w-xl">
              A diversified company delivering Fuel Eco Tech, logistics, healthcare
              products, and premium coffee across Uganda, East Africa, and international markets.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/enquire" className="btn-primary">
                Request a Quote
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/about" className="btn-ghost-dark">
                About Vitorra
              </Link>
            </div>
          </div>
        </section>

        {/* ══ TRUST BAR ═══════════════════════════════════════════════════ */}
        <div
          className="py-3.5 px-6"
          style={{ backgroundColor: "#C5B27A" }}
        >
          <div
            className="container-max mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-sm font-semibold"
            style={{ color: "#1E1E1E" }}
          >
            {["Uganda · East Africa · International", "4 Product Lines", "Verified Certifications", "B2B & B2C"].map(
              (item, i) => <span key={i}>{item}</span>
            )}
          </div>
        </div>

        {/* ══ VIDEO SHOWCASE ══════════════════════════════════════════════ */}
        <VideoShowcase />

        {/* ══ PRODUCTS ════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          {/* Background watermark */}
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none z-0"
          >
            <span
              className="ghost-text whitespace-nowrap px-6 md:px-12 lg:px-20"
              style={{ opacity: 0.06 }}
            >
              Portfolio
            </span>
          </div>

          <div className="container-max relative z-10">
            <div className="mb-12">
              <span className="eyebrow block mb-3">Our Portfolio</span>
              <h2 style={T.sectionH2} className="gold-underline max-w-md">
                Four product lines.<br />One trusted name.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {products.map((p) => (
                <Link
                  key={p.label}
                  href={p.href}
                  className="group flex flex-col bg-white rounded-[28px] p-8 border border-black/[0.05] hover:border-[#C5B27A]/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] transition-all duration-300"
                >
                  {/* Badge */}
                  <span
                    className="self-start text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full mb-5"
                    style={{ backgroundColor: "#F2F2F2", color: "#888888" }}
                  >
                    {p.badge}
                  </span>

                  <h3 style={T.cardH3} className="mb-1.5 group-hover:opacity-75 transition-opacity">
                    {p.label}
                  </h3>

                  <p className="text-sm font-medium mb-3" style={{ color: "#7A6020" }}>
                    {p.tagline}
                  </p>

                  <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: "#555555" }}>
                    {p.description}
                  </p>

                  <div
                    className="flex items-center justify-between pt-4"
                    style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <span className="text-[11px] font-medium" style={{ color: "#AAAAAA" }}>
                      {p.salesMotion}
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-sm font-semibold shrink-0 ml-4 group-hover:opacity-60 transition-opacity"
                      style={{ color: "#1E1E1E" }}
                    >
                      {p.cta}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY VITORRA ════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">

            {/* Headline left · copy right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 mb-12 lg:items-end">
              <div>
                <span className="eyebrow block mb-4">Why Vitorra</span>
                <h2 style={T.sectionH2}>
                  Built on trust.<br />Driven by innovation.
                </h2>
              </div>
              <div>
                <p className="mb-6" style={{ ...T.body, fontSize: "16px", maxWidth: "400px" }}>
                  International-quality execution with deep East African market
                  knowledge — competitive locally, credible globally.
                </p>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-60 transition-opacity"
                  style={{ color: "#1E1E1E" }}
                >
                  Learn about Vitorra
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {differentiators.map((d) => (
                <div
                  key={d.number}
                  className="bg-white rounded-[24px] p-7 border border-black/[0.05]"
                >
                  <span
                    className="block mb-4"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "40px",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                      color: "#D4C49A",
                    }}
                  >
                    {d.number}
                  </span>
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "17px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: "#1E1E1E",
                    }}
                  >
                    {d.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TEAM ════════════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none z-0"
          >
            <span
              className="ghost-text whitespace-nowrap px-6 md:px-12 lg:px-20"
              style={{ opacity: 0.06 }}
            >
              Team
            </span>
          </div>

          <div className="container-max relative z-10">
            <div className="mb-12">
              <span className="eyebrow block mb-3">Our People</span>
              <h2 style={{ ...T.sectionH2, maxWidth: "400px" }}>
                The team behind Vitorra.
              </h2>
            </div>

            <div className="flex flex-wrap gap-8 md:gap-12">
              {team.map((m) => (
                <div key={m.name} className="flex flex-col items-center text-center">
                  <div className="relative w-24 h-24 md:w-28 md:h-28 mb-3 shrink-0">
                    <div className="portrait-circle w-full h-full">
                      <Image
                        src={`/team/${encodeURIComponent(m.file)}`}
                        alt={m.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                    <Link
                      href="/about"
                      className="satellite-cta"
                      style={{ width: "36px", height: "36px" }}
                      aria-label={`About ${m.name}`}
                    >
                      <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </div>
                  <span className="eyebrow mb-1" style={{ fontSize: "9px" }}>{m.role}</span>
                  <p
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "13px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: "#1E1E1E",
                    }}
                  >
                    {m.name}
                  </p>
                </div>
              ))}

              {/* Orbit placeholder */}
              <Link
                href="/about"
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-dashed flex flex-col items-center justify-center text-center hover:opacity-60 transition-opacity self-start"
                style={{ borderColor: "rgba(197,178,122,0.4)" }}
              >
                <span style={{ color: "#C5B27A", fontSize: "20px", lineHeight: 1 }}>+</span>
                <span
                  className="block mt-1 leading-tight px-2"
                  style={{ fontSize: "10px", color: "#888888", fontWeight: 500 }}
                >
                  Meet the team
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* ══ CERTIFICATIONS ══════════════════════════════════════════════ */}
        <section
          className="section-padding-sm relative overflow-hidden"
          style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none z-0"
          >
            <span
              className="ghost-text-dark whitespace-nowrap px-6 md:px-12 lg:px-20"
              style={{ opacity: 0.04 }}
            >
              Trust
            </span>
          </div>

          <div className="container-max relative z-10 text-center">
            <span className="eyebrow-light mb-5 inline-flex">Verified &amp; Certified</span>
            <h2
              className="max-w-lg mx-auto mb-4"
              style={{ ...T.sectionH2, color: "#FFFFFF" }}
            >
              Products you can trust.
            </h2>
            <p
              className="max-w-md mx-auto mb-8"
              style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}
            >
              All Vitorra products are supported by verified certifications,
              lab results, and third-party validations.
            </p>
            <Link href="/trust/certifications" className="btn-ghost-dark inline-flex items-center gap-2">
              View Certifications
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ══ FINAL CTA ══════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F2F2F2" }}>
          <div className="container-max">
            <div
              className="rounded-[32px] px-8 md:px-14 py-14 md:py-20 text-center"
              style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}
            >
              <span className="eyebrow-light mb-5 inline-flex">Get Started</span>
              <h2
                className="max-w-xl mx-auto mb-5"
                style={{ ...T.sectionH2, color: "#FFFFFF", fontSize: "clamp(28px, 3.5vw, 48px)" }}
              >
                Ready to work with Vitorra?
              </h2>
              <p
                className="max-w-md mx-auto mb-10"
                style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.55)" }}
              >
                Whether you need a fuel savings assessment, a logistics quote,
                or want to stock premium Ugandan coffee — our team responds
                within 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
