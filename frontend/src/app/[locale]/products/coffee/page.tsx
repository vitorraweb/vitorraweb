import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { ParallaxImage } from "@/components/ui/parallax-image";
import { Faq } from "@/components/ui/faq";
import { Mountain, QrCode, Sprout, Flame, ShoppingBag, Store, Globe, ArrowRight, ArrowUpRight } from "lucide-react";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.coffee" });
  return { title: t("title"), description: t("description") };
}

const ENQUIRE = "/enquire?sector=COFFEE";

export default function CoffeePage() {
  const t = useTranslations("coffeePage");

  const specs: [string, string][] = [
    [t("spec1Key"), t("spec1Value")],
    [t("spec2Key"), t("spec2Value")],
    [t("spec3Key"), t("spec3Value")],
    [t("spec4Key"), t("spec4Value")],
    [t("spec5Key"), t("spec5Value")],
  ];

  const benefits = [
    { icon: Mountain, title: t("benefit1Title"), body: t("benefit1Body") },
    { icon: QrCode,   title: t("benefit2Title"), body: t("benefit2Body") },
    { icon: Sprout,   title: t("benefit3Title"), body: t("benefit3Body") },
    { icon: Flame,    title: t("benefit4Title"), body: t("benefit4Body") },
  ];

  const steps = [
    { n: "01", title: t("ftcStep1Title"), body: t("ftcStep1Body") },
    { n: "02", title: t("ftcStep2Title"), body: t("ftcStep2Body") },
    { n: "03", title: t("ftcStep3Title"), body: t("ftcStep3Body") },
  ];

  /* Retail self-serve is gated until prices are confirmed. While off, the retail
     path becomes a "register interest" enquiry instead of a shop link. */
  const retailWay = COFFEE_SHOP_ENABLED
    ? { icon: ShoppingBag, title: t("retailShopTitle"), body: t("retailShopBody"), href: "/shop", cta: t("retailShopCta") }
    : { icon: ShoppingBag, title: t("retailSoonTitle"), body: t("retailSoonBody"), href: ENQUIRE, cta: t("retailSoonCta") };

  const ways = [
    retailWay,
    { icon: Store, title: t("wholesaleTitle"), body: t("wholesaleBody"), href: ENQUIRE, cta: t("wholesaleCta") },
    { icon: Globe, title: t("exportTitle"),    body: t("exportBody"),    href: ENQUIRE, cta: t("exportCta") },
  ];

  /* Secondary CTA pointing at the shop — relabelled to the holding page while off. */
  const SHOP_CTA = COFFEE_SHOP_ENABLED
    ? { href: "/shop", label: t("shopVisit") }
    : { href: "/shop", label: t("shopSoon") };

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
              src="/hero/coffee.png"
              alt="Coffee cherries, Mount Elgon, Uganda"
              fill priority sizes="100vw"
              className="object-cover"
              style={{ animation: "vitorra-ken-burns 16s ease-out both" }}
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.40) 55%, rgba(0,0,0,0.22) 100%)" }}
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
                <Link href={SHOP_CTA.href} className="btn-ghost-dark">
                  {SHOP_CTA.label}
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

        {/* ══ THE BLEND — GOLD specs ═══════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right">
              <ParallaxImage
                src="/products/coffee/lifestyle.png"
                alt="Vitorra GOLD coffee"
                className="aspect-[4/3] rounded-[40px] shadow-card"
              />
            </Reveal>
            <div>
              <Reveal>
                <span className="eyebrow block mb-3">{t("blendEyebrow")}</span>
                <h2
                  className="mb-2"
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(26px, 3.2vw, 44px)",
                    fontWeight:    700,
                    letterSpacing: "-0.025em",
                    lineHeight:    1.1,
                    color:         "#1E1E1E",
                  }}
                >
                  {t("blendTitle")}
                </h2>
                <p className="mb-8" style={{ fontSize: "15px", lineHeight: 1.75, color: "#555555", maxWidth: "440px" }}>
                  {t("blendBody")}
                </p>
              </Reveal>
              <Reveal delay={120}>
                <dl className="border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                  {specs.map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-6 py-3.5 border-b"
                      style={{ borderColor: "rgba(0,0,0,0.08)" }}
                    >
                      <dt
                        className="text-[11px] font-bold uppercase tracking-[0.12em] shrink-0"
                        style={{ color: "#999999" }}
                      >
                        {k}
                      </dt>
                      <dd className="text-sm text-right font-medium" style={{ color: "#1E1E1E" }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ══ FARM TO CUP ═════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#FFFFFF" }}>
          <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="lg:order-2">
              <Reveal direction="left">
                <ParallaxImage
                  src="/products/coffee/farmer.png"
                  alt="Ugandan coffee farmer harvesting cherries"
                  className="aspect-[4/3] rounded-[40px] shadow-card"
                />
              </Reveal>
            </div>
            <div className="lg:order-1">
              <Reveal>
                <span className="eyebrow block mb-3">{t("ftcEyebrow")}</span>
                <h2
                  className="mb-8"
                  style={{
                    fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                    fontSize:      "clamp(26px, 3.2vw, 44px)",
                    fontWeight:    700,
                    letterSpacing: "-0.025em",
                    lineHeight:    1.1,
                    color:         "#1E1E1E",
                  }}
                >
                  {t("ftcTitleLine1")}<br />{t("ftcTitleLine2")}
                </h2>
              </Reveal>
              <div className="space-y-7">
                {steps.map((s, i) => (
                  <Reveal key={s.n} delay={i * 90}>
                    <div className="flex items-start gap-5">
                      <span
                        style={{
                          fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                          fontSize:      "32px",
                          fontWeight:    700,
                          lineHeight:    1,
                          color:         "#D4C49A",
                          flexShrink:    0,
                        }}
                      >
                        {s.n}
                      </span>
                      <div>
                        <h3
                          className="mb-1.5"
                          style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "19px", fontWeight: 600, color: "#1E1E1E" }}
                        >
                          {s.title}
                        </h3>
                        <p className="text-sm leading-relaxed max-w-md" style={{ color: "#555555" }}>{s.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ MEDIA BAND ══════════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <Reveal className="container-max">
            <div className="card-stadium relative shadow-card" style={{ aspectRatio: "16/9", maxHeight: "70vh" }}>
              <Image
                src="/products/coffee/beans.png"
                alt="Roasted Vitorra coffee beans"
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

        {/* ══ WAYS TO BUY ═════════════════════════════════════════════════════ */}
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

          <div className="container-max relative z-10">
            <Reveal className="mb-10 text-center">
              <span className="eyebrow-light mb-3 inline-flex">{t("waysEyebrow")}</span>
              <h2
                className="max-w-xl mx-auto"
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(26px, 3.2vw, 44px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.1,
                  color:         "#FFFFFF",
                }}
              >
                {t("waysTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {ways.map((w, i) => (
                <Reveal key={w.title} delay={i * 90}>
                  <Link
                    href={w.href}
                    className="group flex flex-col h-full rounded-[24px] p-7 glow-card"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
                  >
                    <span
                      className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5"
                      style={{ background: "rgba(197,178,122,0.16)", color: "#C5B27A" }}
                    >
                      <w.icon className="w-6 h-6" />
                    </span>
                    <h3
                      className="mb-2"
                      style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 600, color: "#FFFFFF" }}
                    >
                      {w.title}
                    </h3>
                    <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "rgba(255,255,255,0.52)" }}>
                      {w.body}
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#C5B27A" }}>
                      {w.cta}
                      <ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
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
                {t("faqWholesaleExport")}{" "}
                <Link href={ENQUIRE} className="font-semibold underline" style={{ color: "#1E1E1E" }}>
                  {t("faqSendEnquiry")}
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
          secondaryLabel={SHOP_CTA.label}
          secondaryHref={SHOP_CTA.href}
          caption={t("finalCtaCaption")}
        />

      </main>
      <Footer />
    </>
  );
}
