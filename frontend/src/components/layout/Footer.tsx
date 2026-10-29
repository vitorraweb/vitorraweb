import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CookieSettingsButton } from "@/components/ui/cookie-settings-button";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_ALT, COMPANY_REG_NO, SITE_NAME } from "@/lib/constants";
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

  /* The close of every page: dark, after the sage contact band. One big
     "Let's talk" (letters rise and turn gold on hover) beside the
     newsletter; the logo once, the link columns, then a slim bottom bar
     with the one email and phone. Nothing is said twice: the old giant
     wordmark, the repeated "Contact us" and the full address block are
     gone (the address lives in the contact band and on /contact). */
  const talk = t("footer.letsTalk");

  return (
    <footer className="q-scope bg-ink text-ink-fg" data-tone="ink">
      {/* ── Let's talk + newsletter ───────────────────────────────────────── */}
      <div className="q-container grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 pt-14 sm:pt-20 pb-12 sm:pb-16 border-b border-ink-line">
        {/* The size follows the column width and the length of the phrase, so
            "Let's talk", "Tuzungumze" or a longer translation always fits on
            one line in its column — never under the newsletter, never off the
            screen. Rendered as one word (not letter by letter) so the letters
            keep their natural spacing on every device. */}
        <div className="lg:col-span-7 min-w-0 [container-type:inline-size]">
          <p className="t-label text-ink-fg-muted mb-6">{t("footer.letsTalkLead")}</p>
          <Link href="/contact" className="group inline-flex max-w-full items-center gap-[0.18em]" aria-label={talk}
            style={{ fontSize: `clamp(2.25rem, calc(145cqi / ${Math.max(Array.from(talk).length, 7)}), 8.5rem)` }}>
            <span aria-hidden="true" className="min-w-0 font-display font-light leading-[0.95] tracking-[-0.02em] [text-wrap:balance] [overflow-wrap:anywhere] transition-colors duration-500 group-hover:text-gold">{talk}</span>
            <span aria-hidden="true" className="shrink-0 text-gold text-[0.45em] leading-none transition-transform duration-500 group-hover:translate-x-2 group-hover:-translate-y-2">↗</span>
          </Link>
        </div>
        <div className="lg:col-span-5 lg:pt-12">
          <p className="t-h3 text-ink-fg">{t("newsletter.title")}</p>
          <p className="t-small text-ink-fg-muted mt-2 mb-6 max-w-md">{t("newsletter.body")}</p>
          <NewsletterSignup onInk />
        </div>
      </div>

      {/* ── Logo · link columns ───────────────────────────────────────────── */}
      <div className="q-container grid grid-cols-2 lg:grid-cols-12 gap-x-8 gap-y-8 sm:gap-y-12 py-10 sm:py-14">
        <div className="col-span-2 lg:col-span-4">
          <Link href="/" aria-label="Vitorra Holdings Limited, home" className="inline-flex items-center gap-4">
            <Image src="/logo.png" alt="" width={48} height={48} className="h-12 w-auto" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.5rem] tracking-[-0.01em] text-ink-fg">Vitorra</span>
              <span className="t-label text-[0.625rem] tracking-[0.22em] text-ink-fg-muted mt-1.5">Holdings Limited</span>
            </span>
          </Link>
          <p className="t-small text-ink-fg-muted mt-6 max-w-xs">{t("footer.tagline")}</p>
        </div>

        {cols.map((col, i) => (
          <div key={col.heading} className={i === 0 ? "lg:col-span-2 lg:col-start-6" : "lg:col-span-2"}>
            <h3 className="t-label text-ink-fg-muted mb-5">{col.heading}</h3>
            <ul className="space-y-1 sm:space-y-3 t-small">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-block py-1.5 sm:py-0 text-ink-fg/85 hover:text-ink-fg hover:underline underline-offset-4 decoration-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
              {/* The published cookie policy tells visitors to click
                  "Cookie settings" here, so the control lives in the Legal
                  column beside the policy it changes. */}
              {col.heading === t("footer.colLegal") && (
                <li>
                  <CookieSettingsButton className="text-ink-fg/85 hover:text-ink-fg transition-colors text-left" />
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-ink-line">
        <div className="q-container flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-6 t-small text-ink-fg-muted">
          <p>{t("footer.rights", { year, name: SITE_NAME })} <span className="font-numeric">· {t("footer.regLine", { reg: COMPANY_REG_NO })}</span></p>
          <p className="flex flex-wrap gap-x-6 gap-y-1">
            <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-ink-fg transition-colors">{CONTACT_EMAIL}</a>
            <a href={telHref} className="hover:text-ink-fg transition-colors font-numeric">{CONTACT_PHONE}</a>
            <a href={telAltHref} className="hover:text-ink-fg transition-colors font-numeric">{CONTACT_PHONE_ALT}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
