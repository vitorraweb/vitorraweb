import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Label, Heading, Text, TextLink } from "@/components/system";
import { Picture } from "@/components/system/imagery";

/* ─── The four businesses, as doors ───────────────────────────────────────────
   Shared by the homepage and About. Each door shows the photograph its
   business's page opens on, so clicking through feels like stepping into the
   picture. One component, so the businesses can never be described two ways. */

export async function BusinessDoors() {
  const t = await getTranslations("homeQA");
  const tp = await getTranslations("products");
  const alt = await getTranslations("imageAlt");

  const doors = [
    { key: "fet", href: "/products/fuel-eco-tech", image: "/images/stock/road-mountains.jpg", imageAlt: alt("roadMountains"), body: t("door1Body"),
      action: { label: t("door1Action"), href: "/products/fuel-eco-tech#fet-calculator" }, second: { label: t("door1Second"), href: "/enquire?sector=FET" } },
    { key: "seal", href: "/products/seal-wound-spray", image: "/images/stock/trauma-kit-open.jpg", imageAlt: alt("traumaKit"), body: t("door2Body"),
      action: { label: t("door2Action"), href: "/enquire?sector=SEAL" } },
    { key: "coffee", href: "/products/coffee", image: "/images/stock/coffee-valley.jpg", imageAlt: alt("coffeeValley"), body: t("door3Body"),
      action: { label: t("door3Action"), href: "/products/coffee#coffee-export" } },
    { key: "logistics", href: "/products/logistics", image: "/images/stock/port-aerial.jpg", imageAlt: alt("portAerial"), body: t("door4Body"),
      action: { label: t("door4Action"), href: "/enquire?sector=LOGISTICS" } },
  ] as { key: string; href: string; image: string; imageAlt: string; body: string; action: { label: string; href: string }; second?: { label: string; href: string } }[];

  return (
    <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
      {doors.map((d, i) => (
        <li key={d.key} className="flex flex-col">
          <Link href={d.href} className="group block" aria-label={tp(`${d.key}.name`)}>
            <Picture src={d.image} alt={d.imageAlt} ratio="4/5" zoom sizes="(min-width: 1024px) 24vw, (min-width: 640px) 46vw, 100vw" />
          </Link>
          <Label index={String(i + 1).padStart(2, "0")} className="mt-7 mb-4">{tp(`${d.key}.tagline`)}</Label>
          <Heading as="h3" size="h3" className="text-ink">
            <Link href={d.href} className="hover:text-gold-ink transition-colors">{tp(`${d.key}.name`)}</Link>
          </Heading>
          <Text size="small" className="mt-3 mb-7">{d.body}</Text>
          <div className="mt-auto flex flex-col items-start gap-3">
            <TextLink href={d.action.href}>{d.action.label}</TextLink>
            {d.second && <TextLink href={d.second.href} className="text-ink-muted">{d.second.label}</TextLink>}
          </div>
        </li>
      ))}
    </ol>
  );
}
