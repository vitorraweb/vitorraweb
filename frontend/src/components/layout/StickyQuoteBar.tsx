"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowRight, Phone, MessageCircle } from "lucide-react";
import { CONTACT_PHONE } from "@/lib/constants";

// Routes where a contact dock would be redundant or in the way.
const HIDDEN_ON = ["/enquire", "/contact", "/account", "/shop/cart", "/shop/checkout", "/unsubscribe", "/display"];
const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;
const waHref = `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
  "Hi Vitorra Holdings, I'd like to know more about your products.",
)}`;

/* ─── Mobile contact dock — the one floating element on a phone ───────────────
   Phones used to show three floating things at once: this bar, a WhatsApp
   bubble hovering above it, and the cookie banner. Now quote, call and
   WhatsApp share one bar, which slides up only after the visitor has scrolled
   past the opening — so the first screen is the page, not the furniture.
   Desktop keeps the WhatsApp button instead (see WhatsAppButton).           */
export default function StickyQuoteBar() {
  const t = useTranslations("common");
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"))) return null;

  const tab = visible ? 0 : -1;

  return (
    <div
      aria-hidden={!visible}
      className="q-scope fixed inset-x-0 bottom-0 z-40 lg:hidden border-t border-line bg-paper transition-transform duration-300 ease-quiet"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        transform: visible ? "translateY(0)" : "translateY(110%)",
      }}
    >
      <div className="flex items-stretch divide-x divide-line">
        <Link href="/enquire" tabIndex={tab} className="flex flex-1 items-center justify-center gap-2 bg-ink text-paper min-h-14 t-small font-medium">
          {t("requestQuote")}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
        <a href={telHref} tabIndex={tab} aria-label={t("callUs")} className="flex w-16 items-center justify-center text-ink">
          <Phone aria-hidden="true" className="h-5 w-5" />
        </a>
        <a href={waHref} tabIndex={tab} target="_blank" rel="noopener noreferrer" aria-label={t("chatOnWhatsapp")} className="flex w-16 items-center justify-center text-ink">
          <MessageCircle aria-hidden="true" className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
