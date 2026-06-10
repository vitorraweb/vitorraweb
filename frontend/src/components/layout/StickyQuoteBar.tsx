"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { CONTACT_PHONE } from "@/lib/constants";

// Routes where a floating "Request a Quote" bar would be redundant or in the way.
const HIDDEN_ON = ["/enquire", "/contact", "/account", "/shop/cart", "/shop/checkout", "/unsubscribe"];

const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

/* Mobile-only sticky CTA. Slides up once the visitor has scrolled past the
   hero, giving a persistent path to a quote without nagging on first view.
   Hidden on desktop and on routes that already centre on contacting us. */
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

  const hidden = HIDDEN_ON.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (hidden) return null;

  return (
    <div
      aria-hidden={!visible}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden px-3 pt-3 transition-transform duration-300"
      style={{
        paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
        transform: visible ? "translateY(0)" : "translateY(120%)",
        background: "linear-gradient(to top, rgba(242,242,242,0.96) 60%, rgba(242,242,242,0))",
      }}
    >
      <div className="flex items-center gap-2.5 max-w-md mx-auto">
        <Link
          href="/enquire"
          className="btn-primary flex-1 justify-center"
          tabIndex={visible ? 0 : -1}
        >
          {t("requestQuote")}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <a
          href={telHref}
          aria-label={t("requestQuote")}
          tabIndex={visible ? 0 : -1}
          className="flex items-center justify-center w-12 h-12 rounded-full shrink-0"
          style={{ background: "#1E1E1E", color: "#FFFFFF" }}
        >
          <Phone className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
}
