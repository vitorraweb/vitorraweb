"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, ShoppingCart, Mail, Users, Contact, FileText, Package, Images, Settings, Menu, X, CheckSquare } from "lucide-react";
import { auth, apiAdmin, canAccess } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";
import { UserMenu } from "@/components/admin/admin-ui";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; module?: string; adminOnly?: boolean };

const nav: NavItem[] = [
  { label: "Dashboard",   href: "/admin",              icon: LayoutDashboard },
  { label: "Enquiries",   href: "/admin/enquiries",    icon: MessageSquare, module: "enquiries" },
  { label: "Customers",   href: "/admin/customers",    icon: Contact,       module: "customers" },
  { label: "Prospects",   href: "/admin/prospects",    icon: Users,         module: "prospects" },
  { label: "Products",    href: "/admin/products",     icon: Package,       module: "products" },
  { label: "Blog",        href: "/admin/blog",         icon: FileText,      module: "blog" },
  { label: "Media",       href: "/admin/media",        icon: Images,        module: "media" },
  { label: "Messages",    href: "/admin/messages",     icon: Mail,          module: "messages" },
  { label: "Orders",      href: "/admin/orders",       icon: ShoppingCart,  module: "orders" },
  { label: "Tasks",       href: "/admin/tasks",        icon: CheckSquare,   module: "tasks" },
  { label: "Settings",    href: "/admin/settings",     icon: Settings,      adminOnly: true },
  { label: "Staff",       href: "/admin/staff",        icon: Users,         adminOnly: true },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AdminUser | null>(null);
  const [open, setOpen]       = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname === "/admin/login") return;
    const u = auth.getUser();
    if (!u) { router.push("/admin/login"); return; }
    setUser(u);
    // Defense-in-depth: if the current screen maps to a module/role this user
    // lacks, bounce to the dashboard (the backend also returns 403 regardless).
    const current = [...nav]
      .sort((a, b) => b.href.length - a.href.length)
      .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));
    if (current && current.href !== "/admin" && !canAccess(u, current)) {
      router.replace("/admin");
    }
  }, [pathname, router]);

  const logout = async () => {
    try { await apiAdmin("/auth/logout", { method: "POST" }); } catch { /* */ }
    auth.clear();
    router.push("/admin/login");
  };

  if (!mounted) return null;
  if (pathname === "/admin/login") return <>{children}</>;
  if (!user) return null;

  const current = [...nav]
    .sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F2F2F2" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}
      >
        <div
          className="flex items-center gap-3 px-5 h-16 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(197,178,122,0.08), transparent)" }}
        >
          <Image src="/logo.png" alt="Vitorra" width={32} height={32} className="shrink-0" />
          <div className="leading-tight">
            <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Vitorra<span style={{ color: "#C5B27A" }}> Admin</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>
              Holdings Limited
            </p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.filter((n) => canAccess(user, n)).map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-[3px]"
                style={{
                  background: active ? "rgba(197,178,122,0.12)" : "transparent",
                  color: active ? "#C5B27A" : "rgba(255,255,255,0.6)",
                  borderColor: active ? "#C5B27A" : "transparent",
                }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-5 pb-5 pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.25)" }}>
            Internal use only
          </p>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:pl-60">
        <header
          className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b bg-white/80"
          style={{ backdropFilter: "blur(8px)", borderColor: "rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 shrink-0" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1
              className="truncate"
              style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E", letterSpacing: "-0.01em" }}
            >
              {current?.label ?? "Admin"}
            </h1>
          </div>
          <UserMenu user={user} onLogout={logout} />
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
