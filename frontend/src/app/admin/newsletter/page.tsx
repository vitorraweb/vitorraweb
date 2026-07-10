"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, Send, Users, Clock, ChevronLeft, ChevronRight, ChevronDown, Mail } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { PageHeader, Empty, formatDate } from "@/components/admin/admin-ui";

type Template = { id: number; name: string; subject: string; body: string; category: string | null };

type Subscriber = {
  id: number; email: string; status: string; source: string | null;
  locale: string | null; consent_at: string | null; created_at: string;
};

type Broadcast = {
  id: number; subject: string; recipient_count: number;
  sender: { id: number; name: string } | null; created_at: string;
};

type Tab = "subscribers" | "compose" | "history";

export default function NewsletterPage() {
  const [tab, setTab] = useState<Tab>("subscribers");

  return (
    <div>
      <PageHeader title="Newsletter" subtitle="Manage subscribers and send broadcasts to your list." />

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#F2F2F2" }}>
        {(["subscribers", "compose", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-sm font-semibold px-4 py-1.5 rounded-lg capitalize transition-colors"
            style={tab === t ? { background: "#fff", color: "#1E1E1E", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#777" }}
          >
            {t === "compose" ? "Compose & Send" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "subscribers" && <SubscriberList />}
      {tab === "compose"     && <ComposeBroadcast onSent={() => setTab("history")} />}
      {tab === "history"     && <BroadcastHistory />}
    </div>
  );
}

function SubscriberList() {
  const [list, setList]   = useState<Subscriber[]>([]);
  const [meta, setMeta]   = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("");
  const [q, setQ]             = useState("");
  const [appliedQ, setApplied] = useState("");
  const [page, setPage]       = useState(1);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (status)   params.set("status", status);
      if (appliedQ) params.set("q", appliedQ);
      params.set("page", String(page));
      const res = await apiAdmin<{ data: Subscriber[]; current_page: number; last_page: number; total: number }>(
        `/admin/newsletter/subscribers?${params}`
      );
      setList(res.data);
      setMeta({ current_page: res.current_page, last_page: res.last_page, total: res.total });
    } catch { setList([]); }
    finally { setLoading(false); }
  }, [status, appliedQ, page]);

  useEffect(() => { load(); }, [load]);

  const search = () => { setLoading(true); setPage(1); setApplied(q.trim()); };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <select value={status} onChange={(e) => { setLoading(true); setPage(1); setStatus(e.target.value); }}
          className="text-sm rounded-full px-3 py-1.5 border outline-none"
          style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }}>
          <option value="">All statuses</option>
          <option value="subscribed">Subscribed</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") search(); }}
          placeholder="Search email…" className="text-sm rounded-full px-4 py-1.5 border w-56 outline-none"
          style={{ borderColor: "rgba(0,0,0,0.12)", background: "#fff" }} />
        <button onClick={search} className="text-sm font-semibold px-3.5 py-1.5 rounded-full"
          style={{ background: "#F2F2F2", color: "#555" }}>Search</button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No subscribers yet." />
      ) : (
        <>
          <p className="text-xs mb-3" style={{ color: "#999" }}>{meta.total} subscriber{meta.total === 1 ? "" : "s"}</p>
          <div className="bg-white rounded-[18px] border border-black/[0.05] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  {["Email", "Status", "Source", "Subscribed"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "#999" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-black/[0.015] transition-colors"
                    style={{ borderColor: "rgba(0,0,0,0.04)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "#1E1E1E" }}>{s.email}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={s.status === "subscribed"
                          ? { background: "rgba(34,197,94,0.12)", color: "#16A34A" }
                          : { background: "rgba(0,0,0,0.06)", color: "#777" }}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#777" }}>{s.source ?? "—"}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#999" }}>{formatDate(s.consent_at ?? s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta.last_page > 1 && (
            <div className="flex items-center justify-center gap-3 mt-4">
              <button disabled={meta.current_page <= 1} onClick={() => { setLoading(true); setPage((p) => p - 1); }}
                className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}><ChevronLeft className="w-4 h-4" />Prev</button>
              <span className="text-xs" style={{ color: "#777" }}>Page {meta.current_page} of {meta.last_page}</span>
              <button disabled={meta.current_page >= meta.last_page} onClick={() => { setLoading(true); setPage((p) => p + 1); }}
                className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full disabled:opacity-40"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)" }}>Next<ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ComposeBroadcast({ onSent }: { onSent: () => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody]       = useState("");
  const [count, setCount]     = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");
  const [preview, setPreview] = useState(false);
  const [templates, setTemplates]         = useState<Template[]>([]);
  const [templateOpen, setTemplateOpen]   = useState(false);

  useEffect(() => {
    apiAdmin<{ data: unknown[]; total: number }>("/admin/newsletter/subscribers?status=subscribed&per_page=1")
      .then((r) => setCount(r.total ?? null)).catch(() => {});
    // Same reply-templates library used on the Customers page — one set of
    // templates, reusable wherever staff compose an email.
    apiAdmin<Template[]>("/admin/templates").then((r) => setTemplates(Array.isArray(r) ? r : [])).catch(() => {});
  }, []);

  const applyTemplate = (t: Template) => {
    setSubject(t.subject);
    setBody(t.body);
    setTemplateOpen(false);
  };

  const send = async () => {
    if (!subject.trim() || !body.trim()) { setError("Subject and body are required."); return; }
    setError("");
    setSending(true);
    try {
      const res = await apiAdmin<{ message: string; recipient_count: number }>("/admin/newsletter/broadcast", {
        method: "POST",
        body: JSON.stringify({ subject: subject.trim(), body: body.trim() }),
      });
      alert(res.message);
      setSubject(""); setBody("");
      onSent();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const inputCls = "w-full text-sm rounded-xl px-3.5 py-2.5 border outline-none";
  const inputStyle = { borderColor: "rgba(0,0,0,0.12)", background: "#fff", color: "#1E1E1E" } as const;

  return (
    <div className="max-w-2xl">
      {count !== null && (
        <div className="flex items-center gap-2 mb-5 text-sm px-4 py-3 rounded-xl"
          style={{ background: "rgba(197,178,122,0.12)", color: "#7A6020" }}>
          <Users className="w-4 h-4 shrink-0" />
          This broadcast will be sent to <strong>{count}</strong> active subscriber{count === 1 ? "" : "s"}.
        </div>
      )}

      <div className="space-y-4">
        {/* Template picker — same library as the Customers reply composer */}
        {templates.length > 0 && (
          <div className="relative w-fit">
            <button onClick={() => setTemplateOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", color: "#555" }}>
              Use template <ChevronDown className={`w-3 h-3 transition-transform ${templateOpen ? "rotate-180" : ""}`} />
            </button>
            {templateOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 rounded-xl border shadow-lg overflow-hidden w-72"
                style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}>
                {templates.map((t) => (
                  <button key={t.id} onClick={() => applyTemplate(t)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-black/[0.03] transition-colors border-b last:border-0"
                    style={{ borderColor: "rgba(0,0,0,0.05)" }}>
                    <p className="text-xs font-semibold" style={{ color: "#1E1E1E" }}>{t.name}</p>
                    <p className="text-[11px] truncate" style={{ color: "#999" }}>{t.subject}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.08em] mb-1.5 block" style={{ color: "#999" }}>Subject line</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. New update from Vitorra Holdings"
            className={inputCls} style={inputStyle} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#999" }}>Message body</label>
            <button onClick={() => setPreview((p) => !p)} className="text-xs font-semibold" style={{ color: "#C5B27A" }}>
              {preview ? "Edit" : "Preview"}
            </button>
          </div>
          {preview ? (
            <div className="rounded-xl border p-4 text-sm whitespace-pre-line min-h-[200px]"
              style={{ borderColor: "rgba(0,0,0,0.12)", background: "#FAFAF8", color: "#454545" }}>
              {body || <span style={{ color: "#bbb" }}>Nothing to preview yet.</span>}
              <hr className="my-3" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
              <p className="text-xs" style={{ color: "#aaa" }}>
                — An unsubscribe link will be appended to each email automatically.
              </p>
            </div>
          ) : (
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              placeholder={"Write your message here. Plain text is fine.\n\nYou can use line breaks for paragraphs."}
              className={inputCls + " min-h-[200px] resize-y"} style={inputStyle} />
          )}
          <p className="text-[11px] mt-1.5" style={{ color: "#bbb" }}>
            A personalised unsubscribe link is added automatically to every email.
          </p>
        </div>

        {error && <p className="text-sm" style={{ color: "#C0392B" }}>{error}</p>}

        <button onClick={send} disabled={sending || !subject.trim() || !body.trim()}
          className="inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-full disabled:opacity-50"
          style={{ background: "#C5B27A", color: "#1E1E1E" }}>
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {sending ? "Sending…" : "Send broadcast"}
        </button>
      </div>
    </div>
  );
}

function BroadcastHistory() {
  const [list, setList]     = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiAdmin<{ data: Broadcast[] }>("/admin/newsletter/broadcasts")
      .then((r) => setList(r.data))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm" style={{ color: "#777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>;
  if (list.length === 0) return <Empty label="No broadcasts sent yet." />;

  return (
    <div className="space-y-2.5">
      {list.map((b) => (
        <div key={b.id} className="bg-white rounded-[18px] border border-black/[0.05] px-5 py-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <p className="font-semibold text-sm mb-0.5" style={{ color: "#1E1E1E" }}>{b.subject}</p>
              <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: "#999" }}>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{b.recipient_count} recipient{b.recipient_count === 1 ? "" : "s"}</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(b.created_at)}</span>
                {b.sender && <span>by {b.sender.name}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
