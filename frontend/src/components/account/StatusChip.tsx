import { cn } from "@/lib/utils";

/* Status, Quiet Authority style: a small label with a coloured dot. Four
   tones only — the portal used to show blue, purple, green, red and gold
   pills, which read as a dashboard template rather than the brand.        */
export type StatusTone = "progress" | "done" | "stopped" | "neutral";

const TONE: Record<StatusTone, { dot: string; text: string }> = {
  progress: { dot: "bg-gold", text: "text-gold-ink" },
  done: { dot: "bg-ok-ink", text: "text-ok-ink" },
  stopped: { dot: "bg-alert-ink", text: "text-alert-ink" },
  neutral: { dot: "bg-line-strong", text: "text-ink-muted" },
};

export function StatusChip({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  const s = TONE[tone];
  return (
    <span className={cn("inline-flex items-center gap-2 t-label whitespace-nowrap", s.text, className)}>
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {children}
    </span>
  );
}

/** Order / enquiry status → tone. Unknown statuses read as neutral. */
export const STATUS_TONE: Record<string, StatusTone> = {
  pending: "progress", processing: "progress", shipped: "progress", new: "progress", in_progress: "progress", quoted: "progress",
  delivered: "done", complete: "done", converted: "done", paid: "done", confirmed: "done",
  cancelled: "stopped", failed: "stopped",
  closed: "neutral", partial: "progress", unpaid: "progress",
};
