import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowRight, ArrowUpRight } from "lucide-react";

/* ─── Data ─────────────────────────────────────────────────────────────── */

const products = [
  {
    label: "Fuel Eco Tech",
    slug: "fuel-eco-tech",
    badge: "B2B · Fleet",
    tagline: "Reduce fuel costs. Extend engine life.",
    description:
      "Scientifically validated fuel-saving technology trusted by fleet operators across East Africa. Measurable ROI, proven results.",
    href: "/products/fuel-eco-tech",
    cta: "Request a Fuel Savings Assessment",
    stat: "Enquiry → Consultation → Quote",
  },
  {
    label: "SEAL Wound Spray",
    slug: "seal-wound-spray",
    badge: "Medical · B2B",
    tagline: "Stop bleeding fast. Save lives.",
    description:
      "Clinically validated hemostatic wound spray for hospitals, emergency responders, NGOs, and military procurement.",
    href: "/products/seal-wound-spray",
    cta: "Request Product Information",
    stat: "Clinically Validated",
  },
  {
    label: "Vitorra Coffee",
    slug: "coffee",
    badge: "B2B · B2C",
    tagline: "Premium Ugandan coffee. Farm to cup.",
    description:
      "Traceable, responsibly sourced coffee from the heart of Uganda — for consumers, hospitality businesses, and international importers.",
    href: "/products/coffee",
    cta: "Shop Coffee",
    stat: "Self-Serve · Wholesale · Export",
  },
  {
    label: "Logistics Services",
    slug: "logistics",
    badge: "B2B · Enterprise",
    tagline: "Move goods with confidence.",
    description:
      "End-to-end freight, warehousing, customs clearance, and supply chain management across Uganda, East Africa, and global trade routes.",
    href: "/products/logistics",
    cta: "Request a Logistics Quote",
    stat: "Enquiry → Quote → Contract",
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

        {/* ══ HERO — dark cinema section ═════════════════════════════════ */}
        <section className="bg-hero-dark min-h-[92vh] flex items-end">
          <div className="container-max w-full px-6 md:px-12 lg:px-20 pb-20 md:pb-28 pt-36">
            {/* Ghost watermark */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center">
              <span className="ghost-text-dark pl-6 md:pl-12 lg:pl-20 opacity-60 whitespace-nowrap">
                Vitorra
              </span>
            </div>

            <div className="relative max-w-4xl">
              <span className="eyebrow-light mb-6 inline-flex">
                Vitorra Holdings Limited — Uganda &amp; East Africa
              </span>

              <h1
                className="text-white mb-8 leading-[1.04]"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(44px, 7vw, 80px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                }}
              >
                Innovative products.{" "}
                <span className="text-gold-gradient">
                  Dependable solutions.
                </span>
              </h1>

              <p className="text-white/65 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl">
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

        {/* ══ GOLD TRUST BAR ═════════════════════════════════════════════ */}
        <section className="bg-gold-strip py-4 px-6">
          <div className="container-max mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-1.5 text-charcoal text-sm font-semibold">
            {["Uganda · East Africa · International", "4 Product Lines", "Verified Certifications", "B2B & B2C"].map((item, i) => (
              <span key={i} className="flex items-center gap-10">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* ══ PRODUCTS — stadium cards on ivory canvas ══════════════════ */}
        <section className="section-padding bg-canvas relative overflow-hidden">

          {/* Ghost watermark */}
          <div className="absolute top-8 left-0 right-0 pointer-events-none select-none overflow-hidden">
            <span className="ghost-text px-6 md:px-12 lg:px-20 block">
              Portfolio
            </span>
          </div>

          <div className="container-max relative">
            <div className="mb-16">
              <span className="eyebrow block mb-4">Our Portfolio</span>
              <h2
                className="text-charcoal gold-underline"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.1,
                }}
              >
                Four product lines.<br />
                One trusted name.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((product) => (
                <Link
                  key={product.label}
                  href={product.href}
                  className="group block bg-white rounded-[40px] p-10 hover:shadow-card transition-all duration-500 border border-black/[0.04] hover:border-gold/30"
                >
                  {/* Badge */}
                  <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-charcoal/50 bg-[#F2F2F2] px-3 py-1.5 rounded-[999px] mb-6">
                    {product.badge}
                  </span>

                  <h3
                    className="text-charcoal mb-2 group-hover:text-[#A89255] transition-colors"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "26px",
                      fontWeight: 600,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {product.label}
                  </h3>

                  <p className="text-sm font-semibold text-gold mb-3 tracking-[-0.01em]">
                    {product.tagline}
                  </p>

                  <p className="text-body text-sm leading-relaxed mb-8">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-charcoal/40 font-medium">
                      {product.stat}
                    </span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-charcoal group-hover:text-gold transition-colors">
                      {product.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY VITORRA — lifted ivory, 3 columns ═════════════════════ */}
        <section className="section-padding bg-canvas-lifted">
          <div className="container-max">
            <div className="text-center mb-16">
              <span className="eyebrow block mb-4">Why Vitorra</span>
              <h2
                className="text-charcoal max-w-2xl mx-auto"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                Built on trust. Driven by innovation.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {differentiators.map((item) => (
                <div key={item.number} className="bg-white rounded-[32px] p-8 border border-black/[0.04]">
                  <span
                    className="block text-gold/30 mb-6"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "56px",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: "-0.03em",
                    }}
                  >
                    {item.number}
                  </span>
                  <h3
                    className="text-charcoal mb-3"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "20px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-body leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ TEAM — circular portraits with satellite CTAs ═════════════ */}
        <section className="section-padding bg-canvas relative overflow-hidden">

          {/* Ghost watermark */}
          <div className="absolute top-8 left-0 right-0 pointer-events-none select-none overflow-hidden">
            <span className="ghost-text px-6 md:px-12 lg:px-20 block">
              Team
            </span>
          </div>

          <div className="container-max relative">
            <div className="mb-16">
              <span className="eyebrow block mb-4">Our People</span>
              <h2
                className="text-charcoal max-w-xl"
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                }}
              >
                The team behind Vitorra.
              </h2>
            </div>

            {/* Team grid — circular portraits */}
            <div className="flex flex-wrap gap-10 md:gap-14">
              {team.map((member) => (
                <div key={member.name} className="flex flex-col items-center text-center w-32 md:w-36">
                  {/* Circular portrait */}
                  <div className="relative w-28 h-28 md:w-32 md:h-32 mb-4">
                    <div className="portrait-circle w-full h-full">
                      <Image
                        src={`/team/${encodeURIComponent(member.file)}`}
                        alt={member.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    {/* Satellite CTA */}
                    <Link
                      href="/about"
                      className="satellite-cta"
                      aria-label={`Learn more about ${member.name}`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Eyebrow + name */}
                  <span className="eyebrow block mb-1 text-[9px]">{member.role}</span>
                  <p
                    className="text-charcoal leading-tight"
                    style={{
                      fontFamily: "var(--font-playfair, Georgia, serif)",
                      fontSize: "14px",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {member.name}
                  </p>
                </div>
              ))}

              {/* "Meet the full team" orbit card */}
              <div className="flex flex-col items-center justify-center w-28 md:w-32">
                <Link
                  href="/about"
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed border-gold/40 flex flex-col items-center justify-center text-center hover:border-gold hover:bg-gold/5 transition-all"
                >
                  <span className="text-gold text-xl mb-1">+</span>
                  <span className="text-xs text-charcoal/50 font-medium leading-tight px-2">
                    Meet the team
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CERTIFICATIONS — dark section ═════════════════════════════ */}
        <section className="section-padding-sm bg-canvas-dark relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden flex items-center">
            <span className="ghost-text-dark pl-6 md:pl-12 lg:pl-20 opacity-40">Trust</span>
          </div>

          <div className="container-max relative text-center">
            <span className="eyebrow-light block mb-6">Verified &amp; Certified</span>
            <h2
              className="text-white mb-5 max-w-xl mx-auto"
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(26px, 3vw, 38px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              Products you can trust. Results you can measure.
            </h2>
            <p className="text-white/55 text-base max-w-lg mx-auto mb-10 leading-relaxed">
              All Vitorra products are supported by verified certifications,
              lab results, and third-party validations. Presented on request.
            </p>
            <Link
              href="/trust/certifications"
              className="btn-ghost-dark inline-flex items-center gap-2"
            >
              View Certifications &amp; Trust Documents
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* ══ FINAL CTA — stadium card on ivory ═════════════════════════ */}
        <section className="section-padding bg-canvas">
          <div className="container-max">
            <div className="bg-canvas-dark rounded-[40px] px-8 md:px-16 py-16 md:py-20 text-center relative overflow-hidden">
              {/* Ghost watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                <span className="ghost-text-dark text-[clamp(100px,14vw,180px)] opacity-30">
                  Start
                </span>
              </div>

              <div className="relative">
                <span className="eyebrow-light block mb-5">Get Started</span>
                <h2
                  className="text-white mb-5 max-w-xl mx-auto"
                  style={{
                    fontFamily: "var(--font-playfair, Georgia, serif)",
                    fontSize: "clamp(30px, 4vw, 50px)",
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.1,
                  }}
                >
                  Ready to work with Vitorra?
                </h2>
                <p className="text-white/60 text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
