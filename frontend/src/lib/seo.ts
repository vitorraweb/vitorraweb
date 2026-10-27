import { SITE_URL, SITE_NAME, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_ALT, COMPANY_REG_NO } from "@/lib/constants";
import { FET_TIERS } from "@/lib/fet-pricing";

/* ─── Search and answer engines ───────────────────────────────────────────────
   Structured data (schema.org JSON-LD) is how Google, Bing and the AI
   assistants that read them learn the facts about Vitorra without guessing
   from the layout: who we are, what each business sells, prices, questions
   and answers. Everything here restates what the pages already say; nothing
   in it may claim more than the visible copy does.                         */

const ORG_ID = `${SITE_URL}/#organization`;

/** Canonical URL and hreflang pairs for a public page (English unprefixed). */
export function localeAlternates(locale: string, path: string) {
  const en = path || "/";
  return {
    canonical: locale === "en" ? en : `/${locale}${path}`,
    languages: { en, sw: `/sw${path}`, "x-default": en },
  };
}

export const organization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": ORG_ID,
  name: SITE_NAME,
  legalName: "Vitorra Holdings Limited",
  alternateName: "Vitorra",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Ugandan company based in Kampala with four businesses: Fuel Eco Tech fuel-saving devices, SEAL hemostatic wound spray, Ugandan Arabica coffee for export, and freight and logistics across East Africa.",
  foundingLocation: { "@type": "Place", name: "Kampala, Uganda" },
  identifier: { "@type": "PropertyValue", propertyID: "URSB registration number", value: COMPANY_REG_NO },
  address: {
    "@type": "PostalAddress",
    streetAddress: "Padre Pio House, Plot 32, Lumumba Avenue",
    addressLocality: "Kampala",
    addressCountry: "UG",
  },
  email: CONTACT_EMAIL,
  telephone: CONTACT_PHONE,
  contactPoint: [
    { "@type": "ContactPoint", contactType: "sales", telephone: CONTACT_PHONE, email: CONTACT_EMAIL, areaServed: ["UG", "KE", "TZ", "RW"], availableLanguage: ["English", "Swahili"] },
    { "@type": "ContactPoint", contactType: "customer support", telephone: CONTACT_PHONE_ALT, email: CONTACT_EMAIL, availableLanguage: ["English", "Swahili"] },
  ],
  areaServed: [{ "@type": "Place", name: "Uganda" }, { "@type": "Place", name: "East Africa" }],
  knowsAbout: ["Fuel efficiency", "Fleet fuel costs", "Hemostatic wound care", "Bleeding control", "Ugandan Arabica coffee export", "Freight and logistics in East Africa", "Customs clearance in Uganda"],
};

export const website = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  publisher: { "@id": ORG_ID },
  inLanguage: ["en", "sw"],
};

export function faqPage(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } })),
  };
}

export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${SITE_URL}${c.path}` })),
  };
}

const seller = { "@id": ORG_ID };

/** One entry per business, matching what its page states. */
export const products = {
  fet: {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Fuel Eco Tech (FET)",
    url: `${SITE_URL}/products/fuel-eco-tech`,
    image: `${SITE_URL}/products/fet/field-in-hand.jpg`,
    brand: { "@type": "Brand", name: "Fuel Eco Tech" },
    category: "Vehicle fuel-efficiency device",
    description:
      "A device fitted to the fuel line between the pump and the filter, with no engine modification. In an independent CTI GmbH field test (Germany, November 2025) a VW T5 went from 11.52 to 9.92 litres per 100 km, 13.9% less fuel. Sold in Uganda by Vitorra after a free fuel assessment, from UGX 1,891,000 including installation.",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "UGX",
      lowPrice: Math.min(...FET_TIERS.map((t) => t.priceUgx)),
      highPrice: Math.max(...FET_TIERS.map((t) => t.priceUgx)),
      offerCount: FET_TIERS.length,
      areaServed: "UG",
      seller,
      offers: FET_TIERS.map((t) => ({
        "@type": "Offer",
        name: `${t.model} — ${t.fits}`,
        price: t.priceUgx,
        priceCurrency: "UGX",
        description: `${t.segment}. Installation included.`,
        seller,
      })),
    },
  },
  seal: {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "SEAL Hemostatic Wound Spray",
    url: `${SITE_URL}/products/seal-wound-spray`,
    image: `${SITE_URL}/photos/seal-range-pro.png`,
    brand: { "@type": "Brand", name: "SEAL" },
    category: "Hemostatic wound spray",
    description:
      "A chitosan-based hemostatic aerosol, US FDA 510(k) cleared, for rapid control of external bleeding. Three formats: SEAL OTC (1.5 oz), SEAL PRO (2.5 oz) and HemoSEAL Pet (2.8 oz). Single use, 36-month shelf life, stored at room temperature. Not a tourniquet replacement. Supplied by Vitorra to organisations on enquiry.",
    offers: { "@type": "Offer", availability: "https://schema.org/PreOrder", areaServed: "UG", seller, url: `${SITE_URL}/enquire?sector=SEAL` },
  },
  coffee: {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Vitorra Coffee — Ugandan Arabica",
    url: `${SITE_URL}/products/coffee`,
    image: `${SITE_URL}/images/stock/coffee-valley.jpg`,
    brand: { "@type": "Brand", name: "Vitorra Coffee" },
    category: "Green and roasted Arabica coffee",
    description:
      "Arabica grown mainly on the slopes of Mount Elgon, Uganda, hand-picked and washed. Supplied to export buyers, roasters and hotels; export minimum one metric tonne. Retail bags are not on sale yet.",
    offers: { "@type": "Offer", availability: "https://schema.org/PreOrder", seller, url: `${SITE_URL}/enquire?sector=COFFEE&channel=export` },
  },
  logistics: {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Vitorra Logistics — freight, warehousing and customs clearance",
    url: `${SITE_URL}/products/logistics`,
    serviceType: "Freight forwarding and logistics",
    description:
      "Road, sea and air freight within Uganda and across East Africa, warehousing, and customs clearance, quoted per shipment. Uses the Northern Corridor (Mombasa) and the Central Corridor (Dar es Salaam).",
    provider: seller,
    areaServed: ["Uganda", "Kenya", "Tanzania", "Rwanda", "South Sudan"],
  },
};

/** Serialise for a <script type="application/ld+json"> tag. */
export function ldJson(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

/* An article's "Questions" section (an h2 whose text has "question" or
   "maswali", then h3 question / paragraph answer pairs) becomes FAQPage
   data, so a blog post written answer-first can be lifted into answer boxes.
   Returns [] when the article has no such section. */
export function faqFromHtml(html: string | undefined): { q: string; a: string }[] {
  if (!html) return [];
  const text = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
  const start = html.search(/<h2[^>]*>[^<]*(question|maswali)[^<]*<\/h2>/i);
  if (start < 0) return [];
  const rest = html.slice(start).replace(/^<h2[^>]*>.*?<\/h2>/i, "");
  const section = rest.split(/<h2[\s>]/i)[0];
  const out: { q: string; a: string }[] = [];
  for (const m of section.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    out.push({ q: text(m[1]), a: text(m[2]) });
  }
  return out;
}
