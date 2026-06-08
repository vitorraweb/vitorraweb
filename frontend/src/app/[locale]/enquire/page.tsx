import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EnquiryForm from "@/components/sections/EnquiryForm";
import { Reveal } from "@/components/ui/reveal";
import { Clock, Target, ShieldCheck, Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";
import { FET_TIERS } from "@/lib/fet-pricing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.enquire" });
  return { title: t("title"), description: t("description") };
}

const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

export default async function EnquirePage({
  searchParams,
}: {
  searchParams: Promise<{ sector?: string; message?: string; vehicle?: string; fleet?: string }>;
}) {
  const t = await getTranslations("enquirePage");
  const params = await searchParams;
  let sector = params.sector?.toUpperCase() ?? "";

  /* Prefill from the FET tools. The calculator passes a `message` summary plus
     `vehicle` (tier id) and `fleet` (count); the pricing cards pass `vehicle`
     only. Vehicle/fleet seed the structured question set; a vehicle implies the
     FET sector when none was supplied. */
  const initialMessage = params.message?.trim() ?? "";
  const initialAnswers: Record<string, string> = {};
  if (params.vehicle && FET_TIERS.some((t) => t.id === params.vehicle)) {
    initialAnswers.vehicle_type = params.vehicle;
    if (!sector) sector = "FET";
  }
  if (params.fleet && /^\d+$/.test(params.fleet)) {
    initialAnswers.fleet_size = params.fleet;
  }

  /* Hero copy adapts to the sector the visitor arrived from; defaults otherwise. */
  const key = ["FET", "SEAL", "COFFEE", "LOGISTICS"].includes(sector) ? sector.toLowerCase() : "default";
  const content = {
    eyebrow: t(`${key}Eyebrow`),
    title: t(`${key}Title`),
    body: t(`${key}Body`),
  };

  const assurances = [
    { icon: Clock,       title: t("assurance1Title"), body: t("assurance1Body") },
    { icon: Target,      title: t("assurance2Title"), body: t("assurance2Body") },
    { icon: ShieldCheck, title: t("assurance3Title"), body: t("assurance3Body") },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ══ HERO ══════════════════════════════════════════════════════════════
            Full-width dark hero with gold aurora. Adapts headline + eyebrow to
            whichever sector brought the visitor here (?sector=FET, etc.).
            On direct visits, shows the generic "right solution" message.
        ═════════════════════════════════════════════════════════════════════ */}
        <section
          className="relative overflow-hidden flex flex-col justify-end"
          style={{
            backgroundColor: "#111111",
            paddingTop: "clamp(120px, 14vh, 180px)",
            paddingBottom: "clamp(56px, 7vh, 88px)",
            paddingLeft:  "clamp(24px, 5vw, 80px)",
            paddingRight: "clamp(24px, 5vw, 80px)",
          }}
        >
          {/* Gold aurora — right side */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background:
                "radial-gradient(ellipse at 80% 30%, rgba(197,178,122,0.18) 0%, transparent 50%)," +
                "radial-gradient(ellipse at 10% 80%, rgba(197,178,122,0.07) 0%, transparent 45%)",
            }}
          />
          {/* Grain */}
          <div aria-hidden="true" className="hero-grain" />

          <div className="container-max relative z-10">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">
                {content.eyebrow}
              </span>
              <h1
                style={{
                  fontFamily:    "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                  fontSize:      "clamp(36px, 5vw, 66px)",
                  fontWeight:    700,
                  letterSpacing: "-0.025em",
                  lineHeight:    1.07,
                  color:         "#FFFFFF",
                  maxWidth:      "720px",
                }}
              >
                {content.title}
              </h1>
              <p
                className="mt-5 max-w-lg"
                style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.52)" }}
              >
                {content.body}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ══ FORM SECTION ══════════════════════════════════════════════════════
            Two-column: sticky assurances left, 3-step form right.
        ═════════════════════════════════════════════════════════════════════ */}
        <section
          className="px-6 md:px-12 lg:px-20 py-16 md:py-24"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">

            {/* Left — sticky assurances */}
            <div className="lg:sticky lg:top-28 self-start">
              <Reveal>
                <ul className="space-y-5 mb-10">
                  {assurances.map((a) => (
                    <li key={a.title} className="flex items-start gap-4">
                      <span
                        className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                        style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}
                      >
                        <a.icon className="w-5 h-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: "#1E1E1E" }}>
                          {a.title}
                        </span>
                        <span className="block text-sm" style={{ color: "#666666" }}>
                          {a.body}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: "#1E1E1E" }}>
                    {t("preferTalk")}
                  </p>
                  <div className="space-y-2">
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="flex items-center gap-2.5 text-sm hover:opacity-70 transition-opacity"
                      style={{ color: "#555555" }}
                    >
                      <Mail className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
                      {CONTACT_EMAIL}
                    </a>
                    <a
                      href={telHref}
                      className="flex items-center gap-2.5 text-sm hover:opacity-70 transition-opacity"
                      style={{ color: "#555555" }}
                    >
                      <Phone className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
                      {CONTACT_PHONE}
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right — form */}
            <Reveal delay={120}>
              <EnquiryForm initialSector={sector} initialMessage={initialMessage} initialAnswers={initialAnswers} />
            </Reveal>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
