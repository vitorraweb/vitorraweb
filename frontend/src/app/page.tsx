import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import TrustMarquee from "@/components/sections/TrustMarquee";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import WhyVitorra from "@/components/sections/WhyVitorra";
import TeamTeaser from "@/components/sections/TeamTeaser";
import Certifications from "@/components/sections/Certifications";
import FinalCTA from "@/components/sections/FinalCTA";
import { ArrowRight } from "lucide-react";

/* ─── Typography tokens ─────────────────────────────────────────────────── */

const T = {
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
};

/* ─── Data ──────────────────────────────────────────────────────────────── */

const products = [
  {
    label: "Fuel Eco Tech",
    badge: "B2B · Fleet",
    image: "/products/fet/in-hand.png",
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
    image: "/products/seal/trauma-tray.png",
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
    image: "/products/coffee/lifestyle.png",
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
    image: "/products/logistics/truck-day.png",
    tagline: "Move goods with confidence.",
    description:
      "End-to-end freight, warehousing, customs clearance, and supply chain management across Uganda, East Africa, and beyond.",
    href: "/products/logistics",
    cta: "Request a Logistics Quote",
    salesMotion: "Enquiry · Quote · Contract",
  },
];

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════
            Cinematic single hero (no auto-rotation). One brand statement +
            a persistent sector rail (Overview · FET · SEAL · Coffee · Logistics)
            the visitor clicks to swap copy + background.
            Add/upgrade a sector's media: drop the file in public/ and change its
            `media` field in Hero.tsx (gradient → image/video). No other changes.
        ═══════════════════════════════════════════════════════════════ */}
        <Hero />

        {/* ══ TRUST BAR ═══════════════════════════════════════════════════
            Seamless credentials ticker — pauses on hover, scrolls (not wraps)
            on mobile, static when reduce-motion is on. Edit items in TrustMarquee.
        ═══════════════════════════════════════════════════════════════ */}
        <TrustMarquee />

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
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(80px, 12vw, 160px)",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "rgba(30,30,30,0.04)",
                userSelect: "none",
                paddingLeft: "clamp(24px, 5vw, 80px)",
                whiteSpace: "nowrap",
              }}
            >
              Portfolio
            </span>
          </div>

          <div className="container-max relative z-10">
            <Reveal className="mb-16 lg:mb-24">
              <span className="eyebrow block mb-3">Our Portfolio</span>
              <h2 style={T.sectionH2} className="gold-underline max-w-md">
                Four product lines.<br />One trusted name.
              </h2>
            </Reveal>

            {/* Alternating editorial feature rows — image parallax + staggered text */}
            <div className="flex flex-col gap-20 md:gap-28 lg:gap-32">
              {products.map((p, i) => {
                const imageLeft = i % 2 === 0;
                const num = String(i + 1).padStart(2, "0");
                return (
                  <div
                    key={p.label}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
                  >
                    {/* Image */}
                    <Reveal
                      direction={imageLeft ? "right" : "left"}
                      className={imageLeft ? "lg:order-1" : "lg:order-2"}
                    >
                      <ParallaxImage
                        src={p.image}
                        alt={p.label}
                        priority={i === 0}
                        className="aspect-[4/3] rounded-[40px] shadow-card"
                      />
                    </Reveal>

                    {/* Content */}
                    <div className={imageLeft ? "lg:order-2 lg:pl-2" : "lg:order-1 lg:pr-2"}>
                      <Reveal direction={imageLeft ? "left" : "right"}>
                        <div className="flex items-center gap-4 mb-5">
                          <span
                            style={{
                              fontFamily: "var(--font-playfair, Georgia, serif)",
                              fontSize: "clamp(34px, 4vw, 48px)",
                              fontWeight: 700,
                              lineHeight: 1,
                              letterSpacing: "-0.03em",
                              color: "#D4C49A",
                            }}
                          >
                            {num}
                          </span>
                          <span className="eyebrow">{p.badge}</span>
                        </div>

                        <h3
                          className="mb-3"
                          style={{
                            fontFamily: "var(--font-playfair, Georgia, serif)",
                            fontSize: "clamp(26px, 3vw, 40px)",
                            fontWeight: 700,
                            letterSpacing: "-0.02em",
                            lineHeight: 1.1,
                            color: "#1E1E1E",
                          }}
                        >
                          {p.label}
                        </h3>

                        <p className="font-medium mb-4" style={{ fontSize: "16px", color: "#7A6020" }}>
                          {p.tagline}
                        </p>

                        <p className="mb-7 max-w-md" style={{ fontSize: "15px", lineHeight: 1.75, color: "#555555" }}>
                          {p.description}
                        </p>
                      </Reveal>

                      <Reveal direction="up" delay={120}>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                          <Link href={p.href} className="btn-secondary group">
                            {p.cta}
                            <ArrowRight className="w-4 h-4 arrow-nudge" />
                          </Link>
                          <span
                            className="text-[11px] font-semibold uppercase"
                            style={{ letterSpacing: "0.08em", color: "#B7B7B7" }}
                          >
                            {p.salesMotion}
                          </span>
                        </div>
                      </Reveal>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══ WHY VITORRA ════════════════════════════════════════════════
            Sticky-narrative section — headline pins left, points scroll past
            right and light up as they reach centre. See WhyVitorra.tsx.
        ═══════════════════════════════════════════════════════════════ */}
        <WhyVitorra />

        {/* ══ TEAM TEASER ═════════════════════════════════════════════════
            Slim leadership teaser — overlapping avatars + CTA. Full team
            constellation lives on /about (TeamTeaser.tsx / Team.tsx).
        ═══════════════════════════════════════════════════════════════ */}
        <TeamTeaser />

        {/* ══ CERTIFICATIONS ══════════════════════════════════════════════
            Official-registration credential card (real URSB incorporation
            details) + cursor tilt. See Certifications.tsx.
        ═══════════════════════════════════════════════════════════════ */}
        <Certifications />

        {/* ══ FINAL CTA ══════════════════════════════════════════════════
            Premium closing card — gold aurora, magnetic primary button.
            See FinalCTA.tsx.
        ═══════════════════════════════════════════════════════════════ */}
        <FinalCTA />

      </main>
      <Footer />
    </>
  );
}
