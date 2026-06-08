import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowUpRight, Check, Download } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { FET_TIERS, formatEur } from "@/lib/fet-pricing";

/* ─── FET Full Line Pricing ───────────────────────────────────────────────────
   Public pricing guide — one card per device tier, with its exact selling price
   (EUR, Kampala landed + installation). Per the BRD, FET prices are shown
   openly; the sales motion stays enquiry → assessment → quote, so every card
   routes to the enquiry form rather than a cart.                              */

export default function FetPricing() {
  const tr = useTranslations("fetPricing");
  const tt = useTranslations("fetTiers");

  const included = [tr("included1"), tr("included2"), tr("included3")];

  return (
    <section
      id="fet-pricing"
      className="section-padding relative overflow-hidden"
      style={{ backgroundColor: "#141414", scrollMarginTop: "96px" }}
    >
      {/* Gold aurora + grain to match the page's other dark sections */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 80% 18%, rgba(197,178,122,0.12) 0%, transparent 50%)," +
            "radial-gradient(ellipse at 8% 85%, rgba(197,178,122,0.06) 0%, transparent 45%)",
        }}
      />
      <div aria-hidden="true" className="hero-grain" style={{ opacity: 0.025 }} />

      <div className="container-max relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center mb-12 lg:mb-16">
          <Reveal className="max-w-2xl">
            <span className="eyebrow-light mb-3 inline-flex">{tr("eyebrow")}</span>
            <h2
              style={{
                fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                fontSize: "clamp(28px, 3.5vw, 48px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.1,
                color: "#FFFFFF",
                maxWidth: "560px",
              }}
            >
              {tr("titleLead")}{" "}
              <span style={{ color: "#C5B27A" }}>{tr("titleAccent")}</span>
            </h2>
            <p className="mt-5 max-w-lg" style={{ fontSize: "16px", lineHeight: 1.75, color: "rgba(255,255,255,0.42)" }}>
              {tr("body")}
            </p>
          </Reveal>

          {/* The device itself — product render in a light tile so it reads as a deliberate showcase on the dark section. */}
          <Reveal delay={120} className="flex lg:justify-end">
            <div
              className="relative w-full max-w-[420px] rounded-[28px] overflow-hidden"
              style={{ background: "#FAFAF8", border: "1px solid rgba(197,178,122,0.25)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}
            >
              <Image
                src="/products/fet/Picture3.jpg"
                alt={tr("deviceAlt")}
                width={1100}
                height={1066}
                sizes="(max-width: 1024px) 100vw, 420px"
                className="w-full h-auto"
              />
            </div>
          </Reveal>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FET_TIERS.map((t, i) => (
            <Reveal key={t.id} delay={i * 70}>
              <div
                className="flex flex-col h-full rounded-[24px] p-7"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(197,178,122,0.16)" }}
              >
                <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#C5B27A" }}>
                  {t.model}
                </span>
                <h3
                  className="mt-2 mb-1"
                  style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "22px", fontWeight: 600, color: "#FFFFFF" }}
                >
                  {tt(`${t.id}.label`)}
                </h3>
                <p className="text-sm leading-relaxed mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>{tt(`${t.id}.fits`)}</p>
                <p className="text-[12px]" style={{ color: "rgba(255,255,255,0.32)" }}>{tt(`${t.id}.segment`)}</p>
                <p className="text-[12px] mb-5 mt-1.5" style={{ color: "rgba(197,178,122,0.65)" }}>
                  {tr("egPrefix", { examples: tt(`${t.id}.examples`) })}
                </p>

                {/* Price */}
                <div className="mt-auto">
                  <p className="text-[11px] mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>{tr("from")}</p>
                  <p
                    style={{
                      fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
                      fontSize: "34px",
                      fontWeight: 700,
                      letterSpacing: "-0.02em",
                      lineHeight: 1,
                      color: "#FFFFFF",
                    }}
                  >
                    {formatEur(t.priceEur)}
                  </p>
                  <p className="text-[11px] mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {tr("perDevice")}
                  </p>

                  <Link
                    href={`/enquire?sector=FET&vehicle=${t.id}`}
                    className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold"
                    style={{ color: "#C5B27A" }}
                  >
                    {tr("requestQuote")}
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* What's included */}
        <Reveal className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
          {included.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>
              <Check className="w-4 h-4" style={{ color: "#C5B27A" }} />
              {item}
            </span>
          ))}
        </Reveal>

        {/* Downloadable, procurement-friendly PDFs (cleaned — no internal data). */}
        <Reveal className="mt-8 flex flex-wrap gap-3">
          {[
            { href: "/downloads/vitorra-fet-application-guide.pdf", label: tr("downloadGuide") },
            { href: "/downloads/vitorra-fet-datasheet.pdf", label: tr("downloadDatasheet") },
          ].map((d) => (
            <a
              key={d.href}
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{ background: "rgba(197,178,122,0.12)", border: "1px solid rgba(197,178,122,0.4)", color: "#C5B27A" }}
            >
              <Download className="w-4 h-4" />
              {d.label}
            </a>
          ))}
        </Reveal>

        <Reveal>
          <p className="mt-6 text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)", maxWidth: "640px" }}>
            {tr("footnote")}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
