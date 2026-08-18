"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ShieldCheck, CheckCircle2, StickyNote } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { type Trial, type Flag, fmtNumber, fmtDate, TRIP_STATUS_STYLE } from "@/lib/fet-trials";
import FetTrialResult from "@/components/admin/FetTrialResult";

/**
 * The internal review page: the same result screen staff see in the admin
 * panel, served on its own token for a leadership review outside staff
 * sign-in. Read-only by construction — it renders the display components and
 * carries no way to change anything.
 *
 * Deliberately fuller than the client link: the findings and the decisions
 * taken on them, with their notes, are the credibility of the number, so a
 * reviewer sees them alongside the result rather than having to ask.
 */
export default function ReviewTrialView({ token }: { token: string }) {
  const [trial, setTrial] = useState<Trial | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/trials/review/${token}`, { headers: { Accept: "application/json" } });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "This link is no longer active.");
        return;
      }
      const body = await res.json();
      setTrial(body.data);
    } catch {
      setError("We could not load this page. Please try again.");
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Shell>
        <div className="rounded-[20px] border p-8 text-center" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
          <p className="text-lg mb-2" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>{error}</p>
          <p className="text-sm" style={{ color: "#999" }}>Please ask for an up-to-date link.</p>
        </div>
      </Shell>
    );
  }

  if (!trial) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-24" style={{ color: "#999" }}>
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      </Shell>
    );
  }

  const settled = trial.flags.filter((f) => f.resolution);
  const open = trial.flags.filter((f) => !f.resolution);

  return (
    <Shell>
      {/* header */}
      <div className="rounded-[20px] border p-6 mb-5" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-3"
          style={{ background: "rgba(122,96,32,0.08)", color: "#7A6020" }}>
          <ShieldCheck className="w-3.5 h-3.5" />Internal review — not for clients
        </span>
        <h1 className="text-2xl mb-1" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", color: "#1E1E1E" }}>
          {trial.client_company}
        </h1>
        <p className="text-sm" style={{ color: "#767065" }}>
          {trial.reference}
          {trial.registration ? ` · ${trial.registration}` : ""}
          {trial.vehicle_make ? ` · ${trial.vehicle_make}` : ""}
          {trial.installed_on ? ` · device fitted ${fmtDate(trial.installed_on)}` : ""}
        </p>
      </div>

      {/* the exact result screen from the admin panel, read-only */}
      <FetTrialResult trial={trial} onGoToTab={() => {}} />

      {/* the note kept on the trial */}
      {trial.notes && (
        <div className="rounded-[20px] border p-6 mt-5" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#7A6020" }}>
            <StickyNote className="w-4 h-4" />Note on this trial
          </span>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#454545" }}>{trial.notes}</p>
        </div>
      )}

      {/* decisions taken — the credibility trail */}
      {(settled.length > 0 || open.length > 0) && (
        <div className="rounded-[20px] border p-6 mt-5" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-4" style={{ color: "#7A6020" }}>
            <CheckCircle2 className="w-4 h-4" />Data questions, and how each was settled
          </span>
          <div className="space-y-4">
            {settled.map((f) => <FlagRow key={f.id} flag={f} />)}
            {open.map((f) => <FlagRow key={f.id} flag={f} />)}
          </div>
        </div>
      )}

      {/* trip log */}
      <div className="rounded-[20px] border p-6 mt-5 overflow-x-auto" style={{ borderColor: "rgba(0,0,0,0.08)", background: "#fff" }}>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "#7A6020" }}>Every trip on the record</span>
        <table className="w-full text-sm mt-3" style={{ borderCollapse: "collapse", fontVariantNumeric: "tabular-nums" }}>
          <thead>
            <tr style={{ color: "#767065" }}>
              {["Date", "Destination", "Period", "km", "Fuel (L)", "km/L", "Standing", "Reason / note"].map((h, i) => (
                <th key={h} className={`pb-2 pr-4 text-[11px] uppercase tracking-wide font-bold ${i >= 3 && i <= 5 ? "text-right" : "text-left"}`}
                  style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trial.trips.map((t) => {
              const st = TRIP_STATUS_STYLE[t.status];
              return (
                <tr key={t.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <td className="py-2 pr-4 whitespace-nowrap" style={{ color: "#454545" }}>{fmtDate(t.trip_date)}</td>
                  <td className="py-2 pr-4" style={{ color: "#1E1E1E", fontWeight: 600 }}>{t.route_label}</td>
                  <td className="py-2 pr-4" style={{ color: "#454545" }}>{t.phase === "trial" ? "With FET" : "Before FET"}</td>
                  <td className="py-2 pr-4 text-right" style={{ color: "#454545" }}>{fmtNumber(t.distance_km)}</td>
                  <td className="py-2 pr-4 text-right" style={{ color: "#454545" }}>{fmtNumber(t.fuel_used_l, 1)}</td>
                  <td className="py-2 pr-4 text-right" style={{ color: "#454545" }}>{fmtNumber(t.km_per_l, 2)}</td>
                  <td className="py-2 pr-4">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: st.background, color: st.color }}>{st.label}</span>
                  </td>
                  <td className="py-2 text-[12px]" style={{ color: "#767065", maxWidth: "22rem" }}>{t.exclusion_reason ?? t.notes ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs mt-8" style={{ color: "#999" }}>
        Internal Vitorra Holdings view. Please do not forward this link outside the company.
      </p>
    </Shell>
  );
}

function FlagRow({ flag }: { flag: Flag }) {
  const settled = Boolean(flag.resolution);
  return (
    <div className="pl-3" style={{ borderLeft: `2px solid ${settled ? "rgba(34,197,94,0.4)" : "rgba(158,59,51,0.4)"}` }}>
      <p className="text-sm" style={{ color: "#1E1E1E" }}>{flag.message}</p>
      {settled ? (
        <p className="text-[12px] mt-1" style={{ color: "#767065" }}>
          <b style={{ color: "#16A34A" }}>
            {flag.resolution === "excluded" ? "Left out of the calculation" : flag.resolution === "corrected" ? "Corrected" : "Accepted"}
          </b>
          {flag.resolution_note ? ` — ${flag.resolution_note}` : ""}
        </p>
      ) : (
        <p className="text-[12px] mt-1 font-bold" style={{ color: "#9E3B33" }}>Still open</p>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#F2F2F2" }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-[11px] font-bold uppercase mb-6" style={{ color: "#7A6020", letterSpacing: "0.25em" }}>Vitorra Holdings</p>
        {children}
      </div>
    </div>
  );
}
