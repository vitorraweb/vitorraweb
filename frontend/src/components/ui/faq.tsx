"use client";

import { useId, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/* FAQ accordion — Quiet Authority. Hairline rows, a thin plus that turns into a
   cross, serif questions. One panel open at a time. Each answer is a labelled
   region tied to its button, so screen readers announce what opened.        */
export function Faq({ items, onInk = false }: { items: { q: string; a: string }[]; onInk?: boolean }) {
  const [open, setOpen] = useState<number | null>(0);
  const base = useId();

  return (
    <div className={cn("border-t", onInk ? "border-ink-line" : "border-line-strong")}>
      {items.map((item, i) => {
        const isOpen = open === i;
        const btn = `${base}-q${i}`;
        const panel = `${base}-a${i}`;
        return (
          <div key={item.q} className={cn("border-b", onInk ? "border-ink-line" : "border-line")}>
            <h3>
              <button
                id={btn}
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={panel}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className={cn("t-h3", onInk ? "text-ink-fg" : "text-ink")}>{item.q}</span>
                <Plus
                  aria-hidden="true"
                  strokeWidth={1.25}
                  className={cn(
                    "h-5 w-5 shrink-0 transition-transform duration-300 ease-quiet",
                    onInk ? "text-ink-fg-muted" : "text-gold-ink",
                    isOpen && "rotate-45",
                  )}
                />
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              aria-labelledby={btn}
              className="grid transition-[grid-template-rows] duration-300 ease-quiet"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className={cn("t-body pb-7 max-w-[42rem]", onInk ? "text-ink-fg-muted" : "text-ink-soft")}>{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
