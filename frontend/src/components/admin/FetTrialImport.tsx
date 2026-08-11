"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Upload, CheckCircle2, AlertTriangle, FileSpreadsheet, ArrowRight } from "lucide-react";
import { apiAdmin, uploadAdmin } from "@/lib/auth";
import { type Trial, fmtDate } from "@/lib/fet-trials";

type SheetInfo = { name: string; rows: number; header_row: number | null; data_rows: number; confidence: number };
type UnitQuestion = { field: string; header: string; question: string; suggested: string; options: string[] };
type Preview = {
  sheet: string;
  header_row: number;
  headers: string[];
  mapping: Record<string, string>;
  unmapped: { field: string; label: string; required: string }[];
  unit_questions: UnitQuestion[];
  sample: Record<string, unknown>[];
  row_count: number;
  rejected: Record<string, string>;
  blank_rows: number;
  /** Set when nothing could be read — says why, and what to change. */
  diagnosis: string | null;
};
type FieldSpec = { field: string; label: string; required: boolean };
type PreviewResponse = {
  handle: string;
  filename: string;
  sheets: SheetInfo[];
  preview: Preview;
  saved_template: { id: number; name: string; sheet_hint: string | null; mapping: Record<string, string>; unit_hints: Record<string, string> | null } | null;
  fields: FieldSpec[];
};
type ImportRun = {
  id: number; filename: string; sheet: string | null;
  rows_total: number; rows_imported: number; rows_flagged: number; rows_rejected: number;
  rejections: Record<string, string> | null; imported_by: string | null; created_at: string;
};

const selectCls = "w-full text-sm rounded-xl px-3 py-2 border outline-none";
const selectStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

/**
 * Upload the client's own export, confirm how it should be read, then commit.
 *
 * The confirmation step is the whole point. Moving a spreadsheet process into
 * software without it would only make the same silent mistakes faster — so the
 * mapping is shown, ambiguous units are asked about, and unreadable rows are
 * listed by name rather than dropped.
 */
