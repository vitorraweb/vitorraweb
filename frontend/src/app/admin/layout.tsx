"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LayoutGrid, Search, ChevronDown } from "lucide-react";
import { auth, apiAdmin, canAccess } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { routeFor, appFor } from "@/lib/admin-apps";
import { UserMenu } from "@/components/admin/admin-ui";
import { NotificationBell } from "@/components/admin/NotificationBell";
import { CommandPalette } from "@/components/admin/CommandPalette";

/* Routes reachable without a session — the guard below skips them entirely. */
const PUBLIC_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

/* ─── The console shell ───────────────────────────────────────────────────────
   Odoo-style: /admin is a launcher of apps (lib/admin-apps.ts); inside an app
   the top bar carries that app's name and its own short menu. The apps button
   (top left) always returns to the launcher, and ⌘K / Ctrl K opens a palette
   that reaches any screen or record.                                        */

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [palette, setPalette] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;
    const u = auth.getUser();
    if (!u) { router.push("/admin/login"); return; }
    // Session timeout (anti-hijacking): if the stored expiry has passed, sign
    // out immediately rather than waiting for the next request to 401.
    if (auth.isExpired()) { auth.clear(); router.push("/admin/login?expired=1"); return; }
    // Non-staff accounts (e.g. customer portal logins) have no admin-panel
    // access at all — bounce them out and clear the stale session.
    const role = u.role?.toLowerCase();
    if (role !== "admin" && role !== "ops") {
      auth.clear();
      router.push("/admin/login");
      return;
    }
    setUser(u);
    // Defense-in-depth: if the current screen maps to a module/role this user
    // lacks, bounce to the launcher (the backend also returns 403 regardless).
    const current = routeFor(pathname);
    if (current && !canAccess(u, current)) {
      router.replace("/admin");
    }
  }, [pathname, router]);

  // While a tab is left open, watch the clock and sign out the moment the
  // session expires — don't wait for the next click or API call.
  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) return;
    const id = setInterval(() => {
      if (auth.isExpired()) { auth.clear(); router.push("/admin/login?expired=1"); }
    }, 60_000);
    return () => clearInterval(id);
  }, [pathname, router]);

  // ⌘K / Ctrl K anywhere in the console.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  const app = useMemo(() => appFor(pathname), [pathname]);
  const menu = useMemo(() => (app && user ? app.items.filter((i) => canAccess(user, i)) : []), [app, user]);
  const current = useMemo(() => routeFor(pathname), [pathname]);

  const logout = async () => {
    try { await apiAdmin("/auth/logout", { method: "POST" }); } catch { /* */ }
    auth.clear();
    router.push("/admin/login");
  };

  if (!mounted) return null;
  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  if (!user) return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="admin-console min-h-screen bg-paper-deep text-ink-soft">
      <header className="sticky top-0 z-40 bg-paper border-b border-line">
        <div className="flex items-center gap-1 h-12 px-2 sm:px-3">
          <Link
            href="/admin"
            className="c-icon-btn"
            aria-label="All apps"
            title="All apps"
            aria-current={pathname === "/admin" ? "page" : undefined}
          >
            <LayoutGrid className="w-[18px] h-[18px]" />
          </Link>

          {app ? (
            <>
              <Link href={menu[0]?.href ?? "/admin"} className="flex items-center gap-2 pl-1 pr-3 mr-1 h-8 shrink-0">
                <app.icon className="w-4 h-4 text-gold-ink" aria-hidden="true" />
                <span className="font-serif text-[17px] leading-none text-ink">{app.name}</span>
              </Link>
              {/* App menu: inline on desktop, a dropdown on small screens. */}
              <nav aria-label={`${app.name} menu`} className="hidden md:flex items-stretch self-stretch">
                {menu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="c-menu-link"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              {menu.length > 1 && (
                <div className="relative md:hidden">
                  <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-expanded={menuOpen} className="flex items-center gap-1 h-8 px-2 text-[13px] text-ink">
                    {current?.label ?? "Menu"} <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                  </button>
                  {menuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-paper border border-line rounded-frame shadow-[0_12px_32px_rgba(0,0,0,0.12)] py-1 z-50">
                      {menu.map((item) => (
                        <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2 text-[13px] ${isActive(item.href) ? "text-ink bg-paper-deep" : "text-ink-soft hover:bg-paper-deep"}`}>
                          <item.icon className="w-4 h-4 text-ink-muted" />{item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Link href="/admin" className="flex items-center gap-2.5 pl-1 pr-3 h-8 shrink-0">
              <Image src="/logo.png" alt="" width={20} height={20} />
              <span className="font-serif text-[17px] leading-none text-ink">Vitorra</span>
              <span className="hidden sm:inline text-[11px] uppercase tracking-[0.16em] text-ink-muted">Console</span>
            </Link>
          )}

          <div className="ml-auto flex items-center gap-1">
            <button type="button" onClick={() => setPalette(true)} className="c-search-trigger" aria-label="Search (Ctrl K)">
              <Search className="w-4 h-4" aria-hidden="true" />
              <span className="hidden lg:inline">Search or jump to…</span>
              <kbd className="c-kbd hidden lg:inline-flex">⌘K</kbd>
            </button>
            <NotificationBell />
            <UserMenu user={user} onLogout={logout} />
          </div>
        </div>
      </header>

      {/* min-w-0 lets wide children (the Pipeline board) scroll inside
          themselves instead of stretching the page. */}
      <main className="min-w-0 px-4 sm:px-6 py-6 mx-auto max-w-[1680px]">{children}</main>

      <CommandPalette user={user} open={palette} onClose={() => setPalette(false)} onLogout={logout} />
    </div>
  );
}
