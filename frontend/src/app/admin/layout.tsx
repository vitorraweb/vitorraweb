"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, ShoppingCart, Mail, Users, Contact, FileText, Package, Images, Settings, Menu, X, CheckSquare, Workflow, Send, LayoutTemplate, CalendarCheck, CalendarDays, Hourglass, Briefcase, TrendingUp, Truck, Wallet, ShieldCheck, Gauge, CreditCard, ChevronDown } from "lucide-react";
import { auth, apiAdmin, canAccess } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { UserMenu } from "@/components/admin/admin-ui";
import { NotificationBell } from "@/components/admin/NotificationBell";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; module?: string; adminOnly?: boolean };
type NavGroup = { label: string; items: NavItem[] };

/* Routes reachable without a session — the guard below skips them entirely. */
const PUBLIC_PATHS = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];

/* Navigation is grouped into business areas so a 24-item panel reads as a few
   short, scannable sections rather than one long list. Each item keeps its
   module/adminOnly access rule — groups with nothing visible to the current
   user are hidden entirely (header included). */
const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/admin",           icon: LayoutDashboard },
      { label: "Executive", href: "/admin/executive", icon: TrendingUp, module: "executive" },
    ],
  },
  {
    label: "Sales & CRM",
    items: [
      { label: "Enquiries", href: "/admin/enquiries", icon: MessageSquare,  module: "enquiries" },
      { label: "Customers", href: "/admin/customers", icon: Contact,        module: "customers" },
      { label: "Pipeline",  href: "/admin/pipeline",  icon: Workflow,       module: "customers" },
      { label: "Prospects", href: "/admin/prospects", icon: Users,          module: "prospects" },
      { label: "Orders",    href: "/admin/orders",    icon: ShoppingCart,   module: "orders" },
      { label: "Templates", href: "/admin/templates", icon: LayoutTemplate, module: "customers" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Accounting", href: "/admin/accounting", icon: Wallet,     module: "accounting" },
      { label: "Payments",   href: "/admin/payments",   icon: CreditCard, adminOnly: true },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Products",   href: "/admin/products",   icon: Package, module: "products" },
      { label: "Blog",       href: "/admin/blog",       icon: FileText, module: "blog" },
      { label: "Media",      href: "/admin/media",      icon: Images,   module: "media" },
      { label: "Newsletter", href: "/admin/newsletter", icon: Send,     module: "newsletter" },
      { label: "Messages",   href: "/admin/messages",   icon: Mail,     module: "messages" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "FET savings", href: "/admin/fet",       icon: Gauge,      module: "fet" },
      { label: "Suppliers",   href: "/admin/suppliers", icon: Truck,      module: "suppliers" },
      { label: "Tasks",       href: "/admin/tasks",     icon: CheckSquare, module: "tasks" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Leave",     href: "/admin/leave",     icon: CalendarCheck, module: "people" },
      { label: "Probation", href: "/admin/probation", icon: Hourglass,     module: "people" },
      { label: "Careers",   href: "/admin/careers",   icon: Briefcase,     module: "people" },
      { label: "Holidays",  href: "/admin/holidays",  icon: CalendarDays,  module: "people" },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings",     href: "/admin/settings", icon: Settings,    adminOnly: true },
      { label: "Staff",        href: "/admin/staff",    icon: Users,       adminOnly: true },
      { label: "Activity log", href: "/admin/audit",    icon: ShieldCheck, adminOnly: true },
    ],
  },
];

/* Flat list (longest-href first) for active-route detection + access guards. */
const nav: NavItem[] = navGroups
  .flatMap((g) => g.items)
  .sort((a, b) => b.href.length - a.href.length);

const COLLAPSE_KEY = "vitorra-admin-nav-collapsed";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      if (raw) setCollapsed(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
  }, []);

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
    // lacks, bounce to the dashboard (the backend also returns 403 regardless).
    const current = nav.find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
    if (current && current.href !== "/admin" && !canAccess(u, current)) {
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

  const logout = async () => {
    try { await apiAdmin("/auth/logout", { method: "POST" }); } catch { /* */ }
    auth.clear();
    router.push("/admin/login");
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      try { localStorage.setItem(COLLAPSE_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const current = useMemo(
    () => nav.find((n) => pathname === n.href || pathname.startsWith(n.href + "/")),
    [pathname]
  );
  const currentGroup = useMemo(
    () => navGroups.find((g) => g.items.some((i) => i.href === current?.href)),
    [current]
  );

  if (!mounted) return null;
  if (PUBLIC_PATHS.includes(pathname)) return <>{children}</>;
  if (!user) return null;

  const isActive = (href: string) =>
    pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F2F2F2" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ background: "linear-gradient(185deg, #1f1d18 0%, #181818 38%, #151515 100%)", color: "#FFFFFF" }}
      >
        {/* Soft gold aurora at the top of the rail */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-44"
          style={{ background: "radial-gradient(120% 80% at 18% 0%, rgba(197,178,122,0.16), transparent 70%)" }}
        />

        {/* Brand */}
        <div
          className="relative flex items-center gap-3 px-5 h-16 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <span
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{ background: "rgba(197,178,122,0.12)", border: "1px solid rgba(197,178,122,0.25)" }}
          >
            <Image src="/logo.png" alt="Vitorra" width={22} height={22} className="shrink-0" />
          </span>
          <div className="leading-tight">
            <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Vitorra<span style={{ color: "#C5B27A" }}> Admin</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Holdings Limited
            </p>
          </div>
        </div>

        {/* Grouped navigation */}
        <nav className="relative flex-1 px-3 py-3 overflow-y-auto admin-nav-scroll">
          {navGroups.map((group) => {
            const items = group.items.filter((n) => canAccess(user, n));
            if (items.length === 0) return null;
            const hasActive = items.some((i) => isActive(i.href));
            // A group stays open if the user hasn't collapsed it, OR it holds the
            // active page (so you never lose your place).
            const expanded = !collapsed.has(group.label) || hasActive;

            return (
              <div key={group.label} className="mb-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className="group/h flex items-center justify-between w-full px-3 pt-4 pb-1.5 select-none"
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors"
                    style={{ color: hasActive ? "rgba(197,178,122,0.85)" : "rgba(255,255,255,0.34)" }}
                  >
                    {group.label}
                  </span>
                  <ChevronDown
                    className="w-3.5 h-3.5 transition-transform duration-200 opacity-0 group-hover/h:opacity-100"
                    style={{ color: "rgba(255,255,255,0.4)", transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                </button>

                {expanded && (
                  <div className="space-y-0.5">
                    {items.map(({ label, href, icon: Icon }) => {
                      const active = isActive(href);
                      return (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setOpen(false)}
                          aria-current={active ? "page" : undefined}
                          className="group/i relative flex items-center gap-3 pl-3 pr-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150"
                          style={{
                            background: active
                              ? "linear-gradient(90deg, rgba(197,178,122,0.20), rgba(197,178,122,0.05))"
                              : "transparent",
                            color: active ? "#E8D6A6" : "rgba(255,255,255,0.62)",
                            boxShadow: active ? "inset 0 0 0 1px rgba(197,178,122,0.18)" : "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            if (!active) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {active && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full"
                              style={{ background: "#C5B27A" }}
                            />
                          )}
                          <Icon
                            className="w-[18px] h-[18px] shrink-0 transition-colors"
                            style={{ color: active ? "#C5B27A" : "rgba(255,255,255,0.5)" }}
                          />
                          {label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="relative px-5 pb-5 pt-4 border-t shrink-0" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#16A34A", boxShadow: "0 0 8px rgba(22,163,74,0.7)" }} />
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.3)" }}>
              Internal use only
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      {/* min-w-0 overrides the flex default of min-width:auto — without it, a
          wide child (e.g. the Pipeline board) stretches this whole container
          past the viewport instead of being clipped/scrolled by its own
          overflow-x-auto, which pushes the scrollbar to the page body. */}
      <div className="flex-1 min-w-0 lg:pl-64">
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b bg-white/80"
          style={{ backdropFilter: "blur(8px)", borderColor: "rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 shrink-0" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="min-w-0">
              {currentGroup && (
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] leading-none mb-0.5" style={{ color: "#B79A52" }}>
                  {currentGroup.label}
                </p>
              )}
              <h1
                className="truncate leading-none"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E", letterSpacing: "-0.01em" }}
              >
                {current?.label ?? "Admin"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <UserMenu user={user} onLogout={logout} />
          </div>
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