export default function FetTrialImport({
  trial,
  onChange,
}: {
  trial: Trial;
  onChange: (t: Trial) => void;
}) {
  const [stage, setStage] = useState<"upload" | "confirm" | "done">("upload");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [res, setRes] = useState<PreviewResponse | null>(null);
  const [sheet, setSheet] = useState("");
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [units, setUnits] = useState<Record<string, string>>({});
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [result, setResult] = useState<ImportRun | null>(null);
  const [history, setHistory] = useState<ImportRun[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiAdmin<{ data: ImportRun[] }>(`/admin/fet-trials/${trial.id}/imports`);
      setHistory(r.data);
    } catch { /* history is a nicety, not worth an error */ }
  }, [trial.id]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  const upload = async (file: File) => {
    setBusy(true); setMsg("");
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await uploadAdmin<PreviewResponse>(`/admin/fet-trials/${trial.id}/imports/preview`, form);
      setRes(r);
      setSheet(r.preview.sheet);
      // A saved layout for this client wins — that is the point of saving it.
      setMapping(r.saved_template?.mapping ?? r.preview.mapping);
      setUnits(r.saved_template?.unit_hints ?? {});
      setStage("confirm");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "That file could not be read.");
    } finally { setBusy(false); }
  };

  const reread = async (nextSheet: string) => {
    if (!res) return;
    setBusy(true); setMsg("");
    try {
      const r = await apiAdmin<{ preview: Preview }>(`/admin/fet-trials/${trial.id}/imports/repreview`, {
        method: "POST",
        body: JSON.stringify({ handle: res.handle, sheet: nextSheet, units }),
      });
      setSheet(nextSheet);
      setMapping(r.preview.mapping);
      setRes({ ...res, preview: r.preview });
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Could not read that sheet.");
    } finally { setBusy(false); }
  };

  /** Re-read the stored upload with an adjusted column mapping. */
  const remap = async (next: Record<string, string>) => {
    if (!res) return;
    try {
      const r = await apiAdmin<{ preview: Preview }>(`/admin/fet-trials/${trial.id}/imports/repreview`, {
        method: "POST",
        body: JSON.stringify({ handle: res.handle, sheet, mapping: next, units }),
      });
      setRes({ ...res, preview: r.preview });
    } catch { /* leave the previous preview in place */ }
  };

  const commit = async () => {
    if (!res) return;
    if (res.preview.row_count === 0) {
      setMsg("There is nothing to import yet — fix the column mapping above first.");
      return;
    }
    const unanswered = res.preview.unit_questions.filter((q) => !units[q.field]);
    if (unanswered.length > 0) { setMsg("Please answer the question about units before importing."); return; }

    setBusy(true); setMsg("");
    try {
      const r = await apiAdmin<{ import: ImportRun; data: Trial }>(`/admin/fet-trials/${trial.id}/imports/commit`, {
        method: "POST",
        body: JSON.stringify({
          handle: res.handle, filename: res.filename, sheet, mapping, units,
          save_template: saveTemplate, template_name: `${trial.client_company} export`,
        }),
      });
      onChange(r.data);
      setResult(r.import);
      setStage("done");
      loadHistory();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "The import failed.");
    } finally { setBusy(false); }
  };

  const restart = () => { setStage("upload"); setRes(null); setResult(null); setMsg(""); setUnits({}); };

  return (
    <div className="space-y-5">
      {stage === "upload" && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-6">
          <p className="text-sm font-semibold mb-1" style={{ color: "#1E1E1E" }}>Upload the client&rsquo;s file</p>
          <p className="text-xs mb-5 leading-relaxed" style={{ color: "#999" }}>
            Send whatever they already produce — their own Excel or CSV export, in their own layout. There is no need to
            copy it into a template first; that is what caused the mistakes this replaces.
            {trial.trips.length > 0 && " Re-uploading an updated file is safe: trips are matched on destination and date, so anything you have already decided is kept."}
          </p>

          <label
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-10 cursor-pointer"
            style={{ borderColor: "rgba(0,0,0,0.12)", background: "#FAFAF8" }}
          >
            {busy ? <Loader2 className="w-7 h-7 animate-spin" style={{ color: "#C5B27A" }} /> : <Upload className="w-7 h-7" style={{ color: "#C5B27A" }} />}
            <span className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>{busy ? "Reading the file…" : "Choose a file"}</span>
            <span className="text-xs" style={{ color: "#AAA" }}>Excel or CSV, up to 8 MB</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              disabled={busy}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
            />
          </label>
          {msg && <p className="text-sm mt-3" style={{ color: "#C0392B" }}>{msg}</p>}
        </div>
      )}

      {stage === "confirm" && res && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-6">
          <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
            <div>
              <p className="text-sm font-semibold" style={{ color: "#1E1E1E" }}>Check before importing</p>
              <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                <FileSpreadsheet className="w-3 h-3 inline mr-1" />{res.filename} · {res.preview.row_count} trips found
              </p>
            </div>
            <button onClick={restart} className="text-sm font-medium" style={{ color: "#999" }}>Use a different file</button>
          </div>

          {res.saved_template && (
            <p className="text-xs rounded-xl px-3 py-2 mb-4" style={{ background: "rgba(197,178,122,0.1)", color: "#7A6020" }}>
              Using the layout saved for {trial.client_company} — no mapping needed unless their format has changed.
            </p>
          )}

          {res.sheets.length > 1 && (
            <div className="mb-5">
              <p className="text-xs font-medium mb-1.5" style={{ color: "#888" }}>Which sheet holds the trips?</p>
              <div className="flex flex-wrap gap-2">
                {res.sheets.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => s.name !== sheet && reread(s.name)}
                    disabled={busy}
                    className="text-left rounded-xl px-3 py-2 border"
                    style={{
                      borderColor: s.name === sheet ? "#C5B27A" : "rgba(0,0,0,0.08)",
                      background: s.name === sheet ? "rgba(197,178,122,0.08)" : "#fff",
                    }}
                  >
                    <span className="text-sm font-semibold block" style={{ color: "#1E1E1E" }}>{s.name}</span>
                    <span className="text-[11px]" style={{ color: "#AAA" }}>
                      {s.header_row === null ? "no headings found" : `${s.data_rows} rows`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Ambiguous units — asked, never assumed. */}
          {res.preview.unit_questions.length > 0 && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(138,90,24,0.07)" }}>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#8A5A18" }}>
                <AlertTriangle className="w-3.5 h-3.5" />One thing to confirm
              </p>
              {res.preview.unit_questions.map((q) => (
                <div key={q.field} className="mb-3 last:mb-0">
                  <p className="text-sm leading-relaxed mb-2" style={{ color: "#454545" }}>{q.question}</p>
                  <div className="flex gap-2">
                    {q.options.map((o) => (
                      <button
                        key={o}
                        onClick={() => setUnits({ ...units, [q.field]: o })}
                        className="text-sm font-semibold px-3.5 py-1.5 rounded-full border"
                        style={{
                          borderColor: units[q.field] === o ? "#8A5A18" : "rgba(0,0,0,0.1)",
                          background: units[q.field] === o ? "rgba(138,90,24,0.12)" : "#fff",
                          color: units[q.field] === o ? "#8A5A18" : "#777",
                        }}
                      >
                        {o === "kg" ? "Kilogrammes" : "Tonnes"}
                        {o === q.suggested && <span className="text-[10px] font-normal ml-1">(likely)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {res.preview.diagnosis && (
            <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(158,59,51,0.07)" }}>
              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#9E3B33" }}>
                <AlertTriangle className="w-3.5 h-3.5" />No trips could be read
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>{res.preview.diagnosis}</p>
            </div>
          )}

          <p className="text-xs font-medium mb-2" style={{ color: "#888" }}>How the columns will be read</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {res.fields.map((f) => (
              <label key={f.field} className="flex items-center gap-2">
                <span className="text-xs w-40 shrink-0" style={{ color: f.required ? "#1E1E1E" : "#999" }}>
                  {f.label}{f.required && <span style={{ color: "#C0392B" }}> *</span>}
                </span>
                <select
                  value={mapping[f.field] ?? ""}
                  onChange={(e) => {
                    const next = { ...mapping, [f.field]: e.target.value };
                    setMapping(next);
                    // Re-read with the corrected mapping so the row count and
                    // any diagnosis update as you fix it.
                    remap(next);
                  }}
                  className={selectCls}
                  style={selectStyle}
                >
                  <option value="">— not in this file —</option>
                  {res.preview.headers.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </label>
            ))}
          </div>

          {Object.keys(res.preview.rejected).length > 0 && (
            <div className="rounded-2xl p-4 mb-4" style={{ background: "#F7F7F5" }}>
              <p className="text-[11px] font-bold uppercase tracking-wide mb-2" style={{ color: "#8A5A18" }}>
                {Object.keys(res.preview.rejected).length} row{Object.keys(res.preview.rejected).length === 1 ? "" : "s"} cannot be read
              </p>
              <ul className="space-y-1">
                {Object.entries(res.preview.rejected).map(([ref, why]) => (
                  <li key={ref} className="text-xs" style={{ color: "#777" }}><strong>{ref}</strong> — {why}</li>
                ))}
              </ul>
            </div>
          )}

          {msg && <p className="text-sm mb-3" style={{ color: "#C0392B" }}>{msg}</p>}

          <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer" style={{ color: "#454545" }}>
            <input type="checkbox" checked={saveTemplate} onChange={(e) => setSaveTemplate(e.target.checked)} />
            Remember this layout for {trial.client_company}&rsquo;s future files
          </label>

          <button
            onClick={commit}
            disabled={busy || res.preview.row_count === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "#C5B27A", color: "#1E1E1E", opacity: busy || res.preview.row_count === 0 ? 0.5 : 1 }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            Import {res.preview.row_count} trips
          </button>
        </div>
      )}

      {stage === "done" && result && (
        <div className="bg-white rounded-[20px] border p-6" style={{ borderColor: "rgba(34,197,94,0.3)" }}>
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide mb-3" style={{ color: "#16A34A" }}>
            <CheckCircle2 className="w-4 h-4" />Imported
          </span>
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            <Bucket label="Read in" value={result.rows_imported} tone="good" />
            <Bucket label="Need a look" value={result.rows_flagged} tone={result.rows_flagged > 0 ? "warn" : "plain"} />
            <Bucket label="Could not read" value={result.rows_rejected} tone={result.rows_rejected > 0 ? "bad" : "plain"} />
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#454545" }}>
            {result.rows_flagged > 0
              ? `${result.rows_flagged} trip${result.rows_flagged === 1 ? " has a question" : "s have questions"} against ${result.rows_flagged === 1 ? "it" : "them"} — see the Data checks tab. ${result.rows_flagged === 1 ? "It is" : "They are"} held out of the calculation until settled.`
              : "Every trip read cleanly."}
          </p>
          <button onClick={restart} className="mt-4 text-sm font-semibold px-3.5 py-1.5 rounded-full" style={{ background: "#F2F2F2", color: "#555" }}>
            Import another file
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-white rounded-[20px] border border-black/[0.06] p-5">
          <p className="text-sm font-semibold mb-3" style={{ color: "#1E1E1E" }}>Previous imports</p>
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="flex items-center gap-3 text-xs py-1.5 border-b last:border-0" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" style={{ color: "#CCC" }} />
                <span className="flex-1 min-w-0 truncate" style={{ color: "#454545" }}>{h.filename}</span>
                <span style={{ color: "#999" }}>{h.rows_imported} trips</span>
                {h.rows_rejected > 0 && <span style={{ color: "#9E3B33" }}>{h.rows_rejected} skipped</span>}
                <span style={{ color: "#BBB" }}>{h.imported_by ?? "—"} · {fmtDate(h.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Bucket({ label, value, tone }: { label: string; value: number; tone: "good" | "warn" | "bad" | "plain" }) {
  const colours = {
    good: { background: "rgba(34,197,94,0.1)", color: "#16A34A" },
    warn: { background: "rgba(138,90,24,0.1)", color: "#8A5A18" },
    bad: { background: "rgba(158,59,51,0.09)", color: "#9E3B33" },
    plain: { background: "#F7F7F5", color: "#999" },
  }[tone];

  return (
    <div className="rounded-2xl p-3.5" style={{ background: colours.background }}>
      <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: colours.color, opacity: 0.75 }}>{label}</p>
      <p className="font-bold tabular-nums" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "22px", color: colours.color }}>{value}</p>
    </div>
  );
}
