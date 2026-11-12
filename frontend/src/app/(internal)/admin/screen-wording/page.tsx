"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RotateCcw, Send } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { ScreenRunningOrder } from "@/components/admin/ScreenRunningOrder";
import { ScreenLogoEditor } from "@/components/admin/ScreenLogoEditor";
import { COPY_DRAFT_KEY, copyFields, type CopyField } from "@/components/display/scenes";

/* ─── Operations → Screen wording ─────────────────────────────────────────────
   Change the words on the reception and street screens without a release. The
   preview shows unsaved edits; Publish sends them, and running screens pick them
   up within about a minute. Numbers, prices, links and pictures are not here on
   purpose.                                                                   */

function WordingTab({ tabs }: { tabs: React.ReactNode }) {
  const fields = useMemo(() => copyFields(), []);
  const groups = useMemo(() => {
    const out = new Map<string, CopyField[]>();
    for (const f of fields) out.set(f.group, [...(out.get(f.group) ?? []), f]);
    // In the order the screen shows them.
    const order = ["Opening", "Reception welcome", "Fuel Eco Tech: 3D film captions", "Fuel Eco Tech: installation film captions", "Fuel Eco Tech", "SEAL Wound Spray", "Vitorra Coffee", "Logistics", "Credentials", "Visit (TV and projector)", "Visit (street screen)", "Ticker", "Small labels"];
    return [...out.entries()].sort(([a], [b]) => order.indexOf(a) - order.indexOf(b));
  }, [fields]);

  const [saved, setSaved] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState("scene=ident");
  const [screen, setScreen] = useState("mode=street");

  useEffect(() => {
    apiAdmin<{ data: { copy?: Record<string, string> } }>("/admin/display")
      .then((r) => { setSaved(r.data.copy ?? {}); setEdits(r.data.copy ?? {}); })
      .catch((e) => setNote(e instanceof Error ? e.message : "Could not load the wording."))
      .finally(() => setLoading(false));
  }, []);

  // The preview reads unsaved edits from this browser, and updates as you type.
  useEffect(() => { localStorage.setItem(COPY_DRAFT_KEY, JSON.stringify(edits)); }, [edits]);

  const dirty = JSON.stringify(edits) !== JSON.stringify(saved);
  const current = (f: CopyField) => (f.key in edits ? edits[f.key] : f.value);
  const edit = (f: CopyField, value: string) => {
    setNote("");
    setEdits((all) => {
      const rest = { ...all };
      delete rest[f.key];
      return value === f.value ? rest : { ...rest, [f.key]: value };
    });
  };
  const blocked = fields.filter((f) => !f.optional && !current(f).trim());

  const publish = async () => {
    setBusy(true); setNote("");
    try {
      const r = await apiAdmin<{ data: { copy: Record<string, string> } }>("/admin/display/copy", { method: "PUT", body: JSON.stringify({ copy: edits }) });
      setSaved(r.data.copy); setEdits(r.data.copy);
      setNote("Published. The screens update within about a minute.");
    } catch (e) { setNote(e instanceof Error ? e.message : "Publishing failed."); } finally { setBusy(false); }
  };

  const src = `/display?${screen}&${preview.replace(/(^|&)mode=[a-z]+/, "")}&draft=1`.replace("&&", "&");

  return (
    <div>
      <PageHeader title="Screen editor" subtitle="Change the words on the reception and street screens. Numbers, prices and links stay locked." actions={<>
        {dirty && <button type="button" className="c-btn" onClick={() => setEdits(saved)}><RotateCcw aria-hidden="true" className="w-4 h-4" />Discard changes</button>}
        <button type="button" className="c-btn c-btn-primary" disabled={!dirty || busy || blocked.length > 0} onClick={() => void publish()}>{busy ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Send aria-hidden="true" className="w-4 h-4" />}Publish</button>
      </>} />
      {tabs}
      {note && <p role="status" className="text-[13px] mb-3">{note}</p>}
      {blocked.length > 0 && <p role="alert" className="text-[13px] mb-3" style={{ color: "var(--o-danger)" }}>{blocked[0].group}, {blocked[0].label}: this line can&apos;t be empty.</p>}

      {loading ? <Loader2 aria-label="Loading" className="w-5 h-5 animate-spin" /> : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 items-start">
          <div className="space-y-4 min-w-0">
            {groups.map(([group, list]) => (
              <details key={group} className="c-panel" open={group === groups[0][0]}>
                <summary className="c-panel-head cursor-pointer c-panel-title">
                  {group}
                  {list.some((f) => f.key in edits) && <span className="text-[12px] font-normal">{list.filter((f) => f.key in edits).length} changed</span>}
                </summary>
                <div className="p-4 space-y-3">
                  {list.map((f) => {
                    return (
                      <label key={f.key} className="block">
                        <span className="flex items-center justify-between gap-2 text-[12.5px] mb-1">
                          {f.label}{f.optional ? " (optional)" : ""}
                          {f.key in edits && <button type="button" className="underline text-[12px]" onClick={(e) => { e.preventDefault(); edit(f, f.value); }}>Use original</button>}
                        </span>
                        <input value={current(f)} maxLength={200} onFocus={() => setPreview(f.preview)} onChange={(e) => edit(f, e.target.value)} className="c-input w-full" />
                      </label>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>

          <div className="xl:sticky xl:top-20 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-[13px]">Preview{dirty ? " (not published yet)" : ""}. Click a line to see it.</p>
              <select aria-label="Which screen" value={screen} onChange={(e) => setScreen(e.target.value)} className="c-select">
                <option value="mode=street">Street screen</option>
                <option value="mode=tv">Reception TV</option>
                <option value="mode=projector">Projector</option>
              </select>
            </div>
            <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: "16 / 9" }}>
              <iframe key={src} src={src} title="Screen preview" className="absolute inset-0 w-full h-full border-0" />
            </div>
            <p className="text-[12.5px] mt-2">Long lines shrink to fit. Keep headlines to 3 to 7 words, and check they still read in about 2 seconds.</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Operations → Screen editor ─────────────────────────────────────────────
   Three tabs: what plays and in what order (videos, designs, built-in
   scenes), the words on the screens, and the logo (size and image).         */
export default function ScreenEditorPage() {
  const [tab, setTab] = useState<"order" | "words" | "logo">("order");
  const tabs = (
    <div role="tablist" aria-label="Screen editor" className="flex gap-5 mb-4" style={{ borderBottom: "1px solid var(--o-line)" }}>
      {([["order", "Running order"], ["words", "Wording"], ["logo", "Logo"]] as const).map(([id, label]) => (
        <button key={id} type="button" role="tab" aria-selected={tab === id} className="c-tab" onClick={() => setTab(id)}>{label}</button>
      ))}
    </div>
  );
  if (tab === "words") return <WordingTab tabs={tabs} />;
  if (tab === "logo") return <ScreenLogoEditor tabs={tabs} />;
  return (
    <div>
      <PageHeader title="Screen editor" subtitle="What the screens play, in what order. Add videos and 1920 × 1080 designs, switch scenes off, move them up or down." />
      {tabs}
      <ScreenRunningOrder />
    </div>
  );
}
