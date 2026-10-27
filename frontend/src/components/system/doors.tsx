import { getTranslations } from "next-intl/server";
import { BusinessPanels } from "@/components/system/BusinessPanels";

/* ─── The four businesses, as doors ───────────────────────────────────────────
   Shared by the homepage and About. Each door shows the photograph its
   business's page opens on, and carries it into that page's hero as the
   visitor clicks through (BusinessPanels). One component, so the businesses
   can never be described two ways. */

export async function BusinessDoors() {
  const t = await getTranslations("homeQA");
  const tp = await getTranslations("products");
  const alt = await getTranslations("imageAlt");

  const doors = [
    { key: "fet", href: "/products/fuel-eco-tech", image: "/photos/hero-02-fet.jpg", imageAlt: alt("fetInstalled"), body: t("door1Body"),
      action: { label: t("door1Action"), href: "/products/fuel-eco-tech#fet-calculator" }, second: { label: t("door1Second"), href: "/enquire?sector=FET" } },
    { key: "seal", href: "/products/seal-wound-spray", image: "/photos/hero-03-seal.jpg", imageAlt: alt("sealKit"), body: t("door2Body"),
      action: { label: t("door2Action"), href: "/enquire?sector=SEAL" } },
    { key: "coffee", href: "/products/coffee", image: "/images/stock/coffee-valley.jpg", imageAlt: alt("coffeeValley"), body: t("door3Body"),
      action: { label: t("door3Action"), href: "/products/coffee#coffee-export" } },
    { key: "logistics", href: "/products/logistics", image: "/images/stock/port-aerial.jpg", imageAlt: alt("portAerial"), body: t("door4Body"),
      action: { label: t("door4Action"), href: "/enquire?sector=LOGISTICS" } },
  ] as { key: string; href: string; image: string; imageAlt: string; body: string; action: { label: string; href: string }; second?: { label: string; href: string } }[];

  return (
    <BusinessPanels
      viewLabel={t("panelView")}
      doors={doors.map((d) => ({ ...d, name: tp(`${d.key}.name`), tagline: tp(`${d.key}.tagline`) }))}
    />
  );
}
