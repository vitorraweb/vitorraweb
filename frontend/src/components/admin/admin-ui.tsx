"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, LogOut } from "lucide-react";
import type { AdminUser } from "@/lib/auth";

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  // enquiries
  new:         { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  in_progress: { bg: "rgba(59,130,246,0.12)",  fg: "#2563EB" },
  quoted:      { bg: "rgba(139,92,246,0.12)",  fg: "#7C3AED" },
  converted:   { bg: "rgba(34,197,94,0.12)",   fg: "#16A34A" },
  closed:      { bg: "rgba(0,0,0,0.06)",       fg: "#777777" },
  // messages
  unread:      { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  read:        { bg: "rgba(0,0,0,0.06)",       fg: "#777777" },
  replied:     { bg: "rgba(34,197,94,0.12)",   fg: "#16A34A" },
  // orders
  pending:     { bg: "rgba(197,178,122,0.16)", fg: "#7A6020" },
  processing:  { bg: "rgba(59,130,246,0.12)",  fg: "#2563EB" },
  shipped:     { bg: "rgba(139,92,246,0.12)",  fg: "#7C3AED" },
  delivered:   { bg: "rgba(34,197,94,0.12)",   fg: "#16A34A" },
  complete:    { bg: "rgba(34,197,94,0.12)",   fg: "#16A34A" },
  cancelled:   { bg: "rgba(192,57,43,0.1)",    fg: "#C0392B" },
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const c = STATUS_COLORS[status] ?? { bg: "rgba(0,0,0,0.06)", fg: "#777777" };
  return (
    <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide" style={{ background: c.bg, color: c.fg }}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8">
      <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "28px", fontWeight: 700, color: "#1E1E1E" }}>{title}</h1>
      <p className="text-sm mt-1" style={{ color: "#777777" }}>{subtitle}</p>
    </div>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Empty({ label }: { label: string }) {
  return (
    <div className="bg-white rounded-[24px] p-16 border border-black/[0.05] text-center">
      <p style={{ color: "#999999", fontSize: "15px" }}>{label}</p>
    </div>
  );
}

/** Minimal inline trend line — pass a week of daily counts. */
export function Sparkline({ data, color = "#C5B27A" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const w = 100;
  const h = 28;
  const max = Math.max(1, ...data);
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h - (v / max) * h}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-7 mt-2" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** "3m ago" / "2h ago" / "5d ago" — pass a ticking `now` (ms) so it stays live without calling Date.now() in render. */
export function formatRelativeTime(iso: string, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

/** Small pulsing dot used for the "live" polling indicator. */
export function LiveDot() {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: "#16A34A" }} />
      <span className="relative inline-flex rounded-full w-2 h-2" style={{ background: "#16A34A" }} />
    </span>
  );
}

/** Two-letter initials from a display name, used for avatar chips. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Header profile chip — avatar, name/role, and a dropdown with site link + logout. */
export function UserMenu({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2.5 pl-1.5 pr-2.5 sm:pr-3 py-1.5 rounded-full transition-colors hover:bg-black/[0.04]"
      >
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold shrink-0"
          style={{ background: "#C5B27A", color: "#1E1E1E" }}
        >
          {initials(user.name)}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[13px] font-semibold" style={{ color: "#1E1E1E" }}>{user.name}</span>
          <span className="text-[11px] capitalize" style={{ color: "#999999" }}>{user.role}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "#999999" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl border border-black/[0.06] py-1.5 z-50 animate-[vitorra-fade-in_0.15s_ease-out]"
          style={{ boxShadow: "0 16px 48px rgba(0,0,0,0.14)" }}
          role="menu"
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            <p className="text-sm font-semibold truncate" style={{ color: "#1E1E1E" }}>{user.name}</p>
            <p className="text-xs truncate mt-0.5" style={{ color: "#999999" }}>{user.email}</p>
            <span
              className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "rgba(197,178,122,0.16)", color: "#7A6020" }}
            >
              {user.role}
            </span>
          </div>
          <div className="py-1">
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-[#F2F2F2]"
              style={{ color: "#454545" }}
              role="menuitem"
            >
              <ExternalLink className="w-4 h-4" style={{ color: "#999999" }} />
              View site
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left transition-colors hover:bg-[#FBEAEA]"
              style={{ color: "#C0392B" }}
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
