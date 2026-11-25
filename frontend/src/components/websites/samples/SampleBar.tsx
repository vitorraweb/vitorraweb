import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import s from "./sample.module.css";

/* The thin Vitorra bar above every sample site: it says, every time, that the
   business is made up, and leads back to the offer. */
export async function SampleBar() {
  const t = await getTranslations("websites.demo");
  return (
    <div className={s.bar}>
      <div className={s.barInner}>
        <Link href="/websites" className={s.barBack}><ArrowLeft aria-hidden="true" size={15} />{t("barBack")}</Link>
        <span className={s.barNote}>{t("barNote")}</span>
        <Link href="/websites#preview" className={s.barCta}>{t("barCta")}</Link>
      </div>
    </div>
  );
}
