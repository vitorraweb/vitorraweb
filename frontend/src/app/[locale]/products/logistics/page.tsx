import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { Faq } from "@/components/ui/faq";
import {
  Route, Globe, Activity, ShieldCheck,
  Ship, Factory, Store, Wheat, HeartHandshake,
  ArrowRight, ArrowUpRight,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.logistics" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE = "/enquire?sector=LOGISTICS";

export default function LogisticsPage() {
  const t = useTranslations("logisticsPage");

  const benefits = [
    { icon: Route,       title: t("benefit1Title"), body: t("benefit1Body") },
    { icon: Globe,       title: t("benefit2Title"), body: t("benefit2Body") },
    { icon: Activity,    title: t("benefit3Title"), body: t("benefit3Body") },
    { icon: ShieldCheck, title: t("benefit4Title"), body: t("benefit4Body") },
  ];

  const capabilities = [
    { title: t("cap1Title"), body: t("cap1Body"), img: "/products/logistics/truck-day.png",    alt: t("cap1Alt") },
    { title: t("cap2Title"), body: t("cap2Body"), img: "/products/logistics/warehouse.png",    alt: t("cap2Alt") },
    { title: t("cap3Title"), body: t("cap3Body"), img: "/products/logistics/customs.png",      alt: t("cap3Alt") },
    { title: t("cap4Title"), body: t("cap4Body"), img: "/products/logistics/control-room.png", alt: t("cap4Alt") },
  ];

  const audiences = [
    { icon: Ship,           label: t("audience1") },
    { icon: Factory,        label: t("audience2") },
    { icon: Store,          label: t("audience3") },
    { icon: Wheat,          label: t("audience4") },
    { icon: HeartHandshake, label: t("audience5") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ HERO ════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col"
          style={{ minHeight: "88vh", backgroundColor: "#111111" }}
        >
          <div className="absolute inset-0">
            <Image
              src="/hero/logistics.png"
              alt="Container freight truck on a highway"
              fill priority sizes="100vw"
              className="object-cover"
              style={{ animation: "vitorra-ken-burns 16s ease-out both" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.90) 0%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.22) 100%)" }}
            />
          </div>

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
                <span className="text-gold-gradient">{t("heroTitleAccent")}</span>
              </h1>
              <p className="max-w-xl mb-9" style={{ fontSize: "17px", lineHeight: 1.75, color: "rgba(255,255,255,0.65)" }}>
                {t("heroBody")}
              </p>

              <div className="flex flex-wrap gap-2 mb-9">
                {[t("heroPill1"), t("heroPill2"), t("heroPill3"), t("heroPill4")].map((f) => (
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

              <div className="flex flex-col sm:flex-row gap-3 hero-cta">
                <Link href={ENQUIRE} className="btn-primary">
                  {t("heroCtaPrimary")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/contact" className="btn-ghost-dark">
                  {t("heroCtaSecondary")}
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ BENEFITS ════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">{t("benefitsEyebrow")}</span>
              <h2
                className="gold-underline"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                  maxWidth:      "520px",
                }}
              >
                {t("benefitsTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {benefits.map((b, i) => (
                <Reveal key={b.title} delay={i * 80}>
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
                      <b.icon className="w-6 h-6" />
                    </span>
                    <h3
                      className="mb-2"
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E" }}
                    >
                      {b.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{b.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CAPABILITIES ════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">
            <Reveal className="mb-12 lg:mb-16 max-w-2xl">
              <span className="eyebrow block mb-3">{t("capEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(28px, 3.5vw, 48px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                  maxWidth:      "420px",
                }}
              >
                {t("capTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {capabilities.map((c, i) => (
                <Reveal key={c.title} delay={i * 90}>
                  <div className="group glow-card rounded-[28px] overflow-hidden h-full flex flex-col" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: "16/10" }}>
                      <Image
                        src={c.img}
                        alt={c.alt}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-7">
                      <h3
                        className="mb-2"
                        style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 600, color: "#1E1E1E" }}
                      >
                        {c.title}
                      </h3>
                      <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{c.body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ MEDIA BAND ══════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F2F2F2" }}>
          <Reveal className="container-max">
            <div className="card-stadium relative shadow-card" style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
              <Image
                src="/products/logistics/truck-convoy.png"
                alt="Vitorra freight truck convoy"
                fill sizes="100vw"
                className="object-cover"
              />
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.1) 55%)" }}
              />
              <div className="absolute bottom-0 left-0 p-8 md:p-12">
                <span className="eyebrow-light mb-3 inline-flex">{t("mediaEyebrow")}</span>
                <p
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(22px, 3vw, 36px)",
                    fontWeight:    700,
                    color:         "#FFFFFF",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {t("mediaText")}
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ══ WHO WE SERVE ════════════════════════════════════════════════════ */}
        <section className="section-padding-sm" style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}>
          <div className="container-max text-center">
            <Reveal>
              <span className="eyebrow block mb-5">{t("audienceEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(26px, 3.2vw, 44px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                }}
              >
                <span style={{ color: "#1E1E1E" }}>{t("audienceTitleLead")}</span>
                <span style={{ color: "#AAAAAA" }}>{t("audienceTitleAccent")}</span>
              </h2>
            </Reveal>
            <Reveal delay={100} className="mt-8 flex flex-wrap justify-center gap-3">
              {audiences.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center gap-2.5 px-5 py-3 rounded-full"
                  style={{ background: "#FAFAF8", border: "1px solid rgba(0,0,0,0.07)" }}
                >
                  <a.icon className="w-4 h-4" style={{ color: "#C5B27A" }} />
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "#1E1E1E", whiteSpace: "nowrap" }}>{a.label}</span>
                </div>
              ))}
            </Reveal>
          </div>
        </section>

        {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
        <section
          className="section-padding"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "inset 0 1px 0 rgba(0,0,0,0.06)" }}
        >
          <div className="container-max grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-12 lg:gap-20">
            <Reveal>
              <span className="eyebrow block mb-3">{t("faqEyebrow")}</span>
              <h2
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(26px, 3vw, 42px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#1E1E1E",
                  maxWidth:      "320px",
                }}
              >
                {t("faqTitle")}
              </h2>
              <p className="mt-5 text-sm" style={{ color: "#666666" }}>
                {t("faqRoute")}{" "}
                <Link href={ENQUIRE} className="font-semibold underline" style={{ color: "#1E1E1E" }}>
                  {t("faqRequestQuote")}
                </Link>
              </p>
            </Reveal>
            <Reveal delay={120}>
              <Faq items={faqs} />
            </Reveal>
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════════ */}
        <FinalCTA
          titleLead={t("finalCtaTitleLead")}
          titleAccent={t("finalCtaTitleAccent")}
          body={t("finalCtaBody")}
          primaryLabel={t("heroCtaPrimary")}
          primaryHref={ENQUIRE}
          caption={t("finalCtaCaption")}
        />

      </main>
      <Footer />
    </>
  );
}
