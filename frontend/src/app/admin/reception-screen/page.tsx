"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, X, ExternalLink, MonitorPlay } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";

/* ─── Operations → Reception screen ───────────────────────────────────────────
   Set a personal welcome for a visiting client (shown on the reception TV only,
   never on the street screen, and it switches itself off), and preview both
   screens. The screens themselves are /display and /display?mode=street.    */

type Welcome = { name: string; line: string; until: string } | null;

export default function ReceptionScreenPage() {
  const [welcome, setWelcome] = useState<Welcome | undefined>(undefined);
  const [name, setName] = useState("");
  const [line, setLine] = useState("");
  const [hours, setHours] = useState("4");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"reception" | "projector" | "street">("reception");

  useEffect(() => {
    apiAdmin<{ data: { welcome: Welcome } }>("/admin/display").then((r) => {
      setWelcome(r.data.welcome);
      if (r.data.welcome) { setName(r.data.welcome.name); setLine(r.data.welcome.line); }
    }).catch(() => setWelcome(null));
  }, []);

  const save = async (clear = false) => {
    setBusy(true); setError("");
    try {
      const r = await apiAdmin<{ data: { welcome: Welcome } }>("/admin/display/welcome", { method: "PUT", body: JSON.stringify(clear ? { name: "" } : { name: name.trim(), line: line.trim(), hours: Number(hours) }) });
      setWelcome(r.data.welcome);
      if (clear) { setName(""); setLine(""); }
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save"); }
    finally { setBusy(false); }
  };

  const src = mode === "street" ? "/display/street" : mode === "projector" ? "/display/projector" : "/display";

  return (
    <div className="pb-12">
      <PageHeader
        title="Reception screen"
        subtitle="Welcome a visiting client by name on the reception TV, and preview the reception and street screens."
        actions={<>
          <a className="c-btn" href="/display" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />Open reception screen</a>
          <a className="c-btn" href="/display/projector" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />Open projector screen</a>
          <a className="c-btn" href="/display/street" target="_blank" rel="noopener noreferrer"><ExternalLink className="w-4 h-4" />Open street screen</a>
        </>}
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] gap-4 mt-5 items-start">
        <section className="c-panel p-5 space-y-3">
          <h3 className="text-[15px] font-semibold text-ink">Welcome a visitor</h3>
          <p className="text-[13px] text-ink-muted">Shown on the reception TV between the films. It never appears on the street screen, and it switches itself off after the time you choose.</p>
          {welcome === undefined ? <Loader2 className="w-4 h-4 animate-spin text-ink-muted" /> : welcome && (
            <p className="c-chip" data-tone="ok">On screen until {new Date(welcome.until).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
          )}
          <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Name</span>
            <input className="c-input w-full" value={name} maxLength={60} placeholder="e.g. Mr. Okello of Kampala Haulage" onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Line under it (optional)</span>
            <input className="c-input w-full" value={line} maxLength={90} placeholder="e.g. Your meeting is on the 3rd floor." onChange={(e) => setLine(e.target.value)} />
          </label>
          <label className="block"><span className="block text-[13px] text-ink-muted mb-1">Show for</span>
            <select className="c-select w-full" value={hours} onChange={(e) => setHours(e.target.value)}>
              {[["1", "1 hour"], ["2", "2 hours"], ["4", "4 hours"], ["8", "The working day"], ["24", "24 hours"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {error && <p className="text-[13px] text-alert-ink">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button className="c-btn c-btn-primary" disabled={busy || !name.trim()} onClick={() => save()}>{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Show welcome</button>
            {welcome && <button className="c-btn" disabled={busy} onClick={() => save(true)}><X className="w-4 h-4" />Take it down</button>}
          </div>
        </section>

        <section className="c-panel p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-ink inline-flex items-center gap-2"><MonitorPlay className="w-4 h-4 text-ink-muted" />Preview</h3>
            <div className="o-seg">
              <button aria-pressed={mode === "reception"} onClick={() => setMode("reception")}>Reception TV</button>
              <button aria-pressed={mode === "projector"} onClick={() => setMode("projector")}>Projector</button>
              <button aria-pressed={mode === "street"} onClick={() => setMode("street")}>Street</button>
            </div>
          </div>
          <div className="relative w-full overflow-hidden rounded-md" style={{ aspectRatio: "16 / 9", background: "#09090A" }}>
            <iframe key={src} src={src} title="Screen preview" className="absolute inset-0 w-full h-full border-0" />
          </div>
          <div className="text-[13px] text-ink-soft space-y-1.5">
            <p className="font-semibold text-ink">Full screen, without browser tabs</p>
            <p><strong>Best:</strong> on the screen&apos;s computer, open <span className="font-mono">vitorra.org{src}</span> in Chrome or Edge, then choose <em>Install</em> (the icon at the right of the address bar, or ⋮ → Cast, save and share → Install page as app). It opens full screen with no tabs. Set it to open at start-up.</p>
            <p><strong>Quick:</strong> open the page and click once anywhere (or press F). It goes full screen and stays awake.</p>
            <p><strong>Media players / dedicated PCs:</strong> start Chrome with <span className="font-mono">--kiosk https://vitorra.org{src}</span>.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
