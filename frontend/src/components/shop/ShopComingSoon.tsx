import { useTranslations } from "next-intl";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Section, Container, TextLink } from "@/components/system";
import { SectionHead } from "@/components/system/blocks";
import { CinematicHero } from "@/components/system/imagery";

/* ─── Shop — retail launching soon (Quiet Authority) ──────────────────────────
   Shown at /shop while the retail store is gated (COFFEE_SHOP_ENABLED = false).
   Opens on the roaster, then the three ways to buy coffee today.            */

export default function ShopComingSoon() {
  const t = useTranslations("shopSoon");
  const alt = useTranslations("imageAlt");

  const paths = [
    { title: t("exportTitle"), body: t("exportBody"), cta: t("exportCta"), href: "/products/coffee#coffee-export" },
    { title: t("wholesaleTitle"), body: t("wholesaleBody"), cta: t("wholesaleCta"), href: "/enquire?sector=COFFEE&channel=local" },
    { title: t("retailTitle"), body: t("retailBody"), cta: t("retailCta"), href: "/enquire?sector=COFFEE" },
  ];

  return (
    <>
      <Header overlay />
      <main id="main" className="flex-1 bg-paper">
        <CinematicHero
          image="/images/stock/coffee-roaster.jpg"
          alt={alt("coffeeRoaster")}
          label={t("heroEyebrow")}
          lines={[t("heroTitleLead"), t("heroTitleAccent")]}
          lead={t("heroBody")}
          primary={{ label: t("heroCtaPrimary"), href: "/enquire?sector=COFFEE" }}
          secondary={{ label: t("heroCtaSecondary"), href: "/products/coffee" }}
        />
        <Section tone="paper" aria-labelledby="shop-paths">
          <Container>
            <SectionHead id="shop-paths" label={t("pathsEyebrow")} title={t("pathsTitle")} className="mb-14" />
            <ol className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line border-y border-line">
              {paths.map((p, i) => (
                <li key={p.title} className="flex flex-col bg-paper py-10 md:px-8 md:first:pl-0">
                  <span className="t-label font-numeric text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t-h3 text-ink mt-4">{p.title}</h3>
                  <p className="t-small text-ink-soft mt-3 mb-8">{p.body}</p>
                  <div className="mt-auto"><TextLink href={p.href}>{p.cta}</TextLink></div>
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
