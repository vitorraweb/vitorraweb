"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2, ArrowLeft } from "lucide-react";
import { apiAdmin } from "@/lib/auth";

type Cat = "FET" | "SEAL" | "COFFEE" | "LOGISTICS";

type Form = {
  name: string; slug: string; category: Cat; description: string;
  price_ugx: string; price_usd: string; stock_quantity: string; is_published: boolean;
  images: string; // one URL per line
  tagline: string; weight: string; roast: string; origin: string; tasting_notes: string; badge: string;
};

type ApiProduct = {
  name?: string; slug?: string; category?: string; description?: string | null;
  price_ugx?: number | null; price_usd?: number | null; stock_quantity?: number | null;
  is_published?: boolean; images?: { url: string }[] | null; meta?: Record<string, string> | null;
};

const EMPTY: Form = {
  name: "", slug: "", category: "COFFEE", description: "", price_ugx: "", price_usd: "",
  stock_quantity: "", is_published: false, images: "",
  tagline: "", weight: "", roast: "", origin: "", tasting_notes: "", badge: "",
};

const CATS: Cat[] = ["FET", "SEAL", "COFFEE", "LOGISTICS"];
const inputCls = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
const num = (s: string) => (s.trim() === "" ? null : Number(s));

export default function ProductEditor({ productId }: { productId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(!!productId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;
    apiAdmin<{ data: ApiProduct }>(`/admin/products/${productId}`)
      .then((res) => {
        const p = res.data;
        setForm({
          name: p.name ?? "", slug: p.slug ?? "", category: (p.category as Cat) ?? "COFFEE", description: p.description ?? "",
          price_ugx: p.price_ugx != null ? String(p.price_ugx) : "", price_usd: p.price_usd != null ? String(p.price_usd) : "",
          stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : "", is_published: !!p.is_published,
          images: (p.images ?? []).map((i) => i.url).join("\n"),
          tagline: p.meta?.tagline ?? "", weight: p.meta?.weight ?? "", roast: p.meta?.roast ?? "",
          origin: p.meta?.origin ?? "", tasting_notes: p.meta?.tasting_notes ?? "", badge: p.meta?.badge ?? "",
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [productId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const payload = {
      name: form.name, slug: form.slug, category: form.category, description: form.description || null,
      price_ugx: num(form.price_ugx), price_usd: num(form.price_usd), stock_quantity: num(form.stock_quantity),
      is_published: form.is_published,
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean).map((url) => ({ url })),
      meta: { tagline: form.tagline, weight: form.weight, roast: form.roast, origin: form.origin, tasting_notes: form.tasting_notes, badge: form.badge },
    };
    try {
      if (productId) await apiAdmin(`/admin/products/${productId}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await apiAdmin(`/admin/products`, { method: "POST", body: JSON.stringify(payload) });
      router.push("/admin/products");
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); setSaving(false); }
  };

  const remove = async () => {
    if (!productId || !confirm("Delete this product? This cannot be undone.")) return;
    setSaving(true);
    try { await apiAdmin(`/admin/products/${productId}`, { method: "DELETE" }); router.push("/admin/products"); }
    catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;

  const slugPreview = form.slug.trim() || slugify(form.name) || "your-product";

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm mb-5" style={{ color: "#777" }}>
        <ArrowLeft className="w-4 h-4" />All products
      </Link>
      <h1 className="mb-6" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "26px", fontWeight: 700, color: "#1E1E1E" }}>
        {productId ? "Edit product" : "New product"}
      </h1>

      <div className="space-y-5">
        <Field label="Name" required>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} style={inputStyle} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Category" required>
            <select value={form.category} onChange={(e) => set("category", e.target.value as Cat)} className={inputCls} style={inputStyle}>
              {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="URL slug" hint={`/shop/${slugPreview}`}>
            <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="Auto from name" className={inputCls} style={inputStyle} />
          </Field>
        </div>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} className={`${inputCls} min-h-24`} style={inputStyle} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Price UGX" hint="Whole shillings">
            <input type="number" min={0} value={form.price_ugx} onChange={(e) => set("price_ugx", e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Price USD" hint="Dollars (e.g. 12.00)">
            <input type="number" min={0} step="0.01" value={form.price_usd} onChange={(e) => set("price_usd", e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
          <Field label="Stock" hint="Blank = made-to-order">
            <input type="number" min={0} value={form.stock_quantity} onChange={(e) => set("stock_quantity", e.target.value)} className={inputCls} style={inputStyle} />
          </Field>
        </div>

        <div className="bg-white rounded-[16px] border p-4 flex items-center justify-between" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <div>
            <span className="block text-sm font-medium" style={{ color: "#1E1E1E" }}>Published</span>
            <span className="block text-xs" style={{ color: "#999" }}>Visible on the public site when on.</span>
          </div>
          <button type="button" role="switch" aria-checked={form.is_published} onClick={() => set("is_published", !form.is_published)} className="relative w-11 h-6 rounded-full transition-colors shrink-0" style={{ background: form.is_published ? "#C5B27A" : "#D8D8D8" }}>
            <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform" style={{ transform: form.is_published ? "translateX(20px)" : "translateX(0)" }} />
          </button>
        </div>

        <Field label="Images" hint="One image URL per line (e.g. /products/coffee/packshot.png).">
          <textarea value={form.images} onChange={(e) => set("images", e.target.value)} placeholder={"/products/coffee/packshot.png\n/products/coffee/label-front.png"} className={`${inputCls} min-h-24`} style={{ ...inputStyle, fontFamily: "ui-monospace, monospace" }} />
        </Field>

        <details className="rounded-xl border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold" style={{ color: "#555" }}>Product details (coffee &amp; specs)</summary>
          <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tagline"><input value={form.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} style={inputStyle} /></Field>
            <Field label="Badge" hint="e.g. Bestseller"><input value={form.badge} onChange={(e) => set("badge", e.target.value)} className={inputCls} style={inputStyle} /></Field>
            <Field label="Weight"><input value={form.weight} onChange={(e) => set("weight", e.target.value)} className={inputCls} style={inputStyle} /></Field>
            <Field label="Roast"><input value={form.roast} onChange={(e) => set("roast", e.target.value)} className={inputCls} style={inputStyle} /></Field>
            <Field label="Origin"><input value={form.origin} onChange={(e) => set("origin", e.target.value)} className={inputCls} style={inputStyle} /></Field>
            <Field label="Tasting notes"><input value={form.tasting_notes} onChange={(e) => set("tasting_notes", e.target.value)} className={inputCls} style={inputStyle} /></Field>
          </div>
        </details>

        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}

        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save product
          </button>
          {productId && (
            <button onClick={remove} disabled={saving} className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#C0392B" }}>
              <Trash2 className="w-4 h-4" />Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-[0.1em] mb-1.5" style={{ color: "#999" }}>
        {label}{required && <span style={{ color: "#C5B27A" }}> *</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs" style={{ color: "#999" }}>{hint}</p>}
    </div>
  );
}
