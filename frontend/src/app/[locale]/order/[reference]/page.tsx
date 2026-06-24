import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import OrderPay from "@/components/OrderPay";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "payment" });
  return { title: t("payTitle"), robots: { index: false, follow: false } };
}

export default async function OrderPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ paid?: string }>;
}) {
  const { reference } = await params;
  const { paid } = await searchParams;

  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center px-6 py-28 md:py-32" style={{ backgroundColor: "#F2F2F2" }}>
        <OrderPay reference={reference} justPaid={paid === "1"} />
      </main>
      <Footer />
    </>
  );
}
