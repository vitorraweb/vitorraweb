import Image from "next/image";
import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";

/* Premium split auth layout — dark cinematic brand panel (aurora + grain, like
   the site's heroes) on the left, the form on a clean ivory canvas on the right. */

const PERKS = [
  "Track every order and enquiry in one place",
  "See exactly where your quotes stand, in real time",
  "Download your documents, datasheets, and invoices",
];

export default function AuthShell({
  lead,
  accent,
  children,
}: {
  lead: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid lg:grid-cols-2 min-h-dvh">
      {/* ── Left — dark brand panel ──────────────────────────────────────── */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16" style={{ backgroundColor: "#121212" }}>
        <div aria-hidden="true" className="hero-aurora-right" />
        <div aria-hidden="true" className="hero-grain" />

        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" aria-label="Vitorra Holdings — home">
            <Image src="/logo.png" alt="Vitorra Holdings Limited" width={120} height={120} className="h-16 w-auto" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70" style={{ color: "rgba(255,255,255,0.55)" }}>
            Back to vitorra.org<ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <span className="eyebrow-light mb-6 inline-flex">Vitorra Account</span>
          <h2
            style={{
              fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
              fontSize: "clamp(36px, 4vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
              color: "#FFFFFF",
            }}
          >
            {lead} <span className="text-gold-gradient">{accent}</span>
          </h2>
          <ul className="mt-10 space-y-4">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-3.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full shrink-0 mt-0.5" style={{ background: "rgba(197,178,122,0.16)", border: "1px solid rgba(197,178,122,0.3)" }}>
                  <Check className="w-3.5 h-3.5" style={{ color: "#C5B27A" }} />
                </span>
                <span style={{ fontSize: "15px", lineHeight: 1.6, color: "rgba(255,255,255,0.6)" }}>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10">
          <p style={{ fontSize: "12px", lineHeight: 1.7, color: "rgba(255,255,255,0.32)", maxWidth: "320px" }}>
            A diversified African holdings company — fuel technology, healthcare,
            premium coffee, and logistics.
          </p>
        </div>
      </div>

      {/* ── Right — form ─────────────────────────────────────────────────── */}
      <div className="relative flex items-center justify-center px-6 py-16" style={{ backgroundColor: "#F2F2F2" }}>
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8 flex justify-center">
            <Link href="/" aria-label="Vitorra Holdings — home">
              <Image src="/logo.png" alt="Vitorra" width={56} height={56} className="h-12 w-auto mix-blend-multiply" />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
