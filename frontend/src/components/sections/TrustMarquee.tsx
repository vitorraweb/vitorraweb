import { useTranslations } from "next-intl";
import { MapPin, Layers, BadgeCheck, Building2, Clock } from "lucide-react";

/* ─── Trust marquee ───────────────────────────────────────────────────────────
   Premium credentials ticker that sits under the hero. A slow, seamless scroll
   (Stripe / Linear style) — gives the calm cinematic hero a subtle "heartbeat"
   without competing with it.

   Why a marquee:
   - Responsive by nature — on mobile it scrolls instead of wrapping into an
     awkward multi-line block.
   - Interactive — pauses on hover.
   - Accessible — collapses to a static strip when "reduce motion" is on
     (see .marquee-track in globals.css).
   ─────────────────────────────────────────────────────────────────────────── */

const ITEMS = [
  { icon: MapPin, key: "location" },
  { icon: Layers, key: "productLines" },
  { icon: BadgeCheck, key: "certifications" },
  { icon: Building2, key: "b2bB2c" },
  { icon: Clock, key: "response" },
] as const;

function TrustItem({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return (
    <div className="flex items-center gap-2.5 px-6 shrink-0">
      <Icon className="w-4 h-4 shrink-0" style={{ color: "#7A6020" }} strokeWidth={2.25} />
      <span
        className="text-sm font-semibold whitespace-nowrap"
        style={{ color: "#1E1E1E", letterSpacing: "-0.01em" }}
      >
        {label}
      </span>
      {/* gold diamond separator */}
      <span
        aria-hidden="true"
        className="ml-4 w-1 h-1 rotate-45 shrink-0"
        style={{ backgroundColor: "#7A6020", opacity: 0.45 }}
      />
    </div>
  );
}

export default function TrustMarquee() {
  const t = useTranslations("trustMarquee");
  return (
    <div
      className="marquee-mask bg-gold-strip relative overflow-hidden py-3.5"
      aria-label={t("ariaLabel")}
    >
      {/* Soft edge fades — items appear/disappear gracefully at the rims */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-12 md:w-20 z-10"
        style={{ background: "linear-gradient(to right, #C5B27A, rgba(197,178,122,0))" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-12 md:w-20 z-10"
        style={{ background: "linear-gradient(to left, #C5B27A, rgba(197,178,122,0))" }}
      />

      {/* Track is duplicated once → translateX(-50%) loops seamlessly */}
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
            {ITEMS.map((item) => (
              <TrustItem key={`${copy}-${item.key}`} icon={item.icon} label={t(item.key)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
