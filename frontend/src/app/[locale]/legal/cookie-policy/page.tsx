import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.legalCookies" });
  return { title: t("title"), description: t("description") };
}

const bold = (c: React.ReactNode) => <strong style={{ color: "#1E1E1E" }}>{c}</strong>;
const mailLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#7A6020", textDecoration: "underline" }}>{CONTACT_EMAIL}</a>
);

export default async function CookiePolicyPage() {
  const t = await getTranslations("legal.cookies");
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <Section title={t("whatTitle")}>
        <P>{t("what1")}</P>
      </Section>

      <Section title={t("useTitle")}>
        <P>{t.rich("essential", { b: bold })}</P>
        <Ul items={t.raw("essentialList")} />
        <P>{t.rich("analytics", { b: bold })}</P>
        <Ul items={t.raw("analyticsList")} />
        <P>{t("use3")}</P>
      </Section>

      <Section title={t("manageTitle")}>
        <P>{t("manage1")}</P>
        <P>{t("manage2")}</P>
      </Section>

      <Section title={t("thirdTitle")}>
        <P>{t("third1")}</P>
      </Section>

      <Section title={t("contactTitle")}>
        <P>{t.rich("contact1", { mail: mailLink })}</P>
      </Section>
    </LegalPage>
  );
}
