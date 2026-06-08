import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Reveal } from "@/components/ui/reveal";
import CartView from "@/components/shop/CartView";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";

export const metadata: Metadata = {
  title: "Your Cart — Vitorra Coffee Shop",
  description: "Review your Vitorra Coffee order and check out.",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  if (!COFFEE_SHOP_ENABLED) redirect("/shop");

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>
        <section className="pt-28 md:pt-32 pb-16 md:pb-24 px-6 md:px-12 lg:px-20">
          <div className="container-max mb-10">
            <Reveal>
              <span className="eyebrow block mb-3">Vitorra Coffee</span>
              <h1
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(34px, 4.5vw, 60px)",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                  lineHeight: 1.05,
                  color: "#1E1E1E",
                }}
              >
                Your cart.
              </h1>
            </Reveal>
          </div>

          <CartView />
        </section>
      </main>
      <Footer />
    </>
  );
}
