"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const KEY = "vitorra_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch { /* private browsing */ }
  }, []);

  const accept = () => {
    try { localStorage.setItem(KEY, "accepted"); } catch { /* */ }
    setVisible(false);
  };
  const decline = () => {
    try { localStorage.setItem(KEY, "declined"); } catch { /* */ }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 rounded-2xl p-4 md:p-5"
      style={{ backgroundColor: "#1E1E1E", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          We use essential cookies to keep the site working, and optional analytics cookies to improve it.{" "}
          <Link href="/legal/cookie-policy" className="underline hover:opacity-70 transition-opacity" style={{ color: "#C5B27A" }}>
            Cookie policy
          </Link>
        </p>
        <button onClick={decline} aria-label="Dismiss without accepting" className="shrink-0 hover:opacity-60 transition-opacity" style={{ color: "rgba(255,255,255,0.4)" }}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={decline} className="btn-ghost-dark text-xs px-4 py-2" style={{ borderRadius: "12px" }}>
          Decline
        </button>
        <button onClick={accept} className="btn-primary text-xs px-4 py-2 flex-1" style={{ borderRadius: "12px", justifyContent: "center" }}>
          Accept all
        </button>
      </div>
    </div>
  );
}
