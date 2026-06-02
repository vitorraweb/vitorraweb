import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { Faq } from "@/components/ui/faq";
import FinalCTA from "@/components/sections/FinalCTA";
import { Fuel, Wrench, Leaf, LineChart, Truck, Boxes, Factory, Tractor, Bus, ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Fuel Eco Tech — Proven Fuel Savings for Fleets",
  description:
    "Fuel Eco Tech is validated fuel-saving technology for commercial fleets across East Africa — lower fuel costs, extended engine life, and reduced emissions. Request a fuel savings assessment.",
};

const ENQUIRE = "/enquire?sector=FET";

const benefits = [
  { icon: Fuel, title: "Lower fuel costs", body: "Reduce diesel and petrol consumption across your fleet — directly improving your bottom line." },
  { icon: Wrench, title: "Extended engine life", body: "A cleaner, more complete burn means less build-up and wear on critical engine components." },
  { icon: Leaf, title: "Reduced emissions", body: "Burning fuel more efficiently lowers harmful exhaust output — better for compliance and the environment." },
  { icon: LineChart, title: "Measurable ROI", body: "We benchmark your consumption before and after, so the savings are visible — not guesswork." },
];

const steps = [
  { n: "01", title: "Fitted to your fleet", body: "Fuel Eco Tech integrates with your existing fuel system. Our team confirms compatibility during your assessment." },
  { n: "02", title: "Optimises every burn", body: "It conditions the fuel for a cleaner, more complete combustion — so less is wasted on every kilometre." },
  { n: "03", title: "Measured results", body: "We establish your baseline consumption, then track the difference — giving you a clear return on investment." },
];

const audiences = [
  { icon: Truck, label: "Fleet operators" },
  { icon: Boxes, label: "Logistics & transport" },
  { icon: Factory, label: "Manufacturing & plant" },
  { icon: Tractor, label: "Agriculture & machinery" },
  { icon: Bus, label: "Bus & taxi operators" },
];

const faqs = [
  { q: "What vehicles is Fuel Eco Tech suitable for?", a: "It is designed for diesel and petrol engines across commercial fleets — from single vehicles to large operations. We confirm suitability for your specific vehicles during your free assessment." },
  { q: "Do I need to modify my engine?", a: "No. Fuel Eco Tech is designed to work with your existing fuel system without engine modification. Our team handles fitting and confirms everything during installation." },
  { q: "How do you prove the savings?", a: "We establish your current fuel consumption as a baseline, then measure consumption after fitting — so the difference is transparent and tied to real data from your fleet." },
  { q: "Is there a minimum fleet size?", a: "No. Fuel Eco Tech works for a single vehicle or an entire fleet. Larger fleets simply see the savings multiply across every vehicle." },
  { q: "How do I get started?", a: "Request a fuel savings assessment. We'll review your fleet, fuel usage, and goals, then come back with tailored options and expected outcomes — at no obligation." },
];

export default function FuelEcoTechPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden flex flex-col justify-end" style={{ minHeight: "82vh", backgroundColor: "#161616" }}>
          <div className="absolute inset-0">
            <Image src="/products/fet/in-hand.png" alt="Fuel Eco Tech fitted on a commercial fleet engine" fill priority sizes="100vw" className="object-cover" style={{ animation: "vitorra-ken-burns 16s ease-out both" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.25) 100%)" }} />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 pb-16 md:pb-20">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">Fuel Eco Technology · B2B · Fleet</span>
              <h1 className="max-w-2xl mb-5" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, color: "#FFFFFF" }}>
                Proven fuel savings.{" "}<span className="text-gold-gradient">Measurable results.</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                Validated fuel-saving technology trusted by fleet operators across
                East Africa — cutting fuel costs and extending engine life, with a
                return you can measure.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={ENQUIRE} className="btn-primary">Request a Fuel Savings Assessment<ArrowRight className="w-4 h-4" /></Link>
                <Link href="/contact" className="btn-ghost-dark">Talk to our team<ArrowUpRight className="w-4 h-4" /></Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BENEFITS ════════════════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">Why Fuel Eco Tech</span>
              <h2 className="gold-underline" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "520px" }}>
                Every litre, working harder.
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

        {/* ══ HOW IT WORKS ════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <ParallaxImage src="/products/fet/installed.png" alt="Fuel Eco Tech installed in an engine bay" className="aspect-[4/3] rounded-[40px] shadow-card" />
            </Reveal>
            <div>
              <Reveal>
                <span className="eyebrow block mb-3">How it works</span>
                <h2 className="mb-8" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E" }}>
                  Simple to fit.<br />Built to perform.
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

        {/* ══ VIDEO SHOWCASE ══════════════════════════════════════════════ */}
        <section className="section-padding">
          <Reveal className="container-max">
            <div className="card-stadium relative shadow-card" style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
              <video src="/videos/fet.mp4" poster="/videos/fet-poster.jpg" autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.1) 50%)" }} />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">See it in action</span>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                  Engineered for the road ahead.
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
                Built for anyone who runs on fuel.
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
                Can&apos;t find your answer?{" "}
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
          titleLead="Ready to cut your"
          titleAccent="fuel bill?"
          body="Book a no-obligation fuel savings assessment. We'll review your fleet and come back with tailored options and expected results."
          primaryLabel="Request a Fuel Savings Assessment"
          primaryHref={ENQUIRE}
          caption="No obligation  ·  Tailored to your fleet  ·  Reply within 24 hours"
        />

      </main>
      <Footer />
    </>
  );
}
