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
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About — Vitorra Holdings Limited",
  description:
    "Vitorra Holdings Limited is a diversified holdings company built in Uganda — operating across fuel technology, healthcare, premium coffee, and logistics. Meet the leadership team.",
};

const values = [
  { n: "01", title: "Integrity in every deal", body: "We say what we mean and deliver what we promise — every product, every partner, every time." },
  { n: "02", title: "Built on evidence", body: "From fuel savings to food safety, our claims are backed by data, certification, and third-party validation." },
  { n: "03", title: "East Africa, world-class", body: "International execution standards with deep local knowledge — competitive at home, credible abroad." },
];

const sectors = [
  { label: "Fuel Eco Tech", desc: "Fleet fuel savings", href: "/products/fuel-eco-tech", img: "/products/fet/in-hand.png" },
  { label: "SEAL Wound Spray", desc: "Clinical wound care", href: "/products/seal-wound-spray", img: "/products/seal/trauma-tray.png" },
  { label: "Vitorra Coffee", desc: "Premium Ugandan coffee", href: "/products/coffee", img: "/products/coffee/lifestyle.png" },
  { label: "Logistics", desc: "Freight & supply chain", href: "/products/logistics", img: "/products/logistics/truck-day.png" },
];

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ PURPOSE BAND ════════════════════════════════════════════════ */}
        <StatementBand image="/hero/purpose.png" />

        {/* ══ WHO WE ARE ══════════════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <Reveal>
              <span className="eyebrow block mb-4">Who We Are</span>
              <h2 className="mb-6" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E" }}>
                A diversified company<br />built for the long term.
              </h2>
              <p className="mb-5" style={{ fontSize: "16px", lineHeight: 1.75, color: "#555555" }}>
                Vitorra Holdings Limited operates across agriculture, healthcare,
                premium coffee, and logistics — bringing international standards
                to East African markets, and East African products to the world.
              </p>
              <p style={{ fontSize: "16px", lineHeight: 1.75, color: "#555555" }}>
                From fuel-saving technology for commercial fleets to clinical-grade
                wound care, traceable Ugandan coffee, and end-to-end logistics —
                every line is held to one standard: dependable products, delivered
                with integrity.
              </p>
            </Reveal>
            <Reveal delay={120} direction="left">
              <ParallaxImage
                src="/hero/overview.png"
                alt="Kampala skyline and cultivated East African landscape at golden hour"
                className="aspect-[4/3] rounded-[40px] shadow-card"
              />
            </Reveal>
          </div>
        </section>

        {/* ══ VALUES ══════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">
            <Reveal className="mb-12 max-w-2xl">
              <span className="eyebrow block mb-3">What we stand for</span>
              <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "460px" }}>
                Our values in practice.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {values.map((v, i) => (
                <Reveal key={v.n} delay={i * 90}>
                  <div className="bg-white rounded-[24px] p-7 border border-black/[0.05] h-full hover-lift">
                    <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "40px", fontWeight: 700, lineHeight: 1, letterSpacing: "-0.03em", color: "#D4C49A", display: "block", marginBottom: "16px" }}>{v.n}</span>
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>{v.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{v.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ SECTORS ═════════════════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max">
            <Reveal className="mb-12 max-w-2xl">
              <span className="eyebrow block mb-3">Our portfolio</span>
              <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "420px" }}>
                Four lines.<br />One trusted name.
              </h2>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {sectors.map((s, i) => (
                <Reveal key={s.label} delay={i * 80}>
                  <Link href={s.href} className="group block bg-white rounded-[24px] overflow-hidden border border-black/[0.05] hover-lift">
                    <div className="relative aspect-square overflow-hidden">
                      <Image src={s.img} alt={s.label} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]" />
                      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)" }} />
                    </div>
                    <div className="p-4 md:p-5">
                      <h3 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "15px", fontWeight: 600, color: "#1E1E1E", letterSpacing: "-0.01em" }}>{s.label}</h3>
                      <p className="text-xs mt-1" style={{ color: "#888888" }}>{s.desc}</p>
                    </div>
                    <div className="px-4 md:px-5 pb-4 md:pb-5">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold group-hover:opacity-60 transition-opacity" style={{ color: "#7A6020" }}>
                        Learn more<ArrowRight className="w-3 h-3 arrow-nudge" />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ REGISTRATION ════════════════════════════════════════════════ */}
        <Reveal className="container-max px-6 md:px-12 lg:px-20 pb-4">
          <div className="rounded-[20px] px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: "rgba(197,178,122,0.1)", border: "1px solid rgba(197,178,122,0.3)" }}>
            <p className="text-sm" style={{ color: "#555555" }}>
              <span className="font-semibold" style={{ color: "#1E1E1E" }}>Vitorra Holdings Limited</span> — Registered in Uganda, Reg. No. 80034340923220 (URSB)
            </p>
            <Link href="/trust/certifications" className="inline-flex items-center gap-1.5 text-sm font-semibold shrink-0 hover:opacity-60 transition-opacity group" style={{ color: "#7A6020" }}>
              View certifications<ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
            </Link>
          </div>
        </Reveal>

        {/* ══ TEAM ════════════════════════════════════════════════════════ */}
        <Team />

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
        <FinalCTA
          titleLead="Ready to work with"
          titleAccent="Vitorra?"
          body="Whether you need a fuel savings assessment, a logistics quote, or premium Ugandan coffee — our team responds within 24 hours."
          primaryLabel="Request a Quote"
          primaryHref="/enquire"
        />

      </main>
      <Footer />
    </>
  );
}
