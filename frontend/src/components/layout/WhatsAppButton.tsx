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

  /* Desktop only — on phones the contact dock (StickyQuoteBar) carries
     WhatsApp, so the two never stack. A labelled button rather than a
     pulsing bubble: a visible word is easier to notice than an animation,
     and it doesn't compete with the page. */
  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      className="q-scope hidden lg:inline-flex fixed z-40 right-6 bottom-6 items-center gap-2 rounded-edge border border-line-strong bg-paper px-4 min-h-11 t-small font-medium text-ink shadow-[0_8px_24px_rgba(30,30,30,0.08)] transition-colors hover:border-ink"
    >
      <MessageCircle aria-hidden="true" className="h-4 w-4 text-gold-ink" />
      {t("messageUs")}
      <span className="sr-only">, {t("chatOnWhatsapp")}</span>
    </a>
  );
}
