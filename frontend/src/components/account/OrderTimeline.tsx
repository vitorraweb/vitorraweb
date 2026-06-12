"use client";

import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";

const STEPS = [
  { status: "pending", labelKey: "timelineReserved" },
  { status: "processing", labelKey: "timelineConfirmed" },
  { status: "shipped", labelKey: "timelineScheduled" },
  { status: "delivered", labelKey: "timelineInstalled" },
  { status: "complete", labelKey: "timelineComplete" },
] as const;

const PAYMENT_KEY: Record<string, string> = {
  pending: "paymentPending",
  partial: "paymentPartial",
  paid: "paymentPaid",
};

export default function OrderTimeline({ status, paymentStatus }: { status: string; paymentStatus: string }) {
  const t = useTranslations("account");

  if (status === "cancelled") {
    return (
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full" style={{ background: "rgba(192,57,43,0.1)", color: "#C0392B" }}>
          <X className="w-3.5 h-3.5" />
          {t("timelineCancelled")}
        </span>
      </div>
    );
  }

  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.status === status));

  return (
    <div className="mb-6">
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex || (i === currentIndex && status === "complete");
          const isCurrent = i === currentIndex && status !== "complete";
          const reached = i <= currentIndex;
          return (
            <div key={step.status} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center" style={{ minWidth: "64px" }}>
                <div
                  className="flex items-center justify-center w-7 h-7 rounded-full text-[11px] font-bold shrink-0"
                  style={{ background: reached ? "#C5B27A" : "#F2F2F2", color: reached ? "#1E1E1E" : "#AAAAAA" }}
                >
                  {isComplete ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span
                  className="mt-1.5 text-[10px] text-center leading-tight px-1"
                  style={{ color: reached ? "#1E1E1E" : "#AAAAAA", fontWeight: isCurrent ? 700 : 500, maxWidth: "84px" }}
                >
                  {t(step.labelKey)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px mx-1" style={{ background: i < currentIndex ? "#C5B27A" : "rgba(0,0,0,0.08)", marginBottom: "20px" }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4">
        <span
          className="inline-flex items-center text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{
            background: paymentStatus === "paid" ? "rgba(34,197,94,0.12)" : "rgba(197,178,122,0.16)",
            color: paymentStatus === "paid" ? "#16A34A" : "#7A6020",
          }}
        >
          {t("paymentLabel")}: {t(PAYMENT_KEY[paymentStatus] ?? "paymentPending")}
        </span>
      </div>
    </div>
  );
}
