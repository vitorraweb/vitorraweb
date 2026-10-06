"use client";

import { useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";

/* Footer newsletter signup (single opt-in). Posts to the API and swaps to a
   confirmation state on success. Errors render inline. Dark-surface styling. */
export default function NewsletterSignup() {
  const t = useTranslations("newsletter");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setError("");
    try {
      await subscribeNewsletter(email.trim(), locale, turnstileToken || undefined);
      setState("done");
    } catch (err) {
      // Token is single-use — refresh it for a retry.
      turnstileRef.current?.reset();
      setTurnstileToken("");
      setError(err instanceof Error ? err.message : t("error"));
      setState("error");
    }
  }

  /* Quiet Authority: a hairline field and an ink button on the paper footer. */
  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-3 t-small text-ink">
        <Check aria-hidden="true" className="h-4 w-4 text-gold-ink" />
        {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full lg:w-[420px]">
      <div className="flex items-end gap-3">
        <label className="flex-1">
          <span className="sr-only">{t("placeholder")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            autoComplete="email"
            className="w-full bg-transparent border-0 border-b border-line-strong rounded-none px-0 py-3 t-body text-ink placeholder:text-ink-muted outline-none focus:border-ink transition-colors"
          />
        </label>
        <button
          type="submit"
          disabled={state === "loading"}
          className="q-btn bg-ink text-paper hover:bg-black disabled:opacity-60"
        >
          {state === "loading" ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {t("button")}
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
      <Turnstile
        ref={turnstileRef}
        action="newsletter"
        onVerify={setTurnstileToken}
        onExpire={() => setTurnstileToken("")}
        className="mt-3"
      />
      {state === "error" && <p role="alert" className="mt-3 t-small text-alert-ink">{error}</p>}
      <p className="mt-3 t-small text-ink-muted">{t("consent")}</p>
    </form>
  );
}
