"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, LogOut, ShieldCheck, Sun, Moon, Monitor } from "lucide-react";
import { usePathname } from "next/navigation";
import { appFor } from "@/lib/admin-apps";
import { readConsoleTheme, writeConsoleTheme, type ConsoleTheme } from "@/lib/console-theme";
import type { AdminUser } from "@/lib/auth";

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

/* Status → chip tone. Shared by every list in the console so one status
   always reads the same colour wherever it appears. */
const STATUS_TONE: Record<string, string> = {
  // enquiries / pipeline
  new: "gold", in_progress: "blue", quoted: "violet", converted: "ok", closed: "muted", lost: "alert", won: "ok",
  // messages
  unread: "gold", read: "muted", replied: "ok",
  // orders / payments
  pending: "gold", processing: "blue", shipped: "violet", delivered: "ok", complete: "ok", paid: "ok", partial: "blue",
  cancelled: "alert", failed: "alert", refunded: "muted",
  // prospects / approvals
  contacted: "blue", interested: "violet", not_interested: "muted", needs_fixing: "alert",
  approved: "ok", rejected: "alert", draft: "muted", sent: "blue", overdue: "alert", void: "muted",
  // contracts
  viewed: "violet", signed: "ok", declined: "alert", expired: "alert",
};

export function statusTone(status: string): string {
  return STATUS_TONE[status?.toLowerCase?.() ?? ""] ?? "muted";
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className="c-chip capitalize" data-tone={statusTone(status)}>
      {label ?? status.replace(/_/g, " ")}
    </span>
  );
}

/**
 * Odoo's control panel: a breadcrumb (App / Screen) with the screen's
 * actions on the right. The app crumb links back to the app's first screen.
 */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  const pathname = usePathname();
  const app = appFor(pathname ?? "");
  const showApp = app && app.name !== title;

  return (
    <div className="c-page-head">
      <div className="min-w-0">
        <h1 className="o-breadcrumb">
          {showApp && (
            <>
              <Link href={app.items[0]?.href ?? "/admin"}>{app.name}</Link>
              <span className="o-sep" aria-hidden="true">/</span>
            </>
          )}
          <span className="c-title">{title}</span>
        </h1>
        {subtitle && <p className="c-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function Empty({ label }: { label: string }) {
  return (
    <div className="c-panel px-6 py-14 text-center">
      <p className="text-[13px] text-ink-muted">{label}</p>
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

/** Header profile chip — avatar, name/role, and a dropdown with appearance, site link + logout. */
export function UserMenu({ user, onLogout }: { user: AdminUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ConsoleTheme>("system");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { if (open) setTheme(readConsoleTheme()); }, [open]);

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

  const choose = (t: ConsoleTheme) => { setTheme(t); writeConsoleTheme(t); };
  const item = "flex items-center gap-2.5 px-4 py-2.5 text-[14px] w-full text-left transition-colors hover:bg-paper-deep";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md transition-colors"
        style={{ color: "var(--o-nav-text)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--o-nav-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span
          className="flex items-center justify-center w-8 h-8 rounded-full text-[12px] font-bold shrink-0"
          style={{ background: "var(--o-accent)", color: "#1E1E1E" }}
        >
          {initials(user.name)}
        </span>
        <span className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-[13.5px] font-semibold">{user.name}</span>
          <span className="text-[12px] capitalize" style={{ color: "var(--o-nav-muted)" }}>{user.role}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "var(--o-nav-muted)" }} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 bg-paper border border-line rounded-md py-1.5 z-50 animate-[vitorra-fade-in_0.15s_ease-out]"
          style={{ boxShadow: "var(--o-shadow-pop)" }}
          role="menu"
        >
          <div className="px-4 py-3 border-b border-line">
            <p className="text-[14px] font-semibold truncate text-ink">{user.name}</p>
            <p className="text-[13px] truncate mt-0.5 text-ink-muted">{user.email}</p>
          </div>

          <div className="px-4 py-3 border-b border-line">
            <p className="text-[13px] text-ink-muted mb-2">Appearance</p>
            <div className="o-seg w-full" role="group" aria-label="Appearance">
              {([["light", "Light", Sun], ["dark", "Dark", Moon], ["system", "System", Monitor]] as const).map(([v, label, Icon]) => (
                <button key={v} type="button" aria-pressed={theme === v} onClick={() => choose(v)} className="flex-1 justify-center">
                  <Icon className="w-3.5 h-3.5" />{label}
                </button>
              ))}
            </div>
          </div>

          <div className="py-1">
            <Link href="/admin/profile" onClick={() => setOpen(false)} className={`${item} text-ink-soft`} role="menuitem">
              <ShieldCheck className="w-4 h-4 text-ink-muted" />
              Profile &amp; security
            </Link>
            <Link href="/" target="_blank" rel="noopener noreferrer" className={`${item} text-ink-soft`} role="menuitem">
              <ExternalLink className="w-4 h-4 text-ink-muted" />
              View site
            </Link>
            <button type="button" onClick={onLogout} className={`${item} text-alert-ink`} role="menuitem">
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
