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
      className="w-full max-w-md mx-auto text-center rounded-[28px] p-8 md:p-10"
      style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 8px 40px rgba(0,0,0,0.06)" }}
    >
      {state.kind === "loading" && (
        <>
          <Spinner />
          <h1 className="title">{t("loadingTitle")}</h1>
        </>
      )}

      {state.kind === "done" && (
        <>
          <Icon tone="ok"><CheckCircle2 className="w-7 h-7" /></Icon>
          <h1 className="title">{t("doneTitle")}</h1>
          <p className="body">
            {state.email ? t("doneBodyEmail", { email: state.email }) : t("doneBody")}
          </p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <Icon tone="err"><XCircle className="w-7 h-7" /></Icon>
          <h1 className="title">{t("errorTitle")}</h1>
          <p className="body">{state.message === "missing" ? t("missing") : t("errorBody")}</p>
        </>
      )}

      <Link
        href="/"
        className="btn-primary inline-flex items-center gap-2 mt-8"
      >
        {t("backHome")}
        <ArrowRight className="w-4 h-4" />
      </Link>

      <style>{`
        .title { font-family: var(--font-playfair, Georgia, serif); font-size: 26px; font-weight: 700; color: #1E1E1E; margin: 18px 0 8px; letter-spacing: -0.02em; }
        .body  { font-size: 15px; line-height: 1.7; color: #555555; }
      `}</style>
    </div>
  );
}

function Spinner() {
  return (
    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full" style={{ background: "rgba(197,178,122,0.14)", color: "#7A6020" }}>
      <Loader2 className="w-7 h-7 animate-spin" />
    </span>
  );
}

function Icon({ tone, children }: { tone: "ok" | "err"; children: React.ReactNode }) {
  const bg = tone === "ok" ? "rgba(197,178,122,0.16)" : "rgba(180,60,60,0.10)";
  const fg = tone === "ok" ? "#7A6020" : "#B43C3C";
  return (
    <span className="inline-flex items-center justify-center w-14 h-14 rounded-full" style={{ background: bg, color: fg }}>
      {children}
    </span>
  );
}
