"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { unsubscribeNewsletter } from "@/lib/api";

type State =
  | { kind: "loading" }
  | { kind: "done"; email?: string }
  | { kind: "error"; message: string };

/* Confirmation UI for the unsubscribe link. The token arrives via the URL; we
   call the API once on mount (async, so it doesn't trip set-state-in-effect)
   and report the outcome. */
export default function UnsubscribeClient({ token }: { token: string | null }) {
  const t = useTranslations("unsubscribe");
  const [state, setState] = useState<State>(
    token ? { kind: "loading" } : { kind: "error", message: "missing" }
  );

  useEffect(() => {
    if (!token) return;
    let active = true;
    unsubscribeNewsletter(token)
      .then((res) => active && setState({ kind: "done", email: res.email }))
      .catch((err) =>
        active &&
        setState({ kind: "error", message: err instanceof Error ? err.message : t("error") })
      );
    return () => {
      active = false;
    };
  }, [token, t]);

  return (
    <div
      className="q-scope w-full max-w-md mx-auto text-center rounded-frame border border-line bg-paper p-8 md:p-12"
    >
      {state.kind === "loading" && (
        <>
          <Spinner />
          <h1 className="t-h2 text-ink mt-6 mb-3">{t("loadingTitle")}</h1>
        </>
      )}

      {state.kind === "done" && (
        <>
          <Icon tone="ok"><CheckCircle2 className="w-7 h-7" /></Icon>
          <h1 className="t-h2 text-ink mt-6 mb-3">{t("doneTitle")}</h1>
          <p className="t-body text-ink-soft">
            {state.email ? t("doneBodyEmail", { email: state.email }) : t("doneBody")}
          </p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <Icon tone="err"><XCircle className="w-7 h-7" /></Icon>
          <h1 className="t-h2 text-ink mt-6 mb-3">{t("errorTitle")}</h1>
          <p className="t-body text-ink-soft">{state.message === "missing" ? t("missing") : t("errorBody")}</p>
        </>
      )}

      <Link
        href="/"
        className="q-btn bg-ink text-paper hover:bg-black mt-10"
      >
        {t("backHome")}
        <ArrowRight className="w-4 h-4" />
      </Link>

    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-gold text-gold-ink">
      <Loader2 className="w-7 h-7 animate-spin" />
    </span>
  );
}

function Icon({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center justify-center w-14 h-14 rounded-full border ${tone === "ok" ? "border-gold text-gold-ink" : "border-alert-ink text-alert-ink"}`}>
      {children}
    </span>
  );
}
