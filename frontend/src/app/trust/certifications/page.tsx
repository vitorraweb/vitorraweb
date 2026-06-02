import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Certifications from "@/components/sections/Certifications";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { Fuel, HeartPulse, Coffee, Truck, ShieldCheck, Eye, FileCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Certifications & Trust — Vitorra Holdings Limited",
  description:
    "Vitorra Holdings is a registered Ugandan company (URSB). Every product line is backed by certification, validation, or documentation — available on request.",
};

const assurances = [
  { icon: Fuel, label: "Fuel Eco Tech", body: "Validated fuel-saving technology. Performance data and validation details available on request.", href: "/enquire?sector=FET" },
  { icon: HeartPulse, label: "SEAL Wound Spray", body: "Clinical-grade formulation. Specifications, certifications, and compliance documentation provided to procurement.", href: "/enquire?sector=SEAL" },
  { icon: Coffee, label: "Vitorra Coffee", body: "Single-origin and traceable — ethical sourcing with farm-to-cup traceability and sustainability practices.", href: "/enquire?sector=COFFEE" },
  { icon: Truck, label: "Logistics Services", body: "Compliant cross-border operations — customs documentation and clearance handled to standard.", href: "/enquire?sector=LOGISTICS" },
];

const principles = [
  { icon: ShieldCheck, title: "Verified products", body: "Every product line is backed by validation, certification, or documentation we can share." },
  { icon: Eye, title: "Transparent sourcing", body: "From single-origin coffee to cross-border freight, we can trace and evidence our chain." },
  { icon: FileCheck, title: "Registered & accountable", body: "A registered Ugandan company operating to legal and regulatory standards." },
];

export default function CertificationsPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ INTRO ═══════════════════════════════════════════════════════ */}
        <section className="px-6 md:px-12 lg:px-20 pb-12 md:pb-16" style={{ paddingTop: "clamp(128px, 12vh, 168px)" }}>
          <Reveal className="container-max max-w-3xl">
            <span className="eyebrow block mb-4">Trust &amp; Compliance</span>
            <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(36px, 4.5vw, 58px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.06, color: "#1E1E1E" }}>
              Proof you can verify.
            </h1>
            <p className="mt-6 max-w-xl" style={{ fontSize: "17px", lineHeight: 1.7, color: "#555555" }}>
              Vitorra Holdings is a registered Ugandan company, and every product we
              offer is backed by certification, validation, or documentation —
              available whenever you need it.
            </p>
          </Reveal>
        </section>

        {/* ══ OFFICIAL REGISTRATION (reused credential card) ══════════════ */}
        <Certifications />

        {/* ══ PRODUCT ASSURANCE ═══════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max">
            <Reveal className="mb-12 max-w-2xl">
              <span className="eyebrow block mb-3">Across every product</span>
              <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "480px" }}>
                Backed by the paperwork.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assurances.map((a, i) => (
                <Reveal key={a.label} delay={i * 80}>
                  <div className="bg-white rounded-[24px] p-7 border border-black/[0.05] h-full hover-lift flex flex-col">
                    <span className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                      <a.icon className="w-6 h-6" />
                    </span>
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E" }}>{a.label}</h3>
                    <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#555555" }}>{a.body}</p>
                    <Link href={a.href} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-60 transition-opacity group" style={{ color: "#1E1E1E" }}>
                      Request documentation<ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PRINCIPLES ══════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">
            <Reveal className="mb-12 text-center">
              <span className="eyebrow justify-center mb-3">Our commitment</span>
              <h2 className="mx-auto" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "460px" }}>
                Trust, by design.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {principles.map((p, i) => (
                <Reveal key={p.title} delay={i * 90}>
                  <div className="bg-white rounded-[24px] p-7 border border-black/[0.05] h-full hover-lift text-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                      <p.icon className="w-6 h-6" />
                    </span>
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>{p.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA — shared homepage style ═══════════════════════════ */}
        <FinalCTA
          eyebrow="Documentation"
          titleLead="Need certifications or"
          titleAccent="lab results?"
          body="Request the documentation for any Vitorra product and our team will share it — within 24 hours."
          primaryLabel="Request Documentation"
          primaryHref="/enquire"
          caption="Registered  ·  Verified  ·  Reply within 24 hours"
        />

      </main>
      <Footer />
    </>
  );
}
