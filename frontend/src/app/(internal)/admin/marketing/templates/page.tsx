"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Plus, Trash2, Pencil, Sparkles } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, formatDate } from "@/components/admin/admin-ui";
import type { SavedDesign, Starter } from "@/components/admin/marketing/shared";
import { DEFAULT_SETTINGS } from "@/components/admin/marketing/EmailDesigner";

/* ─── Marketing → Templates ───────────────────────────────────────────────────
   Start from a ready-made layout or a blank page; saved templates are reused
   across campaigns.                                                        */

export default function TemplatesPage() {
  const router = useRouter();
  const [starters, setStarters] = useState<Starter[]>([]);
  const [saved, setSaved] = useState<SavedDesign[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await apiAdmin<{ data: SavedDesign[]; starters: Starter[] }>("/admin/marketing/designs");
      setSaved(r.data); setStarters(r.starters);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not load"); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (name: string, design: unknown, key: string) => {
    setBusy(key);
    try {
      const r = await apiAdmin<{ data: { id: number } }>("/admin/marketing/designs", { method: "POST", body: JSON.stringify({ name, design }) });
      router.push(`/admin/marketing/templates/${r.data.id}`);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create"); setBusy(null); }
  };

  const remove = async (d: SavedDesign) => {
    if (!window.confirm(`Delete the template "${d.name}"? Campaigns already made from it are not affected.`)) return;
    await apiAdmin(`/admin/marketing/designs/${d.id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="pb-12">
      <PageHeader
        title="Templates"
        subtitle="Design campaign emails once and reuse them. Every template carries the Vitorra footer and an unsubscribe link."
        actions={
          <button className="c-btn c-btn-primary" disabled={busy !== null} onClick={() => create("Untitled template", { settings: DEFAULT_SETTINGS, blocks: [] }, "blank")}>
            {busy === "blank" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}Blank template
          </button>
        }
      />
      {error && <p className="text-[14px] text-alert-ink mb-4">{error}</p>}

      <h2 className="text-[16px] font-semibold text-ink mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold-ink" />Start from a ready-made layout</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-8">
        {starters.map((s) => (
          <div key={s.key} className="c-panel p-4 flex flex-col">
            <MiniPreview design={s.design} />
            <p className="text-[15px] font-semibold text-ink mt-3">{s.name}</p>
            <p className="text-[13px] text-ink-muted mt-1 flex-1">{s.description}</p>
            <button className="c-btn mt-3" disabled={busy !== null} onClick={() => create(s.name, s.design, s.key)}>
              {busy === s.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}Use this layout
            </button>
          </div>
        ))}
      </div>

      <h2 className="text-[16px] font-semibold text-ink mb-3">Saved templates</h2>
      {saved === null ? (
        <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
      ) : saved.length === 0 ? (
        <p className="c-panel px-4 py-6 text-[14px] text-ink-muted">No saved templates yet. Start from a layout above.</p>
      ) : (
        <div className="c-panel overflow-x-auto">
          <table className="c-table">
            <thead><tr><th>Template</th><th>Product</th><th>Last edited</th><th className="w-40" /></tr></thead>
            <tbody>
              {saved.map((d) => (
                <tr key={d.id}>
                  <td><Link href={`/admin/marketing/templates/${d.id}`} className="font-medium text-ink hover:underline">{d.name}</Link></td>
                  <td>{d.product ?? "Any"}</td>
                  <td className="text-ink-muted">{formatDate(d.updated_at)}</td>
                  <td className="text-right whitespace-nowrap">
                    <Link href={`/admin/marketing/templates/${d.id}`} className="c-btn c-btn-ghost"><Pencil className="w-4 h-4" />Edit</Link>
                    <button onClick={() => remove(d)} className="c-btn c-btn-ghost text-alert-ink" aria-label={`Delete ${d.name}`}><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** A tiny, static sketch of a layout's blocks — enough to tell them apart. */
function MiniPreview({ design }: { design: SavedDesign["design"] }) {
  return (
    <div className="rounded border border-line p-3" style={{ background: design.settings.canvas }}>
      <div className="mx-auto w-[70%] space-y-1.5 p-2" style={{ background: design.settings.background }}>
        {design.blocks.slice(0, 9).map((b) => {
          const h = { logo: 10, heading: 8, text: 14, image: 34, button: 9, divider: 2, spacer: 5, columns: 22 }[b.type] ?? 8;
          const bg = { logo: "#C5B27A", heading: "#1E1E1E", text: "#D7D9DD", image: "#B8C4D0", button: "#1E1E1E", divider: "#C5B27A", spacer: "transparent", columns: "#CFD6DD" }[b.type];
          const w = b.type === "button" ? "40%" : b.type === "logo" ? "18%" : b.type === "heading" ? "75%" : "100%";
          const align = (b.props as { align?: string }).align === "center" || b.type === "logo" ? "auto" : 0;
          return <div key={b.id} style={{ height: h, width: w, background: bg, marginLeft: align, marginRight: align, borderRadius: 2 }} />;
        })}
      </div>
    </div>
  );
}
