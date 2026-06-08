import type { Metadata } from "next";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Cookie Policy — Vitorra Holdings Limited",
  description: "How Vitorra Holdings uses cookies and how to manage your preferences.",
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="1 June 2026">
      <Section title="What are cookies?">
        <P>Cookies are small text files placed on your device when you visit a website. They allow the site to remember your preferences and understand how you use it.</P>
      </Section>

      <Section title="Cookies we use">
        <P><strong style={{ color: "#1E1E1E" }}>Essential cookies</strong> — required for the site to function. These cannot be disabled.</P>
        <Ul items={[
          "Session management (keeping you logged in)",
          "Shopping cart state (Coffee Shop)",
          "Cookie consent preference (remembering your choice)",
        ]} />
        <P><strong style={{ color: "#1E1E1E" }}>Analytics cookies</strong> — help us understand how visitors use the site so we can improve it. These are only set with your consent.</P>
        <Ul items={[
          "Page views and navigation paths (aggregated, anonymised)",
          "Device type and browser (to improve mobile experience)",
        ]} />
        <P>We do not use advertising or tracking cookies, and we do not share analytics data with third-party advertisers.</P>
      </Section>

      <Section title="Managing your preferences">
        <P>When you first visit the site, a cookie banner lets you accept or decline optional (analytics) cookies. You can update your preference at any time by clicking "Cookie settings" in the footer.</P>
        <P>You can also control cookies through your browser settings. Note that disabling essential cookies may affect site functionality (for example, the shopping cart may not work correctly).</P>
      </Section>

      <Section title="Third-party cookies">
        <P>We embed a Google Map on our Contact page. Google may set its own cookies when that map loads. We recommend reviewing Google's privacy policy for details.</P>
      </Section>

      <Section title="Contact">
        <P>Questions about our use of cookies: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>.</P>
      </Section>
    </LegalPage>
  );
}
