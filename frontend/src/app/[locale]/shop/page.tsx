import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import ShopGrid from "@/components/shop/ShopGrid";
import ShopComingSoon from "@/components/shop/ShopComingSoon";
import { getShopProducts } from "@/lib/coffee-catalog";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";
import { Truck, ShieldCheck, QrCode, ArrowRight } from "lucide-react";

/* Metadata adapts to the gate: while the store is off we tell the truth (and
   keep the holding page out of the index, so Google never ranks a "buy" page
   that can't sell). It flips back to the full shop listing with the flag. */
export const metadata: Metadata = COFFEE_SHOP_ENABLED
  ? {
      title: "Coffee Shop — Buy Premium Ugandan Coffee Online",
      description:
        "Shop Vitorra GOLD — single-origin 100% Arabica from Mount Elgon, Uganda. Roasted at origin, traceable farm to cup. Delivered across Uganda and internationally.",
    }
  : {
      title: "Vitorra Coffee — Retail Store Launching Soon",
      description:
        "Our single-origin GOLD retail store is launching soon. Wholesale and export buyers can order today — enquire for pricing and volumes.",
      robots: { index: false, follow: true },
    };

export const revalidate = 600;

const assurances = [
  { icon: QrCode, title: "Traceable, farm to cup", body: "Every bag carries a code that traces your coffee back to its source." },
  { icon: Truck, title: "Delivered to your door", body: "Kampala and nationwide delivery — international shipping on request." },
  { icon: ShieldCheck, title: "Roasted fresh in Uganda", body: "Sealed at origin for peak freshness and the true taste of Uganda." },
];

export default async function ShopPage() {
  // Retail store gated until prices are confirmed — show the premium holding page.
  if (!COFFEE_SHOP_ENABLED) return <ShopComingSoon />;

  const { products, isLive } = await getShopProducts();

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col"
          style={{ minHeight: "70vh", backgroundColor: "#111111" }}
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
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.42) 55%, rgba(0,0,0,0.25) 100%)" }}
            />
          </div>

          <div aria-hidden="true" className="hero-aurora-right" />
          <div aria-hidden="true" className="hero-grain" />

          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 mt-auto pb-16 md:pb-20 pt-32">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">Vitorra Coffee · Shop</span>
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
                <span className="text-gold-gradient">delivered.</span>
              </h1>
              <p className="max-w-xl mb-8" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                Single-origin GOLD — 100% Arabica from the highland slopes of
                Mount Elgon, roasted in Uganda and sealed fresh. Order online for
                your home, office, or as a gift.
              </p>
              <div className="flex flex-wrap gap-2">
                {["100% Arabica", "Single origin", "Roasted in Uganda", "Free delivery in Kampala"].map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em",
                      color: "rgba(255,255,255,0.55)",
                      border: "1px solid rgba(255,255,255,0.14)",
                      borderRadius: "999px", padding: "5px 14px",
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ PRODUCT GRID ════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <ShopGrid products={products} />

          {!isLive && (
            <div className="container-max mt-10">
              <p className="text-center text-xs" style={{ color: "#999999" }}>
                Showing our preview catalogue. Live stock and pricing go live with the store.
              </p>
            </div>
          )}
        </section>

        {/* ══ ASSURANCES ══════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 md:grid-cols-3 gap-5">
            {assurances.map((a, i) => (
              <Reveal key={a.title} delay={i * 80}>
                <div className="flex items-start gap-4">
                  <span
                    className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
                    style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                  >
                    <a.icon className="w-6 h-6" />
                  </span>
                  <div>
                    <h3
                      className="mb-1.5"
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "19px", fontWeight: 600, color: "#1E1E1E" }}
                    >
                      {a.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{a.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ══ WHOLESALE BRIDGE ════════════════════════════════════════════════ */}
        <section
          className="section-padding relative overflow-hidden"
          style={{ backgroundColor: "#141414" }}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 75% 25%, rgba(197,178,122,0.12) 0%, transparent 50%)" }}
          />
          <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />

          <div className="container-max relative z-10 text-center">
            <Reveal>
              <span className="eyebrow-light mb-4 inline-flex mx-auto">Buying for business?</span>
              <h2
                className="max-w-2xl mx-auto mb-5"
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(26px, 3.2vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.1,
                  color: "#FFFFFF",
                }}
              >
                Wholesale &amp; export volumes.
              </h2>
              <p className="max-w-md mx-auto mb-8" style={{ fontSize: "15px", lineHeight: 1.75, color: "rgba(255,255,255,0.55)" }}>
                Stocking a café, hotel, or store — or sourcing traceable Ugandan
                coffee at export volume? Our team will quote you within 24 hours.
              </p>
              <Link href="/enquire?sector=COFFEE" className="btn-primary">
                Enquire — Wholesale &amp; Export
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <FinalCTA
          eyebrow="Vitorra Coffee"
          titleLead="Taste the pride of"
          titleAccent="Africa."
          body="Single-origin GOLD, roasted in Uganda and delivered to your door. Have a question about an order? Our team replies within 24 hours."
          primaryLabel="Enquire — Wholesale & Export"
          primaryHref="/enquire?sector=COFFEE"
          secondaryLabel="About Vitorra Coffee"
          secondaryHref="/products/coffee"
          caption="Single origin · Traceable · Roasted in Uganda"
        />

      </main>
      <Footer />
    </>
  );
}
