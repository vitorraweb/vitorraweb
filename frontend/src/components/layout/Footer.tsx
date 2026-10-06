import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CookieSettingsButton } from "@/components/ui/cookie-settings-button";
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

  /* Quiet Authority footer: paper, hairlines, plain type — no gold fills, no
     icon bullets. Follows the homepage's ink contact band, so it is light to
     keep the page's dark/light alternation. */
  return (
    <footer className="q-scope bg-paper-deep text-ink border-t border-line">
      {/* ── Wordmark + newsletter ─────────────────────────────────────────── */}
      <div className="q-container grid grid-cols-1 lg:grid-cols-12 gap-10 pt-16 pb-12 border-b border-line">
        <div className="lg:col-span-5">
          <Link href="/" aria-label="Vitorra Holdings Limited, home" className="inline-flex items-center gap-4">
            <Image src="/logo.png" alt="" width={56} height={56} className="h-14 w-auto mix-blend-multiply" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.75rem] tracking-[-0.01em] text-ink">Vitorra</span>
              <span className="t-label text-[0.625rem] tracking-[0.22em] text-ink-muted mt-1.5">Holdings Limited</span>
            </span>
          </Link>
          <p className="t-small text-ink-muted mt-6 max-w-sm">{t("footer.tagline")}</p>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <p className="t-h3 text-ink">{t("newsletter.title")}</p>
          <p className="t-small text-ink-muted mt-2 mb-6 max-w-md">{t("newsletter.body")}</p>
          <NewsletterSignup />
        </div>
      </div>

      {/* ── Contact · link columns ────────────────────────────────────────── */}
      <div className="q-container grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-12 py-14">
        <address className="col-span-2 lg:col-span-4 not-italic">
          <h3 className="t-label text-ink-muted mb-5">{t("footer.contactUs")}</h3>
          <p className="t-small text-ink-soft">
            {CONTACT_ADDRESS.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </p>
          <p className="t-small mt-4 flex flex-col gap-1.5">
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-ink-soft hover:text-ink transition-colors">{CONTACT_EMAIL}</a>
            <a href={telHref} className="text-ink-soft hover:text-ink transition-colors font-numeric">{CONTACT_PHONE}</a>
            <a href={telAltHref} className="text-ink-soft hover:text-ink transition-colors font-numeric">{CONTACT_PHONE_ALT}</a>
          </p>
        </address>

        {cols.map((col, i) => (
          <div key={col.heading} className={i === 0 ? "lg:col-span-2 lg:col-start-6" : "lg:col-span-2"}>
            <h3 className="t-label text-ink-muted mb-5">{col.heading}</h3>
            <ul className="space-y-3 t-small">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink-soft hover:text-ink transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* The published cookie policy tells visitors to click
                  "Cookie settings" here, so the control lives in the Legal
                  column beside the policy it changes. */}
              {col.heading === t("footer.colLegal") && (
                <li>
                  <CookieSettingsButton className="text-ink-soft hover:text-ink transition-colors text-left" />
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-line">
        <div className="q-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-6 t-small text-ink-muted">
          <p>{t("footer.rights", { year, name: SITE_NAME })}</p>
          <p className="font-numeric">{t("footer.regLine", { reg: COMPANY_REG_NO })}</p>
        </div>
      </div>
    </footer>
  );
}
