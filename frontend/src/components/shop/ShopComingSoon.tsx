import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import { ArrowRight, ArrowUpRight, Store, Globe, Bell } from "lucide-react";

/* ─── Coffee retail — launching soon ──────────────────────────────────────────
   Shown at /shop while the retail store is gated (COFFEE_SHOP_ENABLED = false).
   Premium holding page that keeps the brand intact and routes every visitor to
   the enquiry form — wholesale & export buyers can transact today, retail
   customers register their interest. No cart, no prices.                       */

const paths = [
  {
    icon: Store,
    title: "Wholesale",
    body: "Stocking a café, hotel, restaurant, or store? We supply by the kilo, today.",
    cta: "Enquire wholesale",
    href: "/enquire?sector=COFFEE",
  },
  {
    icon: Globe,
    title: "Export",
    body: "Sourcing traceable Ugandan coffee at volume for international markets.",
    cta: "Enquire export",
    href: "/enquire?sector=COFFEE",
  },
  {
    icon: Bell,
    title: "Retail",
    body: "Home & office packs are launching shortly. Tell us and we'll be in touch first.",
    cta: "Register your interest",
    href: "/enquire?sector=COFFEE",
  },
];

export default function ShopComingSoon() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col"
          style={{ minHeight: "72vh", backgroundColor: "#111111" }}
        >
          <div className="absolute inset-0">
            <Image
              src="/hero/coffee.png"
              alt="Ripe coffee cherries at sunrise on the slopes of Mount Elgon, Uganda"
              fill priority sizes="100vw"
              className="object-cover"
              style={{ animation: "vitorra-ken-burns 16s ease-out both" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.25) 100%)" }}
            />
          </div>

          <div aria-hidden="true" className="hero-aurora-right" />
          <div aria-hidden="true" className="hero-grain" />

          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 mt-auto pb-16 md:pb-20 pt-32">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">Vitorra Coffee · Retail launching soon</span>
              <h1
                className="max-w-2xl mb-5"
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(40px, 5.5vw, 72px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                  color: "#FFFFFF",
                }}
              >
                The taste of Uganda,{" "}
                <span className="text-gold-gradient">almost ready.</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                Our single-origin GOLD retail store is putting on its final
                polish. Wholesale and export buyers can order today — and we&apos;ll
                tell you the moment retail packs go live.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 hero-cta">
                <Link href="/enquire?sector=COFFEE" className="btn-primary">
                  Enquire — Wholesale &amp; Export
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/products/coffee" className="btn-ghost-dark">
                  Our coffee story
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ PATHS ═══════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 max-w-2xl">
              <span className="eyebrow block mb-3">In the meantime</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(28px, 3.5vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  color: "#1E1E1E",
                  maxWidth: "480px",
                }}
              >
                There&apos;s already a way to get our coffee.
              </h2>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {paths.map((p, i) => (
                <Reveal key={p.title} delay={i * 90}>
                  <Link
                    href={p.href}
                    className="group flex flex-col h-full rounded-[24px] p-7 glow-card"
                    style={{
                      background: "linear-gradient(145deg, #FFFFFF 0%, #FAF8F4 100%)",
                      border: "1px solid rgba(197,178,122,0.14)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    }}
                  >
                    <span
                      className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                      style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                    >
                      <p.icon className="w-6 h-6" />
                    </span>
                    <h3
                      className="mb-2"
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 600, color: "#1E1E1E" }}
                    >
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#555555" }}>{p.body}</p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#7A6020" }}>
                      {p.cta}
                      <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
