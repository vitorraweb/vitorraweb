import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PaymentReturn from "@/components/PaymentReturn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });
  // Reached only after a payment redirect — keep it out of search results.
  return { title: t("successTitle"), robots: { index: false, follow: false } };
}

export default async function PaymentReturnPage({
  searchParams,
}: {
  // Pesapal appends OrderTrackingId/OrderMerchantReference; we drive off `reference`
  // (added to the callback URL by the gateway).
  searchParams: Promise<{ reference?: string }>;
}) {
  const { reference } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-28 md:py-32" style={{ backgroundColor: "#F2F2F2" }}>
        <PaymentReturn reference={reference ?? null} />
      </main>
      <Footer />
    </>
  );
}
