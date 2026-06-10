"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, ShoppingCart, Mail, Users, Contact, FileText, Package, Images, Settings, LogOut, Menu, X } from "lucide-react";
import { auth, apiAdmin, canAccess } from "@/lib/auth";
import type { AdminUser } from "@/lib/auth";

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

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F2F2F2" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <Image src="/logo.png" alt="Vitorra" width={32} height={32} />
          <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "15px", fontWeight: 600 }}>
            Vitorra Admin
          </span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.filter((n) => canAccess(user, n)).map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{ background: active ? "rgba(197,178,122,0.15)" : "transparent", color: active ? "#C5B27A" : "rgba(255,255,255,0.65)" }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-5 border-t pt-4" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-3 mb-3">
            <p className="text-xs font-semibold" style={{ color: "#FFFFFF" }}>{user.name}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{user.role}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-colors hover:bg-white/5" style={{ color: "rgba(255,255,255,0.55)" }}>
            <LogOut className="w-4 h-4" />Logout
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex-1 lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between px-6 h-14 border-b bg-white/80" style={{ backdropFilter: "blur(8px)", borderColor: "rgba(0,0,0,0.07)" }}>
          <button className="lg:hidden p-1.5 rounded-lg hover:bg-black/5" onClick={() => setOpen(o => !o)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link href="/" className="ml-auto text-xs font-medium hover:opacity-60 transition-opacity" style={{ color: "#777777" }}>
            ← Back to site
          </Link>
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
