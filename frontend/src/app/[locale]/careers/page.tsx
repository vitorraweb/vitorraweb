import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { Target, Globe, Sprout, Users, ArrowRight, ArrowUpRight, Mail } from "lucide-react";
import { CONTACT_EMAIL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.careers" });
  return { title: t("title"), description: t("description") };
}

// Applications go straight to the team inbox (no ATS).
const APPLY_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Careers application")}`;

export default function CareersPage() {
  const t = useTranslations("careersPage");

  const perks = [
    { icon: Target, title: t("perk1Title"), body: t("perk1Body") },
    { icon: Globe,  title: t("perk2Title"), body: t("perk2Body") },
    { icon: Sprout, title: t("perk3Title"), body: t("perk3Body") },
    { icon: Users,  title: t("perk4Title"), body: t("perk4Body") },
  ];

  const steps = [
    { n: "01", title: t("step1Title"), body: t("step1Body") },
    { n: "02", title: t("step2Title"), body: t("step2Body") },
    { n: "03", title: t("step3Title"), body: t("step3Body") },
  ];

  const departments = [
    t("dept1"), t("dept2"), t("dept3"), t("dept4"), t("dept5"), t("dept6"),
  ];

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col"
          style={{
            minHeight: "82vh",
            background:
              "radial-gradient(circle at 22% 18%, rgba(197,178,122,0.16) 0%, transparent 55%), linear-gradient(160deg, #181818 0%, #242424 100%)",
          }}
        >
          <div aria-hidden="true" className="hero-aurora-right" />
          <div aria-hidden="true" className="hero-grain" />

          <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 mt-auto pt-28 pb-16 md:pb-24">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">{t("heroEyebrow")}</span>
              <h1
                className="max-w-2xl mb-5"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(40px, 5.5vw, 72px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.05,
                  color:         "#FFFFFF",
                }}
              >
                {t("heroTitleLead")}{" "}
                <span className="text-gold-shimmer">{t("heroTitleAccent")}</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                {t("heroBody")}
              </p>

              <div className="flex flex-wrap gap-2 mb-9">
                {[t("heroPill1"), t("heroPill2"), t("heroPill3")].map((f) => (
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

              <div className="flex flex-col sm:flex-row gap-3">
                <a href={APPLY_HREF} className="btn-primary">
                  {t("heroCtaPrimary")}
                  <ArrowRight className="w-4 h-4" />
                </a>
                <Link href="/about" className="btn-ghost-dark">
                  {t("heroCtaSecondary")}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ WHY VITORRA (perks) ═════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}>
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">{t("perksEyebrow")}</span>
              <h2
                className="gold-underline"
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700,
                  letterSpacing: "-0.025em", lineHeight: 1.1, color: "#1E1E1E", maxWidth: "520px",
                }}
              >
                {t("perksTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {perks.map((p, i) => (
                <Reveal key={p.title} delay={i * 80}>
                  <div
                    className="glow-card rounded-[24px] p-7 h-full"
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
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E" }}>
                      {p.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ HOW WE HIRE (steps) ═════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">{t("hireEyebrow")}</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 700,
                  letterSpacing: "-0.025em", lineHeight: 1.1, color: "#1E1E1E", maxWidth: "440px",
                }}
              >
                {t("hireTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {steps.map((s, i) => (
                <Reveal key={s.n} delay={i * 90}>
                  <div className="rounded-[24px] p-8 h-full" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                        fontSize: "40px", fontWeight: 700, lineHeight: 1, color: "#C5B27A", letterSpacing: "-0.03em",
                      }}
                    >
                      {s.n}
                    </span>
                    <h3 className="mt-4 mb-2" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "21px", fontWeight: 600, color: "#1E1E1E" }}>
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{s.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ ROLES / GENERAL APPLICATION ═════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-start">
            <Reveal>
              <span className="eyebrow block mb-3">{t("rolesEyebrow")}</span>
              <h2
                style={{
                  fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize: "clamp(26px, 3.2vw, 44px)", fontWeight: 700,
                  letterSpacing: "-0.025em", lineHeight: 1.1, color: "#1E1E1E", maxWidth: "360px",
                }}
              >
                {t("rolesTitle")}
              </h2>
              <p className="mt-5 text-sm leading-relaxed" style={{ color: "#555555", maxWidth: "420px" }}>
                {t("rolesBody")}
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                {departments.map((d) => (
                  <span
                    key={d}
                    className="px-4 py-2 rounded-full"
                    style={{ background: "#FAFAF8", border: "1px solid rgba(0,0,0,0.07)", fontSize: "13px", fontWeight: 500, color: "#1E1E1E" }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </Reveal>

            <Reveal delay={120}>
              <div
                className="rounded-[28px] p-8 md:p-10"
                style={{ background: "linear-gradient(145deg, #FAF8F4 0%, #FFFFFF 100%)", border: "1px solid rgba(197,178,122,0.2)" }}
              >
                <span
                  className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                  style={{ background: "rgba(197,178,122,0.16)", color: "#7A6020" }}
                >
                  <Mail className="w-6 h-6" />
                </span>
                <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "24px", fontWeight: 600, color: "#1E1E1E" }}>
                  {t("noteTitle")}
                </h3>
                <p className="text-sm leading-relaxed mb-7" style={{ color: "#555555" }}>
                  {t("noteBody")}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <a href={APPLY_HREF} className="btn-primary">
                    {t("applyCta")}
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <span className="text-sm" style={{ color: "#999999" }}>{t("orLabel")}</span>
                  <Link href="/contact" className="text-sm font-semibold underline" style={{ color: "#1E1E1E" }}>
                    {t("contactCta")}
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <FinalCTA
          titleLead={t("finalCtaTitleLead")}
          titleAccent={t("finalCtaTitleAccent")}
          body={t("finalCtaBody")}
          primaryLabel={t("contactCta")}
          primaryHref="/contact"
          caption={t("finalCtaCaption")}
        />

      </main>
      <Footer />
    </>
  );
}
