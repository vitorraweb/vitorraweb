import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.legalTerms" });
  return { title: t("title"), description: t("description") };
}

const mailLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>
);

export default async function TermsPage() {
  const t = await getTranslations("legal.terms");
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <Section title={t("aboutTitle")}>
        <P>{t("about1", { name: SITE_NAME })}</P>
      </Section>

      <Section title={t("usingTitle")}>
        <P>{t("using1")}</P>
        <Ul items={t.raw("usingList")} />
      </Section>

      <Section title={t("ordersTitle")}>
        <P>{t("orders1")}</P>
        <P>{t("orders2")}</P>
        <P>{t("orders3")}</P>
      </Section>

      <Section title={t("deliveryTitle")}>
        <P>{t("delivery1")}</P>
      </Section>

      <Section title={t("ipTitle")}>
        <P>{t("ip1")}</P>
      </Section>

      <Section title={t("disclaimerTitle")}>
        <P>{t("disclaimer1")}</P>
        <P>{t("disclaimer2")}</P>
      </Section>

      <Section title={t("governingTitle")}>
        <P>{t("governing1")}</P>
      </Section>

      <Section title={t("contactTitle")}>
        <P>{t.rich("contact1", { mail: mailLink })}</P>
      </Section>
    </LegalPage>
  );
}
