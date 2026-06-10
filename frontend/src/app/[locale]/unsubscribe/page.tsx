import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import UnsubscribeClient from "@/components/newsletter/UnsubscribeClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "unsubscribe" });
  // Utility page reached from email links — keep it out of search results.
  return { title: t("metaTitle"), robots: { index: false, follow: false } };
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-24" style={{ backgroundColor: "#F2F2F2" }}>
        <UnsubscribeClient token={token ?? null} />
      </main>
      <Footer />
    </>
  );
}
