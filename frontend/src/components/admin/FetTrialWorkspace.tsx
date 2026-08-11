"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { type Trial, STATUS_LABEL, CONFIDENCE_LABEL, CONFIDENCE_STYLE } from "@/lib/fet-trials";
import FetTrialResult from "./FetTrialResult";
import FetTrialTrips from "./FetTrialTrips";
import FetTrialFindings from "./FetTrialFindings";
import FetTrialImport from "./FetTrialImport";
import FetTrialSetup from "./FetTrialSetup";

type Tab = "result" | "trips" | "findings" | "import" | "setup";

/**
 * One client trial, end to end. Every mutation returns the whole re-analysed
 * trial, so the result on screen is never stale relative to the trips behind it
 * — a stale saving figure is exactly the thing this module exists to prevent.
 */
export default function FetTrialWorkspace({ trialId }: { trialId: number }) {
  const router = useRouter();
  const [trial, setTrial] = useState<Trial | null>(null);
  const [tab, setTab] = useState<Tab>("result");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trialId}`);
      setTrial(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this trial.");
    }
  }, [trialId]);

  useEffect(() => { load(); }, [load]);

  const revalidate = async () => {
    setBusy(true);
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trialId}/revalidate`, { method: "POST" });
      setTrial(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not re-check the data.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("Delete this trial and every trip in it? This cannot be undone.")) return;
    try {
      await apiAdmin(`/admin/fet-trials/${trialId}`, { method: "DELETE" });
      router.push("/admin/fet-trials");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the trial.");
    }
  };

  if (error && !trial) {
    return (
      <div className="pb-12">
        <BackLink />
        <p className="text-sm mt-4" style={{ color: "#C0392B" }}>{error}</p>
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}>
        <Loader2 className="w-4 h-4 animate-spin" />Loading…
      </div>
    );
  }

  const a = trial.analysis;
  const outstanding = a.blocking_flags.length + a.open_questions.length;

  const tabs: { key: Tab; label: string; badge?: number }[] = [
    { key: "result", label: "Result" },
    { key: "trips", label: "Trips", badge: trial.trips.length },
    { key: "findings", label: "Data checks", badge: outstanding || undefined },
    { key: "import", label: "Import" },
    { key: "setup", label: "Setup" },
  ];

  return (
    <div className="pb-12">
      <BackLink />

      <div className="flex items-start justify-between gap-4 flex-wrap mt-3 mb-1">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
            {trial.client_company}
          </h1>
          <p className="text-sm mt-1" style={{ color: "#999" }}>
            {trial.reference}
            {trial.registration ? ` · ${trial.registration}` : ""}
            {trial.vehicle_make ? ` · ${trial.vehicle_make}` : ""}
            {` · ${STATUS_LABEL[trial.status] ?? trial.status}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full" style={CONFIDENCE_STYLE[a.confidence.level] ?? CONFIDENCE_STYLE.insufficient}>
            {CONFIDENCE_LABEL[a.confidence.level] ?? a.confidence.level}
          </span>
          <button
            onClick={revalidate}
            disabled={busy}
            title="Run the data checks again"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: "#F2F2F2", color: "#555", opacity: busy ? 0.6 : 1 }}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Re-check
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b mt-5 mb-5 overflow-x-auto" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="relative px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
            style={{ color: tab === t.key ? "#1E1E1E" : "#999" }}
          >
            {t.label}
            {t.badge !== undefined && (
              <span
                className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={
                  t.key === "findings" && outstanding > 0
                    ? { background: "rgba(158,59,51,0.1)", color: "#9E3B33" }
                    : { background: "rgba(0,0,0,0.06)", color: "#888" }
                }
              >
                {t.badge}
              </span>
            )}
            {tab === t.key && <span className="absolute left-0 right-0 -bottom-px h-0.5" style={{ background: "#C5B27A" }} />}
          </button>
        ))}
      </div>

      {error && (
        <p className="flex items-center gap-2 text-sm mb-4" style={{ color: "#C0392B" }}>
          <AlertCircle className="w-4 h-4" />{error}
        </p>
      )}

      {tab === "result" && <FetTrialResult trial={trial} onGoToTab={setTab} />}
      {tab === "trips" && <FetTrialTrips trial={trial} onChange={setTrial} />}
      {tab === "findings" && <FetTrialFindings trial={trial} onChange={setTrial} />}
      {tab === "import" && <FetTrialImport trial={trial} onChange={setTrial} />}
      {tab === "setup" && <FetTrialSetup trial={trial} onChange={setTrial} onDelete={remove} />}
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/admin/fet-trials" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "#999" }}>
      <ArrowLeft className="w-4 h-4" />All trials
    </Link>
  );
}
