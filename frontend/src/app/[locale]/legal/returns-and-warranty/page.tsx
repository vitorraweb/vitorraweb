import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { localeAlternates } from "@/lib/seo";
import { LegalPage, Section, P, Ul } from "@/components/ui/legal-page";
import { CONTACT_EMAIL } from "@/lib/constants";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.legalReturns" });
  return { title: t("title"), description: t("description"), alternates: localeAlternates(locale, "/legal/returns-and-warranty") };
}

const mailLink = () => (
  <a href={`mailto:${CONTACT_EMAIL}`} className="q-inline-link">{CONTACT_EMAIL}</a>
);

export default async function ReturnsPage({ params }: { params: Promise<{ locale: string }> }) {
  // Language from the URL, so the page is built ahead and cached.
  setRequestLocale((await params).locale);
  const t = await getTranslations("legal.returns");
  return (
    <LegalPage title={t("title")} updated={t("updated")}>
      <Section title={t("coffeeTitle")}>
        <P>{t.rich("coffee1", { mail: mailLink })}</P>
        <P>{t("coffee2")}</P>
        <Ul items={t.raw("coffeeList")} />
      </Section>

      <Section title={t("b2bTitle")}>
        <P>{t.rich("b2b1", { mail: mailLink })}</P>
        <P>{t("b2b2")}</P>
      </Section>

      <Section title={t("refundTitle")}>
        <P>{t("refund1")}</P>
      </Section>

      <Section title={t("startTitle")}>
        <Ul items={t.raw("startList")} />
      </Section>

      <Section title={t("warrantyTitle")}>
        <P>{t("warranty1")}</P>
      </Section>
    </LegalPage>
  );
}
