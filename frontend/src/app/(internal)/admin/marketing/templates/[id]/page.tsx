"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Send, Check } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/admin/admin-ui";
import { EmailDesigner, type Design } from "@/components/admin/marketing/EmailDesigner";
import { PRODUCTS, type SavedDesign } from "@/components/admin/marketing/shared";

/* ─── Marketing → Templates → edit ─────────────────────────────────────────── */

export default function TemplateEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [product, setProduct] = useState<string>("");
  const [design, setDesign] = useState<Design | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiAdmin<{ data: SavedDesign }>(`/admin/marketing/designs/${id}`).then((r) => {
      setName(r.data.name); setProduct(r.data.product ?? ""); setDesign(r.data.design);
    }).catch((e) => setMsg(e instanceof Error ? e.message : "Could not load"));
  }, [id]);

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = async () => {
    if (!design) return;
    setSaving(true); setMsg("");
    try {
      const r = await apiAdmin<{ data: SavedDesign }>(`/admin/marketing/designs/${id}`, {
        method: "PUT", body: JSON.stringify({ name: name.trim() || "Untitled template", product: product || null, design }),
      });
      setDesign(r.data.design); setDirty(false); setMsg("Saved");
    } catch (e) { setMsg(e instanceof Error ? e.message : "Could not save"); }
    finally { setSaving(false); }
  };

  const useInCampaign = async () => {
    if (!design) return;
    if (dirty) await save();
    const r = await apiAdmin<{ data: { id: number } }>("/admin/marketing/campaigns", {
      method: "POST", body: JSON.stringify({ name, subject: name, design, product: product || null }),
    });
    router.push(`/admin/marketing/campaigns/${r.data.id}`);
  };

  return (
    <div className="pb-12">
      <PageHeader
        title={name || "Template"}
        actions={<>
          {msg && <span className="text-[13px] text-ink-muted inline-flex items-center gap-1">{msg === "Saved" && <Check className="w-4 h-4 text-ok-ink" />}{msg}</span>}
          <button className="c-btn" onClick={useInCampaign} disabled={!design}><Send className="w-4 h-4" />Use in a campaign</button>
          <button className="c-btn c-btn-primary" onClick={save} disabled={saving || !design}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save{dirty ? " changes" : ""}
          </button>
        </>}
      />
      <div className="flex flex-wrap gap-3 mb-4">
        <label className="flex-1 min-w-[16rem]"><span className="block text-[13px] text-ink-muted mb-1">Template name</span>
          <input className="c-input w-full" value={name} onChange={(e) => { setName(e.target.value); setDirty(true); }} />
        </label>
        <label><span className="block text-[13px] text-ink-muted mb-1">Product</span>
          <select className="c-select" value={product} onChange={(e) => { setProduct(e.target.value); setDirty(true); }}>
            <option value="">Any</option>{PRODUCTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      {design ? (
        <EmailDesigner value={design} onChange={(d) => { setDesign(d); setDirty(true); }} subject={name} />
      ) : (
        <p className="flex items-center gap-2 text-[14px] text-ink-muted"><Loader2 className="w-4 h-4 animate-spin" />Loading…</p>
      )}
    </div>
  );
}
