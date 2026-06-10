import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowUpRight, MapPin, Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_ALT, CONTACT_ADDRESS, COMPANY_REG_NO, SITE_NAME } from "@/lib/constants";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";
import NewsletterSignup from "./NewsletterSignup";

const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;
const telAltHref = `tel:${CONTACT_PHONE_ALT.replace(/\s+/g, "")}`;

export default function Footer() {
  const t = useTranslations();
  const year = new Date().getFullYear();

  // Product display names are brand terms (kept constant); link labels translate.
  const cols = [
    {
      heading: t("footer.colProducts"),
      links: [
        { label: t("products.fet.name"), href: "/products/fuel-eco-tech" },
        { label: t("products.seal.name"), href: "/products/seal-wound-spray" },
        { label: t("products.coffee.name"), href: "/products/coffee" },
        { label: t("products.logistics.name"), href: "/products/logistics" },
      ],
    },
    {
      heading: t("footer.colCompany"),
      links: [
        { label: t("footer.aboutUs"), href: "/about" },
        // Coffee Shop hidden until retail prices are confirmed (see lib/config).
        ...(COFFEE_SHOP_ENABLED ? [{ label: t("nav.coffeeShop"), href: "/shop" }] : []),
        { label: t("footer.blogInsights"), href: "/blog" },
        { label: t("footer.certifications"), href: "/trust/certifications" },
        { label: t("footer.careers"), href: "/careers" },
        { label: t("common.myAccount"), href: "/account/dashboard" },
        { label: t("footer.contactUs"), href: "/contact" },
      ],
    },
    {
      heading: t("footer.colLegal"),
      links: [
        { label: t("footer.privacy"), href: "/legal/privacy-policy" },
        { label: t("footer.terms"), href: "/legal/terms-and-conditions" },
        { label: t("footer.returns"), href: "/legal/returns-and-warranty" },
        { label: t("footer.cookies"), href: "/legal/cookie-policy" },
      ],
    },
  ];

  return (
    <footer className="bg-canvas-dark text-white/60">

      {/* ── Logo + CTA ──────────────────────────────────────────────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 pt-16 pb-12 border-b border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <Link href="/" aria-label="Vitorra Holdings Limited, home" className="inline-block">
            <Image
              src="/logo.png"
              alt="Vitorra Holdings Limited"
              width={132}
              height={132}
              className="h-24 md:h-28 w-auto"
            />
          </Link>
          <Link
            href="/enquire"
            className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            {t("common.requestQuote")}
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Newsletter signup ───────────────────────────────────────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 py-12 border-b border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-7">
          <div className="max-w-md">
            <h3 className="text-white text-lg font-semibold mb-1.5" style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}>
              {t("newsletter.title")}
            </h3>
            <p className="text-sm text-white/45 leading-relaxed">{t("newsletter.body")}</p>
          </div>
          <NewsletterSignup />
        </div>
      </div>

      {/* ── Brand + contact · link columns ──────────────────────────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 py-14 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 lg:gap-10">

        {/* Contact */}
        <div className="max-w-xs">
          <p className="text-sm leading-relaxed text-white/45 mb-7">
            {t("footer.tagline")}
          </p>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C5B27A" }} />
              <span className="text-sm leading-relaxed text-white/55">
                {CONTACT_ADDRESS.map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-white/55 hover:text-white transition-colors">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C5B27A" }} />
              <span className="flex flex-col gap-1">
                <a href={telHref} className="text-sm text-white/55 hover:text-white transition-colors">
                  {CONTACT_PHONE}
                </a>
                <a href={telAltHref} className="text-sm text-white/55 hover:text-white transition-colors">
                  {CONTACT_PHONE_ALT}
                </a>
              </span>
            </li>
          </ul>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-10 lg:col-span-3">
          {cols.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 mb-5">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/55 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.08]">
        <div className="container-max mx-auto px-6 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>{t("footer.rights", { year, name: SITE_NAME })}</p>
          <p>{t("footer.regLine", { reg: COMPANY_REG_NO })}</p>
        </div>
      </div>
    </footer>
  );
}
