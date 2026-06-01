import type { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import EnquiryForm from "@/components/sections/EnquiryForm";
import { Reveal } from "@/components/ui/reveal";
import { Clock, Target, ShieldCheck, Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Request a Quote — Vitorra Holdings Limited",
  description:
    "Request a quote or enquiry from Vitorra Holdings — Fuel Eco Tech, SEAL wound spray, premium Ugandan coffee, or logistics. Our team replies within 24 hours.",
};

const assurances = [
  { icon: Clock, title: "Reply within 24 hours", body: "A real person from our team, not an auto-reply." },
  { icon: Target, title: "Tailored to your sector", body: "Options matched to your volume, market, and timeline." },
  { icon: ShieldCheck, title: "No obligation", body: "A quote and a conversation — no pressure, no spam." },
];

const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

export default function EnquirePage() {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>
        <section
          className="px-6 md:px-12 lg:px-20 pb-20 md:pb-28"
          style={{ paddingTop: "clamp(128px, 12vh, 168px)" }}
        >
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-20">

            {/* Left — context (static, SEO-friendly) */}
            <div className="lg:sticky lg:top-32 self-start">
              <Reveal>
                <span className="eyebrow block mb-4">Request a Quote</span>
                <h1
                  style={{
                    fontFamily: "var(--font-playfair, Georgia, serif)",
                    fontSize: "clamp(32px, 4vw, 52px)",
                    fontWeight: 700,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.08,
                    color: "#1E1E1E",
                  }}
                >
                  Let&apos;s find the right<br />solution for you.
                </h1>
                <p className="mt-6 mb-9 max-w-md" style={{ fontSize: "16px", lineHeight: 1.7, color: "#555555" }}>
                  Tell us a little about what you need and our team will respond
                  within 24 hours with tailored options — no obligation.
                </p>

                <ul className="space-y-5 mb-10">
                  {assurances.map((a) => (
                    <li key={a.title} className="flex items-start gap-4">
                      <span className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
                        <a.icon className="w-5 h-5" />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold" style={{ color: "#1E1E1E" }}>{a.title}</span>
                        <span className="block text-sm" style={{ color: "#666666" }}>{a.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pt-6" style={{ borderTop: "1px solid rgba(0,0,0,0.08)" }}>
                  <p className="text-sm font-semibold mb-3" style={{ color: "#1E1E1E" }}>Prefer to talk?</p>
                  <div className="space-y-2">
                    <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2.5 text-sm hover:opacity-70 transition-opacity" style={{ color: "#555555" }}>
                      <Mail className="w-4 h-4" style={{ color: "#C5B27A" }} />
                      {CONTACT_EMAIL}
                    </a>
                    <a href={telHref} className="flex items-center gap-2.5 text-sm hover:opacity-70 transition-opacity" style={{ color: "#555555" }}>
                      <Phone className="w-4 h-4" style={{ color: "#C5B27A" }} />
                      {CONTACT_PHONE}
                    </a>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* Right — the form */}
            <Reveal delay={120}>
              <EnquiryForm />
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
