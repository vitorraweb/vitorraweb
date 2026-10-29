"use client";

import { useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api";
import { Turnstile, type TurnstileHandle } from "@/components/ui/turnstile";

/* Footer newsletter signup (single opt-in). Posts to the API and swaps to a
   confirmation state on success. Errors render inline. Dark-surface styling. */
/* `onInk` restyles the form for the dark footer. */
export default function NewsletterSignup({ onInk = false }: { onInk?: boolean }) {
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
      <p role="status" className={`flex items-center gap-3 t-small ${onInk ? "text-ink-fg" : "text-ink"}`}>
        <Check aria-hidden="true" className={`h-4 w-4 ${onInk ? "text-gold" : "text-gold-ink"}`} />
        {t("success")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="@container w-full max-w-[420px]">
      {/* Side by side when there is room; stacked (full-width button) in a
          narrow column, so a longer translation of the placeholder or the
          button ("Jiandikishe") is never cut off. */}
      <div className="flex flex-col gap-3 @[26rem]:flex-row @[26rem]:items-end">
        <label className="flex-1 min-w-0">
          <span className="sr-only">{t("placeholder")}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("placeholder")}
            autoComplete="email"
            className={`w-full bg-transparent border-0 border-b rounded-none px-0 py-3 t-body outline-none transition-colors ${onInk ? "border-ink-line text-ink-fg placeholder:text-ink-fg-muted focus:border-gold" : "border-line-strong text-ink placeholder:text-ink-muted focus:border-ink"}`}
          />
        </label>
        <button
          type="submit"
          disabled={state === "loading"}
          className={`q-btn shrink-0 justify-center disabled:opacity-60 ${onInk ? "bg-ink-fg text-ink hover:bg-white" : "bg-ink text-paper hover:bg-black"}`}
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
      {state === "error" && <p role="alert" className={`mt-3 t-small ${onInk ? "text-[#F2B8B5]" : "text-alert-ink"}`}>{error}</p>}
      <p className={`mt-3 t-small ${onInk ? "text-ink-fg-muted" : "text-ink-muted"}`}>{t("consent")}</p>
    </form>
  );
}
