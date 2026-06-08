import type { Metadata } from "next";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms & Conditions — Vitorra Holdings Limited",
  description: "The terms governing use of the Vitorra Holdings website and purchase of Vitorra products.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="1 June 2026">
      <Section title="About these terms">
        <P>These terms govern your use of vitorra.org and any purchase you make from {SITE_NAME} ("Vitorra", "we", "us"). By using the site or placing an order, you agree to these terms. If you do not agree, please do not use the site.</P>
      </Section>

      <Section title="Using the website">
        <P>You may use the site for lawful purposes only. You must not:</P>
        <Ul items={[
          "Use the site in any way that breaches applicable local or international law or regulation",
          "Transmit unsolicited or unauthorised advertising or promotional material (spam)",
          "Knowingly introduce viruses, trojans, or other malicious or harmful material",
          "Attempt to gain unauthorised access to any part of the site or its related systems",
        ]} />
      </Section>

      <Section title="Orders and payment">
        <P>When you place an order through our Coffee Shop, you are making an offer to purchase. We confirm acceptance by email. We reserve the right to decline or cancel orders at our discretion (for example, if a pricing error is identified).</P>
        <P>All prices are shown in UGX or USD as indicated. Payments are processed securely by Flutterwave (UGX) and PayPal (USD). We do not store card details.</P>
        <P>For B2B enquiries (Fuel Eco Tech, SEAL, Logistics), prices are agreed individually — a confirmed purchase order or written agreement constitutes the contract.</P>
      </Section>

      <Section title="Delivery">
        <P>Delivery times stated are estimates only. We are not liable for delays outside our reasonable control (customs, weather, logistics disruptions). Risk in goods passes to you on delivery.</P>
      </Section>

      <Section title="Intellectual property">
        <P>All content on the site — including text, images, logos, and design — is owned by or licensed to Vitorra. You may not reproduce, distribute, or create derivative works without our written permission.</P>
      </Section>

      <Section title="Disclaimer and limitation of liability">
        <P>The site is provided "as is". We make reasonable efforts to keep it accurate and available, but we give no warranty as to its completeness, accuracy, or fitness for any particular purpose.</P>
        <P>To the fullest extent permitted by law, Vitorra is not liable for any indirect, consequential, or incidental losses arising from use of the site or from any product purchased, beyond the value of the order in question.</P>
      </Section>

      <Section title="Governing law">
        <P>These terms are governed by the laws of the Republic of Uganda. Any disputes shall be subject to the exclusive jurisdiction of the courts of Uganda.</P>
      </Section>

      <Section title="Contact">
        <P>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>.</P>
      </Section>
    </LegalPage>
  );
}
