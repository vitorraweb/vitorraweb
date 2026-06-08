import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ContactForm from "@/components/sections/ContactForm";
import { Reveal } from "@/components/ui/reveal";
import { Mail, Phone, MessageCircle, MapPin, Clock, ArrowRight } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Us — Vitorra Holdings Limited",
  description:
    "Get in touch with Vitorra Holdings Limited in Kampala, Uganda — email support@vitorra.org, call +256 740 026 118, or send us a message. We reply within 24 hours.",
};

const tel = CONTACT_PHONE.replace(/\s+/g, "");
const wa = CONTACT_PHONE.replace(/[^0-9]/g, "");
const mapQuery = encodeURIComponent(`${CONTACT_ADDRESS.join(", ")}`);
const mapSrc = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

const methods = [
  { icon: Mail, label: "Email us", value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { icon: Phone, label: "Call us", value: CONTACT_PHONE, href: `tel:${tel}` },
  { icon: MessageCircle, label: "WhatsApp", value: "Message us on WhatsApp", href: `https://wa.me/${wa}` },
];

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>

        {/* ══ CONTACT ═════════════════════════════════════════════════════ */}
        <section className="px-6 md:px-12 lg:px-20 pb-16 md:pb-20" style={{ paddingTop: "clamp(128px, 12vh, 168px)" }}>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">

            {/* Left — details */}
            <div className="lg:sticky lg:top-28 self-start">
              <Reveal>
                <span className="eyebrow block mb-4">Contact</span>
                <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.06, color: "#1E1E1E" }}>
                  Let&apos;s talk.
                </h1>
                <p className="mt-6 mb-9 max-w-md" style={{ fontSize: "16px", lineHeight: 1.7, color: "#555555" }}>
                  Questions, partnerships, or support — reach us however suits you.
                  Our team replies within 24 hours.
                </p>

                {/* Methods */}
                <ul className="space-y-3 mb-8">
                  {methods.map((m) => (
                    <li key={m.label}>
                      <a href={m.href} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-black/[0.05] hover-lift">
                        <span className="flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                          <m.icon className="w-5 h-5" />
                        </span>
                        <span>
                          <span className="block text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: "#999999" }}>{m.label}</span>
                          <span className="block text-sm font-medium" style={{ color: "#1E1E1E" }}>{m.value}</span>
                        </span>
                      </a>
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
                      <span className="block">Mon – Fri · 8:00 – 17:00 (EAT)</span>
                      <span className="block">Sat · 9:00 – 13:00 (EAT)</span>
                    </span>
                  </div>
                </div>

                {/* Quote nudge */}
                <div className="mt-8 p-5 rounded-2xl" style={{ background: "rgba(197,178,122,0.1)", border: "1px solid rgba(197,178,122,0.3)" }}>
                  <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Looking for a quote?</p>
                  <p className="text-sm mb-3" style={{ color: "#666666" }}>Tell us about your needs and we&apos;ll respond with tailored options.</p>
                  <Link href="/enquire" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:opacity-60 transition-opacity group" style={{ color: "#7A6020" }}>
                    Request a Quote<ArrowRight className="w-3.5 h-3.5 arrow-nudge" />
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
        <section className="px-6 md:px-12 lg:px-20 pb-20 md:pb-28">
          <Reveal className="container-max">
            <div className="card-stadium shadow-card overflow-hidden" style={{ aspectRatio: "21/9", maxHeight: "56vh" }}>
              <iframe
                src={mapSrc}
                title="Vitorra Holdings Limited — Kampala office location"
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
