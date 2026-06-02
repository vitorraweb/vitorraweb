import type { Metadata } from "next";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy — Vitorra Holdings Limited",
  description: "How Vitorra Holdings Limited collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="1 June 2026">
      <Section title="Who we are">
        <P>{SITE_NAME} ("Vitorra", "we", "us") is a company registered in Uganda (Reg. No. 80034340923220), located at Padre Pio House, Plot 32, Lumumba Avenue, Kampala, Uganda. We operate the website vitorra.org.</P>
        <P>We are the data controller for personal information collected through this website. Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>.</P>
      </Section>

      <Section title="Information we collect">
        <P>We collect information you provide directly:</P>
        <Ul items={[
          "Name, email, phone, and company when you submit an enquiry or contact form",
          "Shipping address, payment details, and order information when you place an order through the Coffee Shop",
          "Account details (name and email) if you create a customer portal account",
          "Messages and correspondence when you contact us",
        ]} />
        <P>We also collect information automatically when you use the site (pages visited, device type, browser, IP address via standard server logs and analytics).</P>
      </Section>

      <Section title="How we use your information">
        <Ul items={[
          "To respond to enquiries, quotes, and support requests",
          "To process and fulfil your orders and send order confirmations",
          "To manage your account if you register",
          "To send transactional emails (order updates, receipts)",
          "To improve the website through aggregated analytics",
          "To comply with legal obligations",
        ]} />
        <P>We do not sell your personal information to third parties, and we do not send marketing emails without your explicit consent.</P>
      </Section>

      <Section title="Legal bases for processing">
        <P>We process your information on the following bases: performance of a contract (processing orders); legitimate interests (responding to enquiries, operating the site); consent (any marketing communications); and legal obligation (tax records, compliance).</P>
      </Section>

      <Section title="Cookies">
        <P>We use essential cookies required for the site to function, and optional analytics cookies to understand usage. See our <a href="/legal/cookie-policy" style={{ color: "#7A6020", textDecoration: "underline" }}>Cookie Policy</a> for full details. You can manage your preferences at any time.</P>
      </Section>

      <Section title="Data sharing">
        <P>We share data only where necessary:</P>
        <Ul items={[
          "Payment processors (Flutterwave, PayPal) to complete transactions",
          "Email service providers to send transactional emails",
          "Shipping and logistics partners to fulfil orders",
          "Analytics providers (aggregated, anonymised data only)",
          "Legal authorities when required by law",
        ]} />
      </Section>

      <Section title="Data retention">
        <P>We retain personal data for as long as necessary to fulfil the purposes it was collected for, including legal, accounting, and reporting requirements. Enquiry data is retained for up to 2 years. Order records are retained for 7 years for tax purposes.</P>
      </Section>

      <Section title="Your rights">
        <P>Depending on your location, you may have rights to: access the personal data we hold about you; correct inaccurate data; request deletion; restrict or object to processing; and data portability. To exercise any right, contact us at <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>.</P>
      </Section>

      <Section title="Changes to this policy">
        <P>We may update this policy from time to time. Material changes will be communicated by updating the "Last updated" date above. Continued use of the site constitutes acceptance of the updated policy.</P>
      </Section>
    </LegalPage>
  );
}
