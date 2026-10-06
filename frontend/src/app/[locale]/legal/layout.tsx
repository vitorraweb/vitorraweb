import { useTranslations } from "next-intl";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { LegalNav } from "@/components/ui/legal-nav";

/* Legal pages — Quiet Authority. A side menu of the four documents and a calm
   reading column. */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("footer");
  const links = [
    { label: t("privacy"), href: "/legal/privacy-policy" },
    { label: t("terms"), href: "/legal/terms-and-conditions" },
    { label: t("returns"), href: "/legal/returns-and-warranty" },
    { label: t("cookies"), href: "/legal/cookie-policy" },
  ];
  return (
    <>
      <Header />
      <main id="main" className="q-scope flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <div className="q-container q-section !pt-14 lg:!pt-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-3">
            <LegalNav heading={t("colLegal")} links={links} />
          </div>
          <div className="lg:col-span-8 lg:col-start-5">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  );
}
