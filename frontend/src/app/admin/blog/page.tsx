"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2, Plus, Pencil, ExternalLink } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, formatDate, type Paginated } from "@/components/admin/admin-ui";

type Post = {
  id: number; title: string; slug: string; excerpt: string | null;
  status: string; published_at: string | null; updated_at: string;
  author?: { id: number; name: string } | null;
};

const FILTERS = ["", "published", "draft"];

export default function BlogAdminPage() {
  const [list, setList]       = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("");

  const load = useCallback(async () => {
    try {
      const q = filter ? `?status=${filter}` : "";
      const res = await apiAdmin<Paginated<Post>>(`/admin/blog/posts${q}`);
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const select = (f: string) => { setLoading(true); setFilter(f); };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Blog" subtitle="Write, edit, and publish posts for the public blog." />
        <Link href="/admin/blog/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold" style={{ background: "#1E1E1E", color: "#fff" }}>
          <Plus className="w-4 h-4" />New post
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button key={f || "all"} onClick={() => select(f)} className="text-xs font-semibold px-3.5 py-2 rounded-full capitalize transition-colors" style={{ background: filter === f ? "#1E1E1E" : "#FFFFFF", color: filter === f ? "#FFFFFF" : "#777777", border: "1px solid rgba(0,0,0,0.06)" }}>
            {f || "All posts"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No posts yet. Create your first one." />
      ) : (
        <div className="space-y-2.5">
          {list.map((p) => (
            <div key={p.id} className="bg-white rounded-[18px] border border-black/[0.05] p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-0.5 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: "#1E1E1E" }}>{p.title}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={p.status === "published" ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" } : { background: "rgba(0,0,0,0.06)", color: "#777" }}>
                    {p.status}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: "#999" }}>
                  {p.author?.name ? `${p.author.name} · ` : ""}
                  {p.status === "published" && p.published_at ? `Published ${formatDate(p.published_at)}` : `Updated ${formatDate(p.updated_at)}`}
                </p>
              </div>
              {p.status === "published" && (
                <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#777" }}>
                  View<ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <Link href={`/admin/blog/${p.id}/edit`} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-full" style={{ background: "#F2F2F2", color: "#1E1E1E" }}>
                <Pencil className="w-3.5 h-3.5" />Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
