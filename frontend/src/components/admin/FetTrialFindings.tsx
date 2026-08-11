"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { type Trial, type Flag, SEVERITY_STYLE, fmtDate } from "@/lib/fet-trials";

const RESOLUTIONS = [
  { key: "accepted", label: "It's fine as it is", hint: "The reading is correct; count the trip." },
  { key: "corrected", label: "I've corrected it", hint: "The data has been fixed on the Trips tab." },
  { key: "excluded", label: "Leave the trip out", hint: "Not comparable — keep it out of the calculation." },
] as const;

/**
 * Everything the system has queried about this trial's data.
 *
 * Each finding is a question in plain words with a suggested next step, and
 * settling one always records who decided what and why. Nothing is auto-fixed:
 * the difference between "the truck really did carry a return load" and "that
 * figure was mistyped" is a judgement only a person can make.
 */
export default function FetTrialFindings({
  trial,
  onChange,
}: {
  trial: Trial;
  onChange: (t: Trial) => void;
}) {
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [answering, setAnswering] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [choice, setChoice] = useState<string>("accepted");

  const outstanding = trial.flags.filter((f) => !f.resolution);
  const settled = trial.flags.filter((f) => f.resolution);

  const tripLabel = (tripId: number | null): string => {
    if (tripId === null) return "This trial";
    const t = trial.trips.find((x) => x.id === tripId);
    return t ? `${t.route_label ?? "Untitled trip"} · ${fmtDate(t.trip_date)}` : "A trip";
  };

  const resolve = async (flag: Flag) => {
    if (!note.trim()) { setMsg("Please say what you decided — it goes on the record and on the client report."); return; }
    setBusy(flag.id); setMsg("");
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/flags/${flag.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution: choice, note }),
      });
      onChange(res.data);
      setAnswering(null); setNote(""); setChoice("accepted");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not save that decision.");
    } finally { setBusy(null); }
  };

  const reopen = async (flag: Flag) => {
    setBusy(flag.id);
    try {
      const res = await apiAdmin<{ data: Trial }>(`/admin/fet-trials/${trial.id}/flags/${flag.id}/reopen`, { method: "POST" });
      onChange(res.data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not reopen it.");
    } finally { setBusy(null); }
  };

  return (
    <div>
      <p className="text-xs mb-4 leading-relaxed" style={{ color: "#999" }}>
        Anything the system could not read with confidence is raised here rather than guessed at. A trip carrying an
        unsettled &ldquo;must settle&rdquo; question is held out of the calculation until it is answered — it stays visible, with
        the reason attached.
      </p>

      {msg && <p className="text-sm mb-3" style={{ color: "#C0392B" }}>{msg}</p>}

      {outstanding.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl p-4 mb-5" style={{ background: "rgba(34,197,94,0.08)" }}>
          <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#16A34A" }} />
          <p className="text-sm" style={{ color: "#166534" }}>
            Nothing outstanding. Every question raised about this data has been settled.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 mb-6">
          {outstanding.map((f) => {
            const style = SEVERITY_STYLE[f.severity];
            const isAnswering = answering === f.id;

            return (
              <div key={f.id} className="bg-white rounded-[16px] border border-black/[0.05] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0" style={{ background: style.background, color: style.color }}>
                    {style.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold mb-1" style={{ color: "#AAA" }}>{tripLabel(f.trip_id)}</p>
                    <p className="text-sm leading-relaxed" style={{ color: "#1E1E1E" }}>{f.message}</p>
                    {f.suggested_action && (
                      <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "#888" }}>{f.suggested_action}</p>
                    )}
                  </div>
                </div>

                {isAnswering ? (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      {RESOLUTIONS.map((r) => (
                        <button
                          key={r.key}
                          onClick={() => setChoice(r.key)}
                          className="text-left rounded-xl p-3 border"
                          style={{
                            borderColor: choice === r.key ? "#C5B27A" : "rgba(0,0,0,0.08)",
                            background: choice === r.key ? "rgba(197,178,122,0.08)" : "#fff",
                          }}
                        >
                          <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{r.label}</p>
                          <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "#999" }}>{r.hint}</p>
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="What did you find out? e.g. “Client confirmed the truck carried sugar back from Kinyara.”"
                      className="w-full text-sm rounded-xl px-3 py-2 border outline-none"
                      style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" }}
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => resolve(f)}
                        disabled={busy === f.id}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full"
                        style={{ background: "#C5B27A", color: "#1E1E1E", opacity: busy === f.id ? 0.7 : 1 }}
                      >
                        {busy === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}Record it
                      </button>
                      <button onClick={() => { setAnswering(null); setNote(""); }} className="text-sm font-medium px-3 py-1.5" style={{ color: "#999" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAnswering(f.id); setNote(""); setChoice("accepted"); setMsg(""); }}
                    className="mt-3 text-sm font-semibold px-3.5 py-1.5 rounded-full"
                    style={{ background: "#F2F2F2", color: "#555" }}
                  >
                    Settle this
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {settled.length > 0 && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: "#AAA" }}>Already settled</p>
          <div className="space-y-2">
            {settled.map((f) => (
              <div key={f.id} className="bg-white rounded-[14px] border border-black/[0.04] p-3.5 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#16A34A" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold mb-0.5" style={{ color: "#AAA" }}>{tripLabel(f.trip_id)}</p>
                  <p className="text-sm leading-snug" style={{ color: "#777" }}>{f.message}</p>
                  {f.resolution_note && (
                    <p className="text-xs mt-1.5 rounded-lg px-2.5 py-1.5" style={{ background: "#F7F7F5", color: "#555" }}>
                      <strong style={{ textTransform: "capitalize" }}>{f.resolution}</strong> — {f.resolution_note}
                      {f.resolved_at && <span style={{ color: "#AAA" }}> · {fmtDate(f.resolved_at)}</span>}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => reopen(f)}
                  disabled={busy === f.id}
                  title="Reopen this question"
                  className="p-1.5 rounded-lg shrink-0"
                  style={{ background: "#F2F2F2", color: "#888" }}
                >
                  {busy === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
