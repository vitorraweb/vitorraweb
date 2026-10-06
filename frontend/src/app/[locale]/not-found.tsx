import { useTranslations } from "next-intl";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Section, Container, Label, Heading, Text, ButtonLink, TextLink } from "@/components/system";
import { BusinessDoors } from "@/components/system/doors";

/* 404 — Quiet Authority. Still the site: header, footer, and the four
   businesses, so a lost visitor can find what they came for. */
export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <>
      <Header />
      <main id="main" className="flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <Section tone="paper" className="!pt-16 lg:!pt-24" aria-labelledby="nf-title">
          <Container className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
            <p aria-hidden="true" className="lg:col-span-4 t-figure text-line-strong">404</p>
            <div className="lg:col-span-7 lg:col-start-6">
              <Label className="mb-6">{t("label")}</Label>
              <Heading as="h1" size="h1" id="nf-title" className="text-ink">{t("title")}</Heading>
              <Text size="lead" className="mt-6">{t("body")}</Text>
              <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
                <ButtonLink href="/">{t("home")}</ButtonLink>
                <TextLink href="/contact">{t("contact")}</TextLink>
              </div>
            </div>
          </Container>
        </Section>
        <Section tone="paper" rule>
          <Container>
            <BusinessDoors />
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
