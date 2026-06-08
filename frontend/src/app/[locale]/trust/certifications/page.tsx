import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Certifications from "@/components/sections/Certifications";
import FinalCTA from "@/components/sections/FinalCTA";
import { Reveal } from "@/components/ui/reveal";
import { Fuel, HeartPulse, Coffee, Truck, ShieldCheck, Eye, FileCheck, ArrowRight } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.trust" });
  return { title: t("title"), description: t("description") };
}

export default function CertificationsPage() {
  const t = useTranslations("trustPage");
  const tp = useTranslations("products");

  const assurances = [
    { icon: Fuel,      label: tp("fet.name"),        body: t("fetBody"),       href: "/enquire?sector=FET" },
    { icon: HeartPulse, label: tp("seal.name"),      body: t("sealBody"),      href: "/enquire?sector=SEAL" },
    { icon: Coffee,    label: tp("coffee.name"),     body: t("coffeeBody"),    href: "/enquire?sector=COFFEE" },
    { icon: Truck,     label: tp("logistics.name"),  body: t("logisticsBody"), href: "/enquire?sector=LOGISTICS" },
  ];

  const principles = [
    { icon: ShieldCheck, title: t("principle1Title"), body: t("principle1Body") },
    { icon: Eye,         title: t("principle2Title"), body: t("principle2Body") },
    { icon: FileCheck,   title: t("principle3Title"), body: t("principle3Body") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ INTRO ═══════════════════════════════════════════════════════ */}
        <section className="px-6 md:px-12 lg:px-20 pb-12 md:pb-16" style={{ paddingTop: "clamp(128px, 12vh, 168px)" }}>
          <Reveal className="container-max max-w-3xl">
            <span className="eyebrow block mb-4">{t("introEyebrow")}</span>
            <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(36px, 4.5vw, 58px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.06, color: "#1E1E1E" }}>
              {t("introTitle")}
            </h1>
            <p className="mt-6 max-w-xl" style={{ fontSize: "17px", lineHeight: 1.7, color: "#555555" }}>
              {t("introBody")}
            </p>
          </Reveal>
        </section>

        {/* ══ OFFICIAL REGISTRATION (reused credential card) ══════════════ */}
        <Certifications />

        {/* ══ PRODUCT ASSURANCE ═══════════════════════════════════════════ */}
        <section className="section-padding">
          <div className="container-max">
            <Reveal className="mb-12 max-w-2xl">
              <span className="eyebrow block mb-3">{t("assuranceEyebrow")}</span>
              <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(28px, 3.2vw, 44px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "480px" }}>
                {t("assuranceTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {assurances.map((a, i) => (
                <Reveal key={a.label} delay={i * 80}>
                  <div className="bg-white rounded-[24px] p-7 border border-black/[0.05] h-full hover-lift flex flex-col">
                    <span className="flex items-center justify-center w-12 h-12 rounded-2xl mb-5" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                      <a.icon className="w-6 h-6" />
                    </span>
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E" }}>{a.label}</h3>
                    <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: "#555555" }}>{a.body}</p>
                    <Link href={a.href} className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-60 transition-opacity group" style={{ color: "#1E1E1E" }}>
                      {t("requestDocs")}<ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                    </Link>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ PRINCIPLES ══════════════════════════════════════════════════ */}
        <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
          <div className="container-max">
            <Reveal className="mb-12 text-center">
              <span className="eyebrow justify-center mb-3">{t("principlesEyebrow")}</span>
              <h2 className="mx-auto" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.12, color: "#1E1E1E", maxWidth: "460px" }}>
                {t("principlesTitle")}
              </h2>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {principles.map((p, i) => (
                <Reveal key={p.title} delay={i * 90}>
                  <div className="bg-white rounded-[24px] p-7 border border-black/[0.05] h-full hover-lift text-center">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-5" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                      <p.icon className="w-6 h-6" />
                    </span>
                    <h3 className="mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>{p.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#555555" }}>{p.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA — shared homepage style ═══════════════════════════ */}
        <FinalCTA
          eyebrow={t("ctaEyebrow")}
          titleLead={t("ctaTitleLead")}
          titleAccent={t("ctaTitleAccent")}
          body={t("ctaBody")}
          primaryLabel={t("ctaPrimary")}
          primaryHref="/enquire"
          caption={t("ctaCaption")}
        />

      </main>
      <Footer />
    </>
  );
}
