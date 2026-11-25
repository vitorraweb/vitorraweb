import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SampleBar } from "@/components/websites/samples/SampleBar";
import { Lodge } from "@/components/websites/samples/Lodge";

/* A Vitorra Digital sample website: Ridgeline Lodge (a made-up business). Not indexed. */

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "websites.demo" });
  return { title: { absolute: `Ridgeline Lodge · ${t("metaSample")}` }, robots: { index: false, follow: true } };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  setRequestLocale((await params).locale);
  return (
    <>
      <SampleBar />
      <Lodge />
    </>
  );
}
