import type { Metadata } from "next";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Returns & Warranty — Vitorra Holdings Limited",
  description: "Vitorra Holdings returns, refund, and warranty policy for Coffee Shop orders and B2B products.",
};

export default function ReturnsPage() {
  return (
    <LegalPage title="Returns & Warranty" updated="1 June 2026">
      <Section title="Coffee Shop orders">
        <P>If your order arrives damaged, incorrect, or significantly not as described, please contact us within 7 days of receipt at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a> with your order number and a photo of the issue. We will arrange a replacement or full refund at no additional cost to you.</P>
        <P>We are unable to accept returns for:</P>
        <Ul items={[
          "Perishable or consumable goods that have been opened (including coffee once the seal is broken, unless faulty)",
          "Items returned more than 14 days after delivery",
          "Items not in their original condition due to customer handling",
        ]} />
      </Section>

      <Section title="B2B products (Fuel Eco Tech, SEAL Wound Spray, Logistics)">
        <P>B2B product returns and warranties are governed by the individual supply agreement or purchase order in place. If you have a concern about a B2B product or service, contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a> and our team will respond within 24 hours.</P>
        <P>For SEAL Wound Spray: as a single-use medical product, opened units cannot be returned. Defective sealed units (manufacturing defect) may be returned for replacement within 30 days of delivery. Proof of purchase required.</P>
      </Section>

      <Section title="Refund process">
        <P>Approved refunds are processed within 5–10 business days. Refunds are issued to the original payment method (Flutterwave or PayPal). We do not refund original shipping costs unless the return is due to our error.</P>
      </Section>

      <Section title="How to start a return">
        <Ul items={[
          "Email support@vitorra.org with your order number and reason",
          "Include a photo if the item is damaged or incorrect",
          "Our team will confirm eligibility and next steps within 24 hours",
        ]} />
      </Section>

      <Section title="Warranty — Fuel Eco Tech">
        <P>Fuel Eco Tech units carry a limited warranty against manufacturing defects for 12 months from the date of installation. The warranty does not cover damage caused by improper installation, misuse, or normal wear. Contact us to make a warranty claim.</P>
      </Section>
    </LegalPage>
  );
}
