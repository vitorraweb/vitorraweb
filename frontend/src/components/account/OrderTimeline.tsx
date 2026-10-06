"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { StatusChip } from "@/components/account/StatusChip";

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

  /* Quiet Authority: numbered steps on a hairline that fills with gold as the
     order moves; payment status as a StatusChip. */
  if (status === "cancelled") {
    return (
      <div className="mb-8">
        <StatusChip tone="stopped">{t("timelineCancelled")}</StatusChip>
      </div>
    );
  }

  const currentIndex = Math.max(0, STEPS.findIndex((s) => s.status === status));

  return (
    <div className="mb-8">
      <ol className="flex items-start">
        {STEPS.map((step, i) => {
          const isComplete = i < currentIndex || (i === currentIndex && status === "complete");
          const isCurrent = i === currentIndex && status !== "complete";
          const reached = i <= currentIndex;
          return (
            <li key={step.status} aria-current={isCurrent ? "step" : undefined} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-start min-w-16">
                <span className={`t-label font-numeric ${reached ? "text-gold-ink" : "text-ink-muted"}`}>
                  {isComplete ? <Check aria-hidden="true" className="inline w-3.5 h-3.5 -mt-0.5" strokeWidth={2} /> : String(i + 1).padStart(2, "0")}
                </span>
                <span className={`mt-2 t-small leading-tight max-w-[6rem] pr-2 ${reached ? "text-ink" : "text-ink-muted"} ${isCurrent ? "font-medium" : ""}`}>
                  {t(step.labelKey)}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className={`flex-1 h-px mt-2 mr-3 ${i < currentIndex ? "bg-gold" : "bg-line"}`} />
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        <StatusChip tone={paymentStatus === "paid" ? "done" : "progress"}>
          {t("paymentLabel")}: {t(PAYMENT_KEY[paymentStatus] ?? "paymentPending")}
        </StatusChip>
      </div>
    </div>
  );
}
