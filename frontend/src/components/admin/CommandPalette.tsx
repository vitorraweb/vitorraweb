"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft, Target, Contact, Plus, ExternalLink, ShieldCheck, LogOut, Loader2 } from "lucide-react";
import { apiAdmin, canAccess, type AdminUser } from "@/lib/auth";
import { visibleApps, type AppIcon } from "@/lib/admin-apps";

/* ─── ⌘K command palette ──────────────────────────────────────────────────────
   One box to reach anything: every screen the user may open, a few common
   actions, and — once two letters are typed — live matches from prospects
   and customers. Arrow keys move, Enter opens, Esc closes.                  */

type Entry = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: AppIcon;
  run: () => void;
  match?: string;
};

type ProspectHit = { id: number; name: string; category?: string | null; product?: string | null; location?: string | null };
type CustomerHit = { email: string; name: string; company?: string | null; stage?: string | null };

export function CommandPalette({ user, open, onClose, onLogout }: {
  user: AdminUser;
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [prospects, setProspects] = useState<ProspectHit[]>([]);
  const [customers, setCustomers] = useState<CustomerHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery(""); setCursor(0); setProspects([]); setCustomers([]);
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const go = (href: string) => { onClose(); router.push(href); };

  /* Live record search, debounced. Each source only if the user may see it. */
  useEffect(() => {
    const q = query.trim();
    if (!open || q.length < 2) { setProspects([]); setCustomers([]); setSearching(false); return; }
    setSearching(true);
    const t = setTimeout(async () => {
      const enc = encodeURIComponent(q);
      const [p, c] = await Promise.all([
        canAccess(user, { module: "prospects" })
          ? apiAdmin<{ data: ProspectHit[] }>(`/admin/prospects?q=${enc}`).then((r) => r.data.slice(0, 5)).catch(() => [])
          : Promise.resolve([]),
        canAccess(user, { module: "customers" })
          ? apiAdmin<{ data: CustomerHit[] }>(`/admin/customers?q=${enc}&per_page=5`).then((r) => r.data.slice(0, 5)).catch(() => [])
          : Promise.resolve([]),
      ]);
      setProspects(p); setCustomers(c); setSearching(false);
    }, 250);
    return () => clearTimeout(t);
  }, [query, open, user]);

  const entries = useMemo<Entry[]>(() => {
    const q = query.trim().toLowerCase();
    const screens: Entry[] = visibleApps(user).flatMap((app) =>
      app.items.map((item) => ({
        id: item.href,
        group: "Go to",
        label: item.label,
        hint: app.name,
        icon: item.icon,
        run: () => go(item.href),
        match: `${item.label} ${app.name} ${item.keywords ?? ""}`.toLowerCase(),
      })),
    );
    const actions: Entry[] = [
      ...(canAccess(user, { module: "blog" }) ? [{ id: "new-post", group: "Actions", label: "Write a blog post", icon: Plus, run: () => go("/admin/blog/new"), match: "new blog post write article" }] : []),
      ...(canAccess(user, { module: "products" }) ? [{ id: "new-product", group: "Actions", label: "Add a product", icon: Plus, run: () => go("/admin/products/new"), match: "new product add catalogue" }] : []),
      { id: "profile", group: "Actions", label: "Profile & security", icon: ShieldCheck, run: () => go("/admin/profile"), match: "profile password two factor 2fa sessions security" },
      { id: "site", group: "Actions", label: "Open the website", icon: ExternalLink, run: () => { onClose(); window.open("/", "_blank", "noopener"); }, match: "view site website public" },
      { id: "logout", group: "Actions", label: "Sign out", icon: LogOut, run: () => { onClose(); onLogout(); }, match: "log out sign out logout" },
    ];
    const filtered = q
      ? [...screens, ...actions].filter((e) => q.split(/\s+/).every((w) => e.match?.includes(w)))
      : [...screens, ...actions];

    const records: Entry[] = [
      ...customers.map((c) => ({
        id: `c-${c.email}`, group: "Customers", label: c.name || c.email,
        hint: [c.company, c.email].filter(Boolean).join(" · "), icon: Contact,
        run: () => go(`/admin/customers?q=${encodeURIComponent(c.email)}`),
      })),
      ...prospects.map((p) => ({
        id: `p-${p.id}`, group: "Prospects", label: p.name,
        hint: [p.product, p.category, p.location].filter(Boolean).join(" · "), icon: Target,
        run: () => go(`/admin/prospects?q=${encodeURIComponent(p.name)}`),
      })),
    ];
    return [...filtered, ...records];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, user, prospects, customers]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${cursor}"]`)?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!open) return null;

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(entries.length - 1, c + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); entries[cursor]?.run(); }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Search the console">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-paper rounded-frame border border-line shadow-[0_24px_64px_rgba(0,0,0,0.22)] overflow-hidden" onKeyDown={onKey}>
        <div className="flex items-center gap-3 px-4 h-12 border-b border-line">
          <Search className="w-4 h-4 text-ink-muted shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            placeholder="Search screens, customers, prospects…"
            className="flex-1 bg-transparent outline-none text-[14px] text-ink placeholder:text-ink-muted"
            aria-label="Search"
          />
          {searching && <Loader2 className="w-4 h-4 animate-spin text-ink-muted" aria-hidden="true" />}
          <kbd className="c-kbd">Esc</kbd>
        </div>
        <ul ref={listRef} className="max-h-[56vh] overflow-y-auto py-1.5" role="listbox">
          {entries.length === 0 && !searching && (
            <li className="px-4 py-8 text-center text-[13px] text-ink-muted">Nothing matches “{query}”.</li>
          )}
          {entries.map((e, i) => {
            const header = e.group !== lastGroup ? e.group : null;
            lastGroup = e.group;
            const Icon = e.icon;
            const active = i === cursor;
            return (
              <li key={e.id} role="presentation">
                {header && <p className="px-4 pt-3 pb-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">{header}</p>}
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  data-index={i}
                  onMouseMove={() => setCursor(i)}
                  onClick={e.run}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left ${active ? "bg-paper-deep" : ""}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? "text-gold-ink" : "text-ink-muted"}`} aria-hidden="true" />
                  <span className="text-[13.5px] text-ink truncate">{e.label}</span>
                  {e.hint && <span className="text-[12px] text-ink-muted truncate">{e.hint}</span>}
                  {active && <CornerDownLeft className="ml-auto w-3.5 h-3.5 text-ink-muted shrink-0" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="flex items-center gap-4 px-4 h-9 border-t border-line text-[11px] text-ink-muted bg-paper-deep">
          <span><kbd className="c-kbd">↑</kbd> <kbd className="c-kbd">↓</kbd> move</span>
          <span><kbd className="c-kbd">Enter</kbd> open</span>
          <span className="ml-auto">Type two letters to search records</span>
        </div>
      </div>
    </div>
  );
}
