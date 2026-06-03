"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, ChevronDown, Mail, Check } from "lucide-react";
import { apiAdmin } from "@/lib/auth";
import { StatusBadge, PageHeader, formatDate, Empty, type Paginated } from "@/components/admin/admin-ui";

type Message = {
  id: number; name: string; email: string; subject: string | null;
  message: string; status: string; created_at: string;
};

export default function MessagesPage() {
  const [list, setList]       = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiAdmin<Paginated<Message>>("/admin/messages");
      setList(res.data);
    } catch { setList([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const expand = (m: Message) => {
    setOpen(open === m.id ? null : m.id);
    if (m.status === "unread") {
      setList((l) => l.map((x) => (x.id === m.id ? { ...x, status: "read" } : x)));
      apiAdmin(`/admin/messages/${m.id}/read`, { method: "PATCH" }).catch(() => {});
    }
  };

  return (
    <div>
      <PageHeader title="Messages" subtitle="General messages from the contact form." />

      {loading ? (
        <div className="flex items-center gap-2 text-sm" style={{ color: "#777777" }}><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>
      ) : list.length === 0 ? (
        <Empty label="No messages yet." />
      ) : (
        <div className="space-y-3">
          {list.map((m) => (
            <div key={m.id} className="bg-white rounded-[20px] border border-black/[0.05] overflow-hidden">
              <button onClick={() => expand(m)} className="w-full flex items-center gap-4 p-5 text-left">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className="font-semibold text-sm" style={{ color: m.status === "unread" ? "#1E1E1E" : "#666" }}>{m.name}</span>
                    {m.subject && <span className="text-xs truncate" style={{ color: "#999" }}>— {m.subject}</span>}
                  </div>
                  <p className="text-xs truncate" style={{ color: "#999999" }}>{m.email} · {formatDate(m.created_at)}</p>
                </div>
                <StatusBadge status={m.status} />
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open === m.id ? "rotate-180" : ""}`} style={{ color: "#BBBBBB" }} />
              </button>

              {open === m.id && (
                <div className="px-5 pb-5 pt-1 border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject ?? "Your message")}`} className="flex items-center gap-1.5 text-xs mb-4 mt-4 hover:underline" style={{ color: "#7A6020" }}>
                    <Mail className="w-3.5 h-3.5" />Reply to {m.email}
                  </a>
                  <p className="text-sm leading-relaxed p-4 rounded-xl" style={{ color: "#444", background: "#F8F7F5" }}>{m.message}</p>
                  {m.status !== "unread" && (
                    <p className="flex items-center gap-1.5 text-xs mt-3" style={{ color: "#16A34A" }}><Check className="w-3.5 h-3.5" />Marked as read</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
