import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/ui/faq";
import { Route, Globe, Activity, ShieldCheck, Ship, Factory, Store, Wheat, HeartHandshake, ArrowRight, ArrowUpRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Logistics Services — Freight, Warehousing & Supply Chain",
  description:
    "Vitorra Logistics — end-to-end freight, warehousing, customs clearance, and supply-chain management across Uganda, East Africa, and international corridors. Request a quote.",
};

const ENQUIRE = "/enquire?sector=LOGISTICS";

const benefits = [
  { icon: Route, title: "End-to-end", body: "Freight, warehousing, customs, and supply-chain — handled by one partner." },
  { icon: Globe, title: "Cross-border reach", body: "Across Uganda, East Africa, and international trade corridors." },
  { icon: Activity, title: "Real-time visibility", body: "Track shipments and stock from dispatch through to delivery." },
  { icon: ShieldCheck, title: "Reliable & secure", body: "Your goods handled with care and delivered on schedule, every time." },
];

const capabilities = [
  { title: "Freight", body: "Road, sea, and air freight — moving your goods reliably across borders.", img: "/products/logistics/truck-day.png", alt: "Vitorra-branded freight truck on the highway" },
  { title: "Warehousing", body: "Secure storage, inventory management, and order fulfilment.", img: "/products/logistics/warehouse.png", alt: "Organised Vitorra warehouse with racking and a forklift" },
  { title: "Customs clearance", body: "Documentation and clearance handled — no delays at the border.", img: "/products/logistics/customs.png", alt: "Vitorra customs clearance at a container port" },
  { title: "Supply-chain management", body: "End-to-end coordination and visibility, from origin to destination.", img: "/products/logistics/control-room.png", alt: "Vitorra logistics control room with a global network dashboard" },
];

const audiences = [
  { icon: Ship, label: "Importers & exporters" },
  { icon: Factory, label: "Manufacturers" },
  { icon: Store, label: "Retail & distribution" },
  { icon: Wheat, label: "Agriculture & commodities" },
  { icon: HeartHandshake, label: "NGOs & projects" },
];

const faqs = [
  { q: "What logistics services do you offer?", a: "Road, sea, and air freight; secure warehousing and fulfilment; customs clearance and documentation; and full supply-chain management — end to end." },
  { q: "Which regions do you cover?", a: "We move goods within Uganda, across East Africa, and through international trade corridors. Tell us your route and we'll confirm the best option." },
  { q: "Do you handle customs clearance?", a: "Yes. We manage the documentation and clearance process so your goods keep moving without delays at the border." },
  { q: "Can I track my shipment?", a: "Yes. We provide visibility from dispatch through to delivery, so you always know where your goods are." },
  { q: "How do I get a quote?", a: "Request a logistics quote with your origin, destination, and cargo details. Our team replies within 24 hours with tailored options." },
];

export default function LogisticsPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden flex flex-col justify-end" style={{ minHeight: "82vh", backgroundColor: "#161616" }}>
          <div className="absolute inset-0">
            <Image src="/hero/logistics.png" alt="Container freight truck on an open highway at sunset" fill priority sizes="100vw" className="object-cover" style={{ animation: "vitorra-ken-burns 16s ease-out both" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.25) 100%)" }} />
          </div>
          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 pb-16 md:pb-20">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">Logistics Services · B2B · Enterprise</span>
              <h1 className="max-w-2xl mb-5" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(40px, 5.5vw, 68px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, color: "#FFFFFF" }}>
                Move goods{" "}<span className="text-gold-gradient">with confidence.</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.7)" }}>
                End-to-end freight, warehousing, customs clearance, and supply-chain
                management across Uganda, East Africa, and beyond.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={ENQUIRE} className="btn-primary">Request a Logistics Quote<ArrowRight className="w-4 h-4" /></Link>
                <Link href="/contact" className="btn-ghost-dark">Talk to our team<ArrowUpRight className="w-4 h-4" /></Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BENEFITS ════════════════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">Why Vitorra Logistics</span>
              <h2 className="gold-underline" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "520px" }}>
                One partner, end to end.
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

        {/* ══ CAPABILITIES ════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">What we do</span>
              <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "420px" }}>
                Every link in the chain.
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {capabilities.map((c, i) => (
                <Reveal key={c.title} delay={i * 90}>
                  <div className="group bg-white rounded-[28px] overflow-hidden border border-black/[0.05] hover-lift h-full flex flex-col">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image src={c.img} alt={c.alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]" />
                    </div>
                    <div className="p-7">
                      <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "21px", fontWeight: 600, color: "#1E1E1E" }}>{c.title}</h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{c.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MEDIA BAND ══════════════════════════════════════════════════ */}
        <section className="section-padding">
          <Reveal className="container-max">
            <div className="card-stadium relative shadow-card" style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
              <Image src="/products/logistics/truck-convoy.png" alt="A convoy of Vitorra-branded freight trucks at sunset" fill sizes="100vw" className="object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 55%)" }} />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">Our network</span>
                <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(22px, 3vw, 34px)", fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
                  One network. End to end.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ WHO WE SERVE ════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}>
          <div className="container-max">
            <Reveal className="mb-10 text-center">
              <span className="eyebrow-light mb-3 inline-flex">Who we serve</span>
              <h2 className="max-w-xl mx-auto" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#FFFFFF" }}>
                Trusted to deliver.
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
                Have a specific route in mind?{" "}
                <Link href={ENQUIRE} className="font-semibold underline" style={{ color: "#1E1E1E" }}>Request a quote.</Link>
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA — shared homepage style ═══════════════════════════ */}
        <FinalCTA
          titleLead="Ready to move your"
          titleAccent="goods?"
          body="Tell us your route and cargo, and we'll come back with a tailored logistics quote — within 24 hours."
          primaryLabel="Request a Logistics Quote"
          primaryHref={ENQUIRE}
          caption="Uganda · East Africa · International  ·  Reply within 24 hours"
        />

      </main>
      <Footer />
    </>
  );
}
