import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import type { FetStock } from "@/lib/fet-availability";

/* Live stock line for one FET model: a small status dot and a few words,
   taken from the stock book. Renders nothing if the status isn't known. */
export function FetStockBadge({ stock, onInk = false, className }: { stock?: FetStock; onInk?: boolean; className?: string }) {
  const t = useTranslations("fetCatalogue");
  if (!stock) return null;

  const tone = stock.status === "in_stock" ? "#2F8F5B" : stock.status === "low" ? "#C9861A" : onInk ? "rgba(255,255,255,0.55)" : "#8A8A8A";
  const text = stock.status === "in_stock" ? t("stockIn") : stock.status === "low" ? t("stockLow", { count: stock.left }) : t("stockOrder");

  return (
    <span className={cn("inline-flex items-start gap-2 t-small", onInk ? "text-ink-fg" : "text-ink", className)}>
      <span aria-hidden="true" className="relative flex h-2 w-2 shrink-0 mt-[0.5em]">
        {stock.status !== "order" && <span className="absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping" style={{ background: tone }} />}
        <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: tone }} />
      </span>
      {text}
    </span>
  );
}
