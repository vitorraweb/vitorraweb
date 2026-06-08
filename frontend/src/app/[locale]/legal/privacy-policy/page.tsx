import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.legalPrivacy" });
  return { title: t("title"), description: t("description") };
}

const mailLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>
);

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal.privacy");
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <Section title={t("whoTitle")}>
        <P>{t("who1", { name: SITE_NAME })}</P>
        <P>{t.rich("who2", { mail: mailLink })}</P>
      </Section>

      <Section title={t("collectTitle")}>
        <P>{t("collect1")}</P>
        <Ul items={t.raw("collectList")} />
        <P>{t("collect2")}</P>
      </Section>

      <Section title={t("useTitle")}>
        <Ul items={t.raw("useList")} />
        <P>{t("use2")}</P>
      </Section>

      <Section title={t("basesTitle")}>
        <P>{t("bases1")}</P>
      </Section>

      <Section title={t("cookiesTitle")}>
        <P>{t.rich("cookies1", { clink: (c) => <Link href="/legal/cookie-policy" style={{ color: "#7A6020", textDecoration: "underline" }}>{c}</Link> })}</P>
      </Section>

      <Section title={t("sharingTitle")}>
        <P>{t("sharing1")}</P>
        <Ul items={t.raw("sharingList")} />
      </Section>

      <Section title={t("retentionTitle")}>
        <P>{t("retention1")}</P>
      </Section>

      <Section title={t("rightsTitle")}>
        <P>{t.rich("rights1", { mail: mailLink })}</P>
      </Section>

      <Section title={t("changesTitle")}>
        <P>{t("changes1")}</P>
      </Section>
    </LegalPage>
  );
}
