import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import StatementBand from "@/components/sections/StatementBand";
import Team from "@/components/sections/Team";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "About — Vitorra Holdings Limited",
  description:
    "Vitorra Holdings Limited is a diversified company operating across agriculture, healthcare, premium coffee, and logistics — bringing international standards to East African markets.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>
        {/* Purpose statement — relocated from the homepage */}
        <StatementBand image="/hero/purpose.png" />

        {/* Who we are */}
        <section className="section-padding">
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 lg:items-start">
            <Reveal>
              <span className="eyebrow block mb-4">Who We Are</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, Georgia, serif)",
                  fontSize: "clamp(28px, 3.2vw, 44px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.12,
                  color: "#1E1E1E",
                }}
              >
                A diversified company<br />built for the long term.
              </h2>
            </Reveal>

            <Reveal delay={120}>
              <p className="mb-5" style={{ fontSize: "16px", lineHeight: 1.75, color: "#555555" }}>
                Vitorra Holdings Limited operates across agriculture, healthcare,
                premium coffee, and logistics — bringing international standards
                to East African markets, and East African products to the world.
              </p>
              <p style={{ fontSize: "16px", lineHeight: 1.75, color: "#555555" }}>
                From fuel-saving technology for commercial fleets to clinical-grade
                wound care, traceable Ugandan coffee, and end-to-end logistics,
                every line is held to one standard: dependable products, delivered
                with integrity.
              </p>
            </Reveal>
          </div>
        </section>

        {/* Full leadership constellation */}
        <Team />
      </main>
      <Footer />
    </>
  );
}
