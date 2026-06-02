"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

/* Premium FAQ accordion — smooth grid-rows height animation, gold toggle.
   One panel open at a time. */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-6 py-5 text-left"
            >
              <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(17px, 2vw, 20px)", fontWeight: 600, letterSpacing: "-0.01em", color: "#1E1E1E" }}>
                {item.q}
              </span>
              <span
                className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-300"
                style={{
                  background: isOpen ? "#C5B27A" : "#F2F2F2",
                  color: isOpen ? "#1E1E1E" : "#7A6020",
                  transform: isOpen ? "rotate(135deg)" : "rotate(0deg)",
                }}
              >
                <Plus className="w-4 h-4" />
              </span>
            </button>
            <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
              <div className="overflow-hidden">
                <p className="pb-6 max-w-2xl" style={{ fontSize: "15px", lineHeight: 1.75, color: "#555555" }}>
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
