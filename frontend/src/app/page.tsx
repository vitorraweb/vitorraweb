import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ArrowRight, ArrowUpRight } from "lucide-react";

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

/* ─── Shared heading style ──────────────────────────────────────────────── */
const sectionHeading: React.CSSProperties = {
  fontFamily: "var(--font-playfair, Georgia, serif)",
  fontWeight: 700,
  letterSpacing: "-0.02em",
  lineHeight: 1.1,
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Header />

      <main className="flex-1 bg-canvas">

        {/* ══ HERO ═══════════════════════════════════════════════════════
            FIX: added `relative` so the absolute watermark is contained
            within this section, not the entire page.
        ═══════════════════════════════════════════════════════════════ */}
        <section className="bg-hero-dark min-h-[92vh] flex items-end relative overflow-hidden">

          {/* Watermark — z-0 so it is always behind the z-10 content */}
          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span
              className="ghost-text-dark pl-6 md:pl-12 lg:pl-20 whitespace-nowrap"
              style={{ opacity: 0.05 }}
            >
              Vitorra
            </span>
          </div>

          {/* Content — z-10 ensures it always sits above the watermark */}
          <div className="container-max w-full px-6 md:px-12 lg:px-20 pb-20 md:pb-28 pt-40 relative z-10">
            <div className="max-w-4xl">
              <span className="eyebrow-light mb-6 inline-flex">
                Vitorra Holdings Limited — Uganda &amp; East Africa
              </span>

              <h1
                className="text-white mb-8"
                style={{
                  ...sectionHeading,
                  fontSize: "clamp(44px, 7vw, 80px)",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.04,
                }}
              >
                Innovative products.{" "}
                <span className="text-gold-gradient">Dependable solutions.</span>
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
            {["Uganda · East Africa · International", "4 Product Lines", "Verified Certifications", "B2B & B2C"].map(
              (item, i) => <span key={i}>{item}</span>
            )}
          </div>
        </section>

        {/* ══ PRODUCTS ═══════════════════════════════════════════════════
            FIX: watermark moved to inset-0 centered at opacity 0.07
                 (not top-8 which caused collision with the heading).
                 Content wrapper promoted to z-10.
        ═══════════════════════════════════════════════════════════════ */}
        <section className="section-padding bg-canvas relative overflow-hidden">

          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span
              className="ghost-text px-6 md:px-12 lg:px-20 whitespace-nowrap"
              style={{ opacity: 0.07 }}
            >
              Portfolio
            </span>
          </div>

          <div className="container-max relative z-10">
            <div className="mb-14">
              <span className="eyebrow block mb-4">Our Portfolio</span>
              <h2
                className="text-charcoal gold-underline"
                style={{ ...sectionHeading, fontSize: "clamp(32px, 4.5vw, 52px)" }}
              >
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
                  {/* Badge */}
                  <span className="inline-block self-start text-[10px] font-bold uppercase tracking-widest text-charcoal/50 bg-[#F2F2F2] px-3 py-1.5 rounded-[999px] mb-6">
                    {product.badge}
                  </span>

                  <h3
                    className="text-charcoal mb-2 group-hover:text-[#A89255] transition-colors"
                    style={{ ...sectionHeading, fontSize: "24px", fontWeight: 600 }}
                  >
                    {product.label}
                  </h3>

                  <p className="text-sm font-semibold text-gold mb-3">
                    {product.tagline}
                  </p>

                  <p className="text-sm leading-relaxed mb-8 flex-1" style={{ color: "#454545" }}>
                    {product.description}
                  </p>

                  {/* Consistent bottom row across all 4 cards */}
                  <div className="flex items-center justify-between pt-4 border-t border-black/[0.05]">
                    <span className="text-[11px] text-charcoal/40 font-medium">
                      {product.salesMotion}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-charcoal group-hover:text-gold transition-colors shrink-0 ml-4">
                      {product.cta}
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WHY VITORRA ════════════════════════════════════════════════
            No watermark here — section is already distinct via bg-canvas-lifted
        ═══════════════════════════════════════════════════════════════ */}
        <section className="section-padding bg-canvas-lifted">
          <div className="container-max">
            <div className="text-center mb-14">
              <span className="eyebrow block mb-4">Why Vitorra</span>
              <h2
                className="text-charcoal max-w-2xl mx-auto"
                style={{ ...sectionHeading, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.15 }}
              >
                Built on trust. Driven by innovation.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {differentiators.map((item) => (
                <div key={item.number} className="bg-white rounded-[32px] p-8 border border-black/[0.04]">
                  <span
                    className="block text-gold/25 mb-5"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "52px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em" }}
                  >
                    {item.number}
                  </span>
                  <h3
                    className="text-charcoal mb-3"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "19px", fontWeight: 600, letterSpacing: "-0.01em" }}
                  >
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

        {/* ══ TEAM ═══════════════════════════════════════════════════════
            FIX: watermark at inset-0 centered, opacity 0.07, z-0.
                 Content at z-10.
        ═══════════════════════════════════════════════════════════════ */}
        <section className="section-padding bg-canvas relative overflow-hidden">

          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span
              className="ghost-text px-6 md:px-12 lg:px-20 whitespace-nowrap"
              style={{ opacity: 0.07 }}
            >
              Team
            </span>
          </div>

          <div className="container-max relative z-10">
            <div className="mb-14">
              <span className="eyebrow block mb-4">Our People</span>
              <h2
                className="text-charcoal max-w-xl"
                style={{ ...sectionHeading, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.15 }}
              >
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
                    <Link
                      href="/about"
                      className="satellite-cta"
                      aria-label={`About ${member.name}`}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <span className="eyebrow block mb-1" style={{ fontSize: "9px" }}>
                    {member.role}
                  </span>
                  <p
                    className="text-charcoal leading-tight"
                    style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "13px", fontWeight: 600, letterSpacing: "-0.01em" }}
                  >
                    {member.name}
                  </p>
                </div>
              ))}

              {/* Meet the full team orbit */}
              <div className="flex items-start">
                <Link
                  href="/about"
                  className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-dashed border-gold/35 flex flex-col items-center justify-center text-center hover:border-gold/70 hover:bg-gold/[0.04] transition-all"
                >
                  <span className="text-gold text-lg mb-0.5">+</span>
                  <span className="text-[11px] text-charcoal/45 font-medium leading-tight px-3">
                    Meet the team
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ══ CERTIFICATIONS — dark ══════════════════════════════════════
            FIX: watermark at z-0, content at z-10.
        ═══════════════════════════════════════════════════════════════ */}
        <section className="section-padding-sm bg-canvas-dark relative overflow-hidden">

          <div
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center z-0"
          >
            <span
              className="ghost-text-dark pl-6 md:pl-12 lg:pl-20 whitespace-nowrap"
              style={{ opacity: 0.05 }}
            >
              Trust
            </span>
          </div>

          <div className="container-max relative z-10 text-center">
            <span className="eyebrow-light block mb-6">Verified &amp; Certified</span>
            <h2
              className="text-white mb-5 max-w-xl mx-auto"
              style={{ ...sectionHeading, fontSize: "clamp(26px, 3vw, 38px)", lineHeight: 1.15 }}
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

        {/* ══ FINAL CTA ══════════════════════════════════════════════════
            FIX: "Start" watermark removed entirely (was unintended and
                 collided with the CTA copy).
        ═══════════════════════════════════════════════════════════════ */}
        <section className="section-padding bg-canvas">
          <div className="container-max">
            <div className="bg-canvas-dark rounded-[40px] px-8 md:px-16 py-16 md:py-20 text-center">
              <span className="eyebrow-light block mb-5">Get Started</span>
              <h2
                className="text-white mb-5 max-w-xl mx-auto"
                style={{ ...sectionHeading, fontSize: "clamp(30px, 4vw, 50px)", lineHeight: 1.1, letterSpacing: "-0.025em" }}
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
        </section>

      </main>

      <Footer />
    </>
  );
}
