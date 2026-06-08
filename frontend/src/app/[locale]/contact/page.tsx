import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/sections/ContactForm";
import { Reveal } from "@/components/ui/reveal";
import { Mail, Phone, MessageCircle, MapPin, Clock, ArrowRight } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_ALT, CONTACT_ADDRESS } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.contact" });
  return { title: t("title"), description: t("description") };
}

const tel = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;
const telAlt = `tel:${CONTACT_PHONE_ALT.replace(/\s+/g, "")}`;
const wa = `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}`;
const mapQuery = encodeURIComponent(`${CONTACT_ADDRESS.join(", ")}`);
const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

export default function ContactPage() {
  const t = useTranslations("contact");

  const methods = [
    { icon: Mail, label: t("emailUs"), value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { icon: Phone, label: t("callUs"), value: CONTACT_PHONE, href: tel, alt: { value: CONTACT_PHONE_ALT, href: telAlt } },
    { icon: MessageCircle, label: t("whatsapp"), value: t("whatsappValue"), href: wa },
  ];

  const chips = [
    { icon: Mail, label: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
    { icon: Phone, label: CONTACT_PHONE, href: tel },
    { icon: MessageCircle, label: t("whatsapp"), href: wa },
  ];

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* ══ HERO — dark cinematic, gold aurora + grain (matches the site) ══ */}
        <section
          className="relative overflow-hidden"
          style={{
            backgroundColor: "#111111",
            paddingTop: "clamp(128px, 15vh, 188px)",
            paddingBottom: "clamp(56px, 8vh, 96px)",
            paddingLeft: "clamp(24px, 5vw, 80px)",
            paddingRight: "clamp(24px, 5vw, 80px)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              background:
                "radial-gradient(ellipse at 82% 24%, rgba(197,178,122,0.18) 0%, transparent 52%)," +
                "radial-gradient(ellipse at 8% 88%, rgba(197,178,122,0.07) 0%, transparent 46%)",
            }}
          />
          <div aria-hidden="true" className="hero-grain" />

          <div className="container-max relative z-10">
            <Reveal>
              <span className="eyebrow-light mb-5 inline-flex">{t("eyebrow")}</span>
              <h1 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(40px, 6vw, 76px)", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1.02, color: "#FFFFFF", maxWidth: "720px" }}>
                {t("title")}
              </h1>
              <p className="mt-6 max-w-xl" style={{ fontSize: "clamp(15px, 1.5vw, 18px)", lineHeight: 1.7, color: "rgba(255,255,255,0.5)" }}>
                {t("subtitle")}
              </p>

              {/* Quick-contact chips */}
              <div className="mt-9 flex flex-wrap gap-3">
                {chips.map((c) => (
                  <a
                    key={c.label}
                    href={c.href}
                    className="inline-flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full text-sm font-medium transition-colors"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(197,178,122,0.28)", color: "rgba(255,255,255,0.82)" }}
                  >
                    <c.icon className="w-4 h-4" style={{ color: "#C5B27A" }} />
                    {c.label}
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ══ DETAILS + FORM ══════════════════════════════════════════════ */}
        <section className="px-6 md:px-12 lg:px-20 py-16 md:py-24" style={{ backgroundColor: "#F2F2F2" }}>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">

            {/* Left — details */}
            <div className="lg:sticky lg:top-28 self-start">
              <Reveal>
                <span className="eyebrow block mb-6">{t("directTitle")}</span>

                {/* Methods */}
                <ul className="space-y-3 mb-8">
                  {methods.map((m) => (
                    <li key={m.label}>
                      <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-black/[0.05] hover-lift">
                        <span className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                          <m.icon className="w-5 h-5" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999999" }}>{m.label}</span>
                          <a href={m.href} className="block text-sm font-medium transition-colors hover:text-[#7A6020]" style={{ color: "#1E1E1E" }}>{m.value}</a>
                          {m.alt && (
                            <a href={m.alt.href} className="block text-[13px] mt-0.5 transition-colors hover:text-[#7A6020]" style={{ color: "#999999" }}>
                              {t("alsoOn")} {m.alt.value}
                            </a>
                          )}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* Address + hours */}
                <div className="pt-6 space-y-5" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C5B27A" }} />
                    <span className="text-sm leading-relaxed" style={{ color: "#555555" }}>
                      {CONTACT_ADDRESS.map((line, i) => <span key={i} className="block">{line}</span>)}
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C5B27A" }} />
                    <span className="text-sm leading-relaxed" style={{ color: "#555555" }}>
                      <span className="block">{t("hoursWeekday")}</span>
                      <span className="block">{t("hoursSaturday")}</span>
                    </span>
                  </div>
                </div>

                {/* Quote nudge */}
                <div className="mt-8 p-5 rounded-2xl" style={{ background: "rgba(197,178,122,0.1)", border: "1px solid rgba(197,178,122,0.3)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>{t("quoteTitle")}</p>
                  <p className="text-sm mb-3" style={{ color: "#666666" }}>{t("quoteBody")}</p>
                  <Link href="/enquire" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-60 transition-opacity group" style={{ color: "#7A6020" }}>
                    {t("quoteCta")}<ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* Right — form */}
            <Reveal delay={120}>
              <ContactForm />
            </Reveal>
          </div>
        </section>

        {/* ══ MAP ═════════════════════════════════════════════════════════ */}
        <section className="px-6 md:px-12 lg:px-20 pb-20 md:pb-28" style={{ backgroundColor: "#F2F2F2" }}>
          <Reveal className="container-max">
            <div className="card-stadium shadow-card overflow-hidden" style={{ aspectRatio: "21/9", maxHeight: "56vh" }}>
              <iframe
                src={mapSrc}
                title={t("mapTitle")}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                style={{ border: 0 }}
              />
            </div>
          </Reveal>
        </section>

      </main>
      <Footer />
    </>
  );
}
