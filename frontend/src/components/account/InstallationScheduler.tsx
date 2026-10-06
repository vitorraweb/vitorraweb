"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check } from "lucide-react";
import { apiCustomer } from "@/lib/customer-auth";

type Saved = { preferred_installation_date: string | null; installation_location: string | null };

export default function InstallationScheduler({
  reference, preferredDate, location, onSaved,
}: {
  reference: string;
  preferredDate: string | null;
  location: string | null;
  onSaved: (data: Saved) => void;
}) {
  const t = useTranslations("account");
  const [date, setDate] = useState((preferredDate ?? "").slice(0, 10));
  const [loc, setLoc] = useState(location ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [minDate] = useState(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10));

  const submit = async () => {
    setStatus("saving");
    try {
      const res = await apiCustomer<{ data: Saved }>(`/account/orders/${reference}/installation`, {
        method: "PATCH",
        body: JSON.stringify({ preferred_installation_date: date, installation_location: loc || null }),
      });
      onSaved(res.data);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="mt-7 pt-6 border-t border-line">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] mb-2 text-ink-muted">{t("installationTitle")}</p>
      <p className="text-xs mb-4 text-ink-muted">{t("installationPending")}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[11px] font-semibold mb-1 text-ink-muted">{t("installationDateLabel")}</label>
          <input
            type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm rounded-edge px-3 py-2 border outline-none border-line-strong text-ink"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1 text-ink-muted">{t("installationLocationLabel")}</label>
          <input
            type="text" value={loc} onChange={(e) => setLoc(e.target.value)}
            className="w-full text-sm rounded-edge px-3 py-2 border outline-none border-line-strong text-ink"
          />
        </div>
      </div>

      <button
        onClick={submit}
        disabled={!date || status === "saving"}
        className="q-btn min-h-10 px-4 bg-ink text-paper hover:bg-black disabled:opacity-60"
      >
        {status === "saving" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {status === "saved" && <Check className="w-3.5 h-3.5" />}
        {status === "saved" ? t("installationSaved") : t("installationSubmit")}
      </button>
      {status === "error" && <p className="text-xs mt-2 text-alert-ink">{t("saveFailed")}</p>}
    </div>
  );
}
