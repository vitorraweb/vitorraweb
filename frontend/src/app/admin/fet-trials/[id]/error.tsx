"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

/**
 * Catches a render failure on the trial workspace.
 *
 * Without this the whole admin panel falls back to a bare "something went
 * wrong", which tells the person nothing and loses the reference they need to
 * report it. One malformed record should cost a panel, not the page.
 */
export default function TrialError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[fet-trials] render failed:", error);
  }, [error]);

  return (
    <div className="pb-12">
      <Link href="/admin/fet-trials" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "#999" }}>
        <ArrowLeft className="w-4 h-4" />All trials
      </Link>

      <div className="bg-white rounded-[20px] border p-6 mt-4" style={{ borderColor: "rgba(158,59,51,0.28)" }}>
        <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#9E3B33" }}>
          <AlertTriangle className="w-4 h-4" />This trial could not be displayed
        </span>
        <p className="text-lg leading-snug mb-3" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
          Something in this trial&rsquo;s data stopped the page from drawing.
        </p>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#555" }}>
          Nothing has been lost — the trial and its trips are safe. Try again below; if it keeps happening, send this
          message to IT along with the trial reference.
        </p>

        <pre className="text-xs rounded-xl p-3 mb-4 overflow-x-auto" style={{ background: "#F7F7F5", color: "#777" }}>
          {error.message}{error.digest ? `\n\nReference: ${error.digest}` : ""}
        </pre>

        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full"
          style={{ background: "#C5B27A", color: "#1E1E1E" }}
        >
          <RotateCcw className="w-3.5 h-3.5" />Try again
        </button>
      </div>
    </div>
  );
}
