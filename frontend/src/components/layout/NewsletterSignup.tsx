"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api";

/* Footer newsletter signup (single opt-in). Posts to the API and swaps to a
   confirmation state on success. Errors render inline. Dark-surface styling. */
export default function NewsletterSignup() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setError("");
    try {
      await subscribeNewsletter(email.trim(), locale);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
        <span
          className="flex items-center justify-center w-7 h-7 rounded-full shrink-0"
          style={{ background: "rgba(197,178,122,0.2)", color: "#C5B27A" }}
        >
          <Check className="w-4 h-4" />
        </span>
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full lg:w-auto">
      <div
        className="flex items-center gap-2 rounded-full p-1.5 w-full lg:w-[380px]"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          className="flex-1 bg-transparent px-4 py-2 text-sm outline-none text-white placeholder:text-white/40"
        />
        <button
          type="submit"
          disabled={state === "loading"}
          aria-label={t("button")}
          className="flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60"
          style={{ background: "#C5B27A", color: "#1E1E1E" }}
        >
          {state === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline">{t("button")}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 px-2 text-xs" style={{ color: "#E5A3A3" }}>{error}</p>
      )}
      <p className="mt-2 px-2 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{t("consent")}</p>
    </form>
  );
}
