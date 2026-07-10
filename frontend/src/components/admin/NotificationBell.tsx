"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check } from "lucide-react";
import { apiAdmin } from "@/lib/auth";

type NotificationItem = {
  id: string;
  data: { title: string; body: string; url?: string };
  read_at: string | null;
  created_at: string;
};

/* The notification bar — a bell with an unread badge, in the admin header.
   Polls rather than pushes (no websocket infra here), which is plenty for
   something staff check a few times a day rather than needing instantly. */
const POLL_MS = 45_000;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    apiAdmin<{ data: NotificationItem[]; unread_count: number }>("/notifications")
      .then((r) => { setItems(r.data); setUnread(r.unread_count); })
      .catch(() => { /* silent — not worth surfacing a poll failure */ });
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = async (n: NotificationItem) => {
    setOpen(false);
    if (!n.read_at) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)));
      setUnread((u) => Math.max(0, u - 1));
      apiAdmin(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    }
    if (n.data.url) router.push(n.data.url);
  };

  const markAllRead = async () => {
    setItems((list) => list.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
    setUnread(0);
    try { await apiAdmin("/notifications/read-all", { method: "POST" }); } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-black/[0.04]"
      >
        <Bell className="w-[18px] h-[18px]" style={{ color: "#555" }} />
        {unread > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold"
            style={{ background: "#C0392B", color: "#fff" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-30 rounded-2xl border shadow-xl overflow-hidden w-80"
          style={{ background: "#fff", borderColor: "rgba(0,0,0,0.08)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <span className="text-xs font-bold uppercase tracking-[0.08em]" style={{ color: "#999" }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#7A6020" }}>
                <Check className="w-3 h-3" />Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm" style={{ color: "#999" }}>Nothing yet.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className="w-full text-left px-4 py-3 border-b last:border-0 hover:bg-black/[0.02] transition-colors flex items-start gap-2.5"
                  style={{ borderColor: "rgba(0,0,0,0.05)" }}
                >
                  {!n.read_at && <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#C5B27A" }} />}
                  <div className={n.read_at ? "pl-4" : ""}>
                    <p className="text-xs font-semibold" style={{ color: "#1E1E1E" }}>{n.data.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#777" }}>{n.data.body}</p>
                    <p className="text-[10px] mt-1" style={{ color: "#bbb" }}>{timeAgo(n.created_at)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
