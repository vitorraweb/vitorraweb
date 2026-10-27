import { SITE_URL, CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS, COMPANY_REG_NO } from "@/lib/constants";
import { FET_TIERS } from "@/lib/fet-pricing";

/* /llms.txt — a plain summary for AI assistants (the llms.txt convention):
   who Vitorra is, the facts of each business, and where to read more. Built
   from the same constants as the site, so prices never drift. Every claim
   here is one the pages already make; keep it that way.                    */

export const dynamic = "force-static";

const ugx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;

export function GET() {
  const body = `# Vitorra Holdings Limited

> Ugandan company based in Kampala with four businesses: Fuel Eco Tech fuel-saving devices for vehicles, SEAL hemostatic wound spray, Ugandan Arabica coffee for export, and freight and logistics across East Africa.

- Registered in Uganda (URSB registration number ${COMPANY_REG_NO}).
- Address: ${CONTACT_ADDRESS.join(", ")}.
- Contact: ${CONTACT_EMAIL}, ${CONTACT_PHONE} (also WhatsApp). Replies within 24 hours, Monday to Friday.
- Languages: English and Swahili.
- Quotes and orders: ${SITE_URL}/enquire

## Fuel Eco Tech (FET)

- A device fitted to the vehicle's fuel line, between the pump and the filter, that improves how fuel and air mix before combustion. No engine modification.
- Evidence: independent field test by CTI GmbH, Germany, signed 10 November 2025. A VW T5 went from 11.52 to 9.92 litres per 100 km: 13.9% less fuel. Normal operational variation is about 3–5%.
- One vehicle is not every fleet: Vitorra sells FET after a free fuel assessment that measures the customer's own vehicles before and after fitting. No saving is guaranteed.
- Certifications behind the product: ISO 9001:2015, ISO 14001:2015, ISO 27001, Zurich product liability insurance, AVL Technologies (laboratory), qm-solutions GmbH.
- Prices in Uganda, installation included:
${FET_TIERS.map((t) => `  - ${t.model}: ${t.fits} (${t.segment}) — ${ugx(t.priceUgx)}`).join("\n")}
- Details and savings calculator: ${SITE_URL}/products/fuel-eco-tech

## SEAL Hemostatic Wound Spray

- Chitosan-based hemostatic aerosol for rapid control of external bleeding. Cleared by the US FDA through the 510(k) process.
- Formats: SEAL OTC 1.5 oz (everyday kits), SEAL PRO 2.5 oz, about 80 PSI (first responders, tactical), HemoSEAL Pet 2.8 oz (animal first aid).
- Single use per patient, 36-month shelf life, room-temperature storage, tested to MIL-STD-810H. Made in the USA.
- Not a tourniquet replacement.
- Uganda: registration with the National Drug Authority is confirmed case by case during procurement; Vitorra does not claim a local approval it has not been given. Supplied to organisations on enquiry.
- Details: ${SITE_URL}/products/seal-wound-spray

## Vitorra Coffee

- Ugandan Arabica grown mainly on the slopes of Mount Elgon, hand-picked and washed. Grade A, with AA, AB, B and PB.
- Export minimum one metric tonne; EXW terms, loading at Mombasa. HS code 0901.21 (roasted).
- For importers, roasters and hotels. Retail bags are not on sale yet.
- Details: ${SITE_URL}/products/coffee

## Vitorra Logistics

- Road, sea and air freight, warehousing, customs clearance and supply-chain management, within Uganda and across East Africa.
- Routes: the Northern Corridor (Mombasa–Nairobi–Malaba–Kampala) and the Central Corridor (Dar es Salaam–Mutukula–Kampala), onward to Kigali and Juba.
- Quoted per shipment, within 24 hours of a complete brief. Border times depend on the authorities, so Vitorra gives estimates, not guarantees.
- Details: ${SITE_URL}/products/logistics

## More

- About the company: ${SITE_URL}/about
- Certifications: ${SITE_URL}/trust/certifications
- Articles: ${SITE_URL}/blog
- Careers: ${SITE_URL}/careers
- Swahili versions: ${SITE_URL}/sw
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
