"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Trash2, ArrowLeft, ExternalLink } from "lucide-react";
import { apiAdmin } from "@/lib/auth";

type Status = "draft" | "published";

type Form = {
  title: string; slug: string; excerpt: string; content: string;
  cover_image: string; seo_title: string; seo_description: string; status: Status;
  // Swahili translation (optional). Cleared = no translation; the public /sw
  // blog falls back to the English fields above per-field.
  sw_title: string; sw_excerpt: string; sw_content: string;
  sw_seo_title: string; sw_seo_description: string;
};

type ApiTranslation = {
  locale: string;
  title?: string | null; excerpt?: string | null; content?: string | null;
  seo_title?: string | null; seo_description?: string | null;
};
type ApiPost = Partial<Record<keyof Form, string | null>> & { translations?: ApiTranslation[] };

const EMPTY: Form = {
  title: "", slug: "", excerpt: "", content: "", cover_image: "", seo_title: "", seo_description: "", status: "draft",
  sw_title: "", sw_excerpt: "", sw_content: "", sw_seo_title: "", sw_seo_description: "",
};

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const inputCls = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none transition-colors";
const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

export default function BlogEditor({ postId }: { postId?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(EMPTY);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!postId) return;
    apiAdmin<{ data: ApiPost }>(`/admin/blog/posts/${postId}`)
      .then((res) => {
        const p = res.data;
        const sw = p.translations?.find((t) => t.locale === "sw");
        setForm({
          title: p.title ?? "", slug: p.slug ?? "", excerpt: p.excerpt ?? "", content: p.content ?? "",
          cover_image: p.cover_image ?? "", seo_title: p.seo_title ?? "", seo_description: p.seo_description ?? "",
          status: (p.status as Status) ?? "draft",
          sw_title: sw?.title ?? "", sw_excerpt: sw?.excerpt ?? "", sw_content: sw?.content ?? "",
          sw_seo_title: sw?.seo_title ?? "", sw_seo_description: sw?.seo_description ?? "",
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [postId]);

  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (status: Status) => {
    if (!form.title.trim() || !form.content.trim()) { setError("Title and content are required."); return; }
    setSaving(true); setError("");
    const payload = {
      title: form.title, slug: form.slug, excerpt: form.excerpt, content: form.content,
      cover_image: form.cover_image, seo_title: form.seo_title, seo_description: form.seo_description,
      status,
      translations: {
        sw: {
          title: form.sw_title, excerpt: form.sw_excerpt, content: form.sw_content,
          seo_title: form.sw_seo_title, seo_description: form.sw_seo_description,
        },
      },
    };
    try {
      if (postId) await apiAdmin(`/admin/blog/posts/${postId}`, { method: "PATCH", body: JSON.stringify(payload) });
      else await apiAdmin(`/admin/blog/posts`, { method: "POST", body: JSON.stringify(payload) });
      router.push("/admin/blog");
    } catch (e) { setError(e instanceof Error ? e.message : "Save failed"); setSaving(false); }
  };

  const remove = async () => {
    if (!postId || !confirm("Delete this post? This cannot be undone.")) return;
    setSaving(true);
    try { await apiAdmin(`/admin/blog/posts/${postId}`, { method: "DELETE" }); router.push("/admin/blog"); }
    catch (e) { setError(e instanceof Error ? e.message : "Delete failed"); setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;
  }

  const slugPreview = form.slug.trim() || slugify(form.title) || "your-post";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-5">
        <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "#777" }}>
          <ArrowLeft className="w-4 h-4" />All posts
        </Link>
        {postId && form.status === "published" && (
          <a href={`/blog/${slugPreview}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "#7A6020" }}>
            View live<ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      <h1 className="mb-6" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "26px", fontWeight: 700, color: "#1E1E1E" }}>
        {postId ? "Edit post" : "New post"}
      </h1>

      <div className="space-y-5">
        <Field label="Title" required>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Post title" className={inputCls} style={inputStyle} />
        </Field>

        <Field label="URL slug" hint={`Published at /blog/${slugPreview}`}>
          <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="Auto-generated from the title" className={inputCls} style={inputStyle} />
        </Field>

        <Field label="Excerpt" hint="A short summary shown in blog listings and previews.">
          <textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="One or two sentences…" className={`${inputCls} min-h-16`} style={inputStyle} />
        </Field>

        <Field label="Cover image URL">
          <input value={form.cover_image} onChange={(e) => set("cover_image", e.target.value)} placeholder="https://… (optional)" className={inputCls} style={inputStyle} />
        </Field>

        <Field label="Content" required hint="Markdown supported (headings, bold, lists, links). Raw HTML is removed automatically for security.">
          <textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder={"# Heading\n\nWrite your post in **Markdown**…"} className={`${inputCls} min-h-80`} style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }} />
        </Field>

        <details className="rounded-xl border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold" style={{ color: "#555" }}>SEO (optional)</summary>
          <div className="px-4 pb-4 space-y-4">
            <Field label="SEO title" hint="Defaults to the post title if left blank.">
              <input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="SEO description">
              <textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} className={`${inputCls} min-h-16`} style={inputStyle} />
            </Field>
          </div>
        </details>

        {/* Swahili translation — what /sw/blog serves. Any field left blank
            falls back to the English version above for that field. */}
        <details className="rounded-xl border" style={{ borderColor: "rgba(197,178,122,0.4)", background: "rgba(197,178,122,0.05)" }}>
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold" style={{ color: "#7A6020" }}>
            Swahili translation (optional)
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <p className="text-xs" style={{ color: "#999" }}>
              Shown to visitors on the Swahili (/sw) site. Leave a field blank to fall back to the English version above.
            </p>
            <Field label="Title — Swahili">
              <input value={form.sw_title} onChange={(e) => set("sw_title", e.target.value)} placeholder="Kichwa cha makala…" className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Excerpt — Swahili">
              <textarea value={form.sw_excerpt} onChange={(e) => set("sw_excerpt", e.target.value)} placeholder="Muhtasari mfupi…" className={`${inputCls} min-h-16`} style={inputStyle} />
            </Field>
            <Field label="Content — Swahili" hint="Markdown supported. Raw HTML is removed automatically for security.">
              <textarea value={form.sw_content} onChange={(e) => set("sw_content", e.target.value)} placeholder={"# Kichwa\n\nAndika makala yako kwa **Markdown**…"} className={`${inputCls} min-h-80`} style={{ ...inputStyle, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }} />
            </Field>
            <Field label="SEO title — Swahili">
              <input value={form.sw_seo_title} onChange={(e) => set("sw_seo_title", e.target.value)} className={inputCls} style={inputStyle} />
            </Field>
            <Field label="SEO description — Swahili">
              <textarea value={form.sw_seo_description} onChange={(e) => set("sw_seo_description", e.target.value)} className={`${inputCls} min-h-16`} style={inputStyle} />
            </Field>
          </div>
        </details>

        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}

        <div className="flex items-center gap-3 pt-4 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
          <button onClick={() => save("published")} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#C5B27A", color: "#1E1E1E", opacity: saving ? 0.7 : 1 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {form.status === "published" ? "Save & keep published" : "Publish"}
          </button>
          <button onClick={() => save("draft")} disabled={saving} className="px-5 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#F2F2F2", color: "#555" }}>
            Save as draft
          </button>
          {postId && (
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
