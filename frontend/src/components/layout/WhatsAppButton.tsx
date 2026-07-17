"use client";

import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { CONTACT_PHONE } from "@/lib/constants";

const NUMBER = CONTACT_PHONE.replace(/[^0-9]/g, "");
const OPENER = "Hi Vitorra Holdings, I'd like to know more about your products.";
const HREF = `https://wa.me/${NUMBER}?text=${encodeURIComponent(OPENER)}`;

/* Persistent, site-wide entry point to a real person — the digital extension
   of how Marketing already sells door-to-door. Kept in Vitorra's own charcoal
   + gold rather than WhatsApp's brand green, so it reads as part of the same
   premium system as everything else, not a third-party widget bolted on.
   Positioned above StickyQuoteBar's mobile strip so the two never collide.
   whatsapp-launcher (globals.css) keeps it periodically popping + rippling
   so it stays noticeable without a continuous, cheap-looking bounce. */
export default function WhatsAppButton() {
  const t = useTranslations("common");

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("chatOnWhatsapp")}
      className="whatsapp-launcher group fixed z-40 flex items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105 right-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] lg:right-6 lg:bottom-6"
      style={{
        width: "52px",
        height: "52px",
        background: "#1E1E1E",
        border: "1px solid rgba(197,178,122,0.35)",
        color: "#C5B27A",
      }}
    >
      <MessageCircle className="w-6 h-6" strokeWidth={2} />
      <span
        className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: "#1E1E1E", color: "#FAFAF8" }}
      >
        {t("chatOnWhatsapp")}
      </span>
    </a>
  );
}
