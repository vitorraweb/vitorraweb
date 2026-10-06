"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Loader2, MessageSquare, ArrowRight } from "lucide-react";
import { StatusChip, STATUS_TONE } from "@/components/account/StatusChip";
import { apiCustomer } from "@/lib/customer-auth";

type Enquiry = { id: number; product_category: string | null; message: string; status: string; created_at: string };

const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const LABEL_KEY: Record<string, string> = { FET: "labelFet", SEAL: "labelSeal", COFFEE: "labelCoffee", LOGISTICS: "labelLogistics" };
const STATUS_KEY: Record<string, string> = { new: "statusNew", in_progress: "statusInProgress", quoted: "statusQuoted", converted: "statusConverted", closed: "statusClosed" };

export default function AccountEnquiries() {
  const t = useTranslations("account");
  const [list, setList] = useState<Enquiry[] | null>(null);

  useEffect(() => {
    apiCustomer<{ data: Enquiry[] }>("/account/enquiries").then((r) => setList(r.data)).catch(() => setList([]));
  }, []);

  if (!list) return <div className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />{t("loading")}</div>;

  if (list.length === 0) {
    return (
      <div className="bg-paper rounded-frame border border-line p-14 text-center">
        <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-paper-deep text-gold-ink"><MessageSquare className="w-6 h-6" /></span>
        <p className="text-base font-semibold mb-1 text-ink">{t("noEnquiries")}</p>
        <p className="text-sm mb-6 text-ink-muted">{t("noEnquiriesSub")}</p>
        <Link href="/enquire" className="q-btn bg-ink text-paper hover:bg-black">{t("makeEnquiry")}<ArrowRight className="w-4 h-4" /></Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map((e) => {
        return (
          <div key={e.id} className="bg-paper rounded-frame border border-line p-6">
            <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
              <span className="text-xs font-semibold text-ink">{e.product_category ? (LABEL_KEY[e.product_category] ? t(LABEL_KEY[e.product_category]) : e.product_category) : t("generalEnquiry")}</span>
              <StatusChip tone={STATUS_TONE[e.status] ?? "neutral"}>{STATUS_KEY[e.status] ? t(STATUS_KEY[e.status]) : e.status.replace(/_/g, " ")}</StatusChip>
              <span className="text-xs ml-auto text-ink-muted">{date(e.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed text-ink-soft">{e.message}</p>
          </div>
        );
      })}
    </div>
  );
}
