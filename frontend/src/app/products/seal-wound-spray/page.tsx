import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { Faq } from "@/components/ui/faq";
import { Zap, ShieldCheck, PackageCheck, Briefcase, Building2, Ambulance, Shield, HeartHandshake, Stethoscope, ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "SEAL Wound Spray — Clinical-Grade Hemostatic Control",
  description:
    "SEAL is a clinical-grade hemostatic wound spray for hospitals, emergency responders, NGOs, and military procurement — single-use, sterile, and field-ready. Request product information.",
};

const ENQUIRE = "/enquire?sector=SEAL";

const benefits = [
  { icon: Zap, title: "Rapid bleeding control", body: "Designed to help control bleeding fast — for the moments where seconds matter most." },
  { icon: ShieldCheck, title: "Clinical-grade", body: "Formulated to a professional standard for hospital, surgical, and emergency use." },
  { icon: PackageCheck, title: "Single-use & sterile", body: "Each unit is sealed, sterile, and ready — no preparation, no cross-contamination." },
  { icon: Briefcase, title: "Field-ready", body: "Compact and rugged for trauma kits, ambulances, and procurement at scale." },
];

const steps = [
  { n: "01", title: "Always within reach", body: "Single-use and compact — sized for trauma kits, ambulances, clinics, and field packs." },
  { n: "02", title: "Ready in seconds", body: "No setup or preparation. Designed for fast, confident use under pressure." },
  { n: "03", title: "Supplied at scale", body: "From individual units to institutional procurement for hospitals, responders, and defence." },
];

const audiences = [
  { icon: Building2, label: "Hospitals & clinics" },
  { icon: Ambulance, label: "Emergency responders" },
  { icon: Shield, label: "Military & defence" },
  { icon: HeartHandshake, label: "NGOs & humanitarian" },
  { icon: Stethoscope, label: "Surgical & trauma units" },
];

const faqs = [
  { q: "What is SEAL Wound Spray?", a: "SEAL is a clinical-grade hemostatic wound spray designed to help control bleeding in professional and emergency settings — for hospitals, responders, and field use." },
  { q: "Who is it for?", a: "It's supplied to hospitals and clinics, emergency and EMS responders, NGOs and humanitarian organisations, and military and defence procurement." },
  { q: "Is each unit single-use?", a: "Yes. Every unit is sealed, sterile, and single-use — ready to deploy from a trauma kit or field pack with no preparation." },
  { q: "Can I order at procurement volumes?", a: "Yes. We support institutional and bulk procurement. Request product information and our team will share pricing and supply options for your volumes." },
  { q: "How do I get specifications and certifications?", a: "Request product information and our team will provide the full specifications, certifications, and compliance documentation for your review." },
];

export default function SealWoundSprayPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden flex flex-col justify-end" style={{ minHeight: "82vh", backgroundColor: "#161616" }}>
          <div className="absolute inset-0">
            <Image src="/hero/seal.png" alt="Emergency responder preparing SEAL wound spray from a trauma kit" fill priority sizes="100vw" className="object-cover" style={{ animation: "vitorra-ken-burns 16s ease-out both" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.3) 100%)" }} />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 pb-16 md:pb-20">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">SEAL Wound Spray · Medical · B2B</span>
              <h1 className="max-w-2xl mb-5" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, color: "#FFFFFF" }}>
                Stop bleeding fast.{" "}<span className="text-gold-gradient">Save lives.</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                Clinical-grade hemostatic wound control for hospitals, emergency
                responders, and military procurement — engineered for the moments
                that matter most.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={ENQUIRE} className="btn-primary">Request Product Information<ArrowRight className="w-4 h-4" /></Link>
                <Link href="/contact" className="btn-ghost-dark">Talk to our team<ArrowUpRight className="w-4 h-4" /></Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BENEFITS ════════════════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">Why SEAL</span>
              <h2 className="gold-underline" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "520px" }}>
                Control when it counts.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((b, i) => (
                <Reveal key={b.title} delay={i * 80}>
                  <div className="bg-white rounded-[24px] p-7 border border-black/[0.05] h-full hover-lift">
                    <span className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                      <b.icon className="w-6 h-6" />
                    </span>
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>{b.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{b.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW IT'S USED ═══════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <ParallaxImage src="/products/seal/in-hand.png" alt="Gloved hand holding SEAL wound spray in a clinical setting" className="aspect-[4/3] rounded-[40px] shadow-card" />
            </Reveal>
            <div>
              <Reveal>
                <span className="eyebrow block mb-3">Built for the field</span>
                <h2 className="mb-8" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E" }}>
                  Where every<br />second counts.
                </h2>
              </Reveal>
              <div className="space-y-7">
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 90}>
                    <div className="flex items-start gap-5">
                      <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "30px", fontWeight: 700, lineHeight: 1, color: "#D4C49A" }}>{s.n}</span>
                      <div>
                        <h3 className="mb-1.5" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "19px", fontWeight: 600, color: "#1E1E1E" }}>{s.title}</h3>
                        <p className="text-sm leading-relaxed max-w-md" style={{ color: "#555555" }}>{s.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ MEDIA BAND ══════════════════════════════════════════════════ */}
        <section className="section-padding">
          <Reveal className="container-max">
            <div className="card-stadium relative shadow-card" style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
              <Image src="/products/seal/trauma-tray.png" alt="SEAL wound spray on a sterile trauma tray beside a first-aid kit" fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 55%)" }} />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">Trusted where it counts</span>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                  Ready the moment you are.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ WHO IT'S FOR ════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}>
          <div className="container-max">
            <Reveal className="mb-10 text-center">
              <span className="eyebrow-light mb-3 inline-flex">Who it&apos;s for</span>
              <h2 className="max-w-xl mx-auto" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#FFFFFF" }}>
                Where lives are on the line.
              </h2>
            </Reveal>
            <Reveal className="flex flex-wrap justify-center gap-3 md:gap-4">
              {audiences.map((a) => (
                <div key={a.label} className="flex items-center gap-2.5 px-5 py-3 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <a.icon className="w-4 h-4" style={{ color: "#C5B27A" }} />
                  <span className="text-sm font-medium">{a.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ═════════════════════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
            <Reveal>
              <span className="eyebrow block mb-3">Questions</span>
              <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "320px" }}>
                Everything you need to know.
              </h2>
              <p className="mt-5 text-sm" style={{ color: "#666666" }}>
                Need specifications or compliance documents?{" "}
                <Link href="/contact" className="font-semibold underline" style={{ color: "#1E1E1E" }}>Talk to our team.</Link>
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA — shared homepage style ═══════════════════════════ */}
        <FinalCTA
          titleLead="Equip your team with"
          titleAccent="SEAL."
          body="Request product information and our team will share specifications, certifications, and procurement options — within 24 hours."
          primaryLabel="Request Product Information"
          primaryHref={ENQUIRE}
          caption="Procurement-ready  ·  Clinical-grade  ·  Reply within 24 hours"
        />

      </main>
      <Footer />
    </>
  );
}
