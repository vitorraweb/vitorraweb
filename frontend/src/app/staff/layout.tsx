"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Users, ShieldCheck, CalendarDays, ClipboardCheck, Menu, X, LogOut, ExternalLink } from "lucide-react";
import { staffAuth, apiStaff, STAFF_ROLES } from "@/lib/staff-auth";
import type { StaffUser } from "@/lib/staff-auth";

type NavItem = { label: string; href: string; icon: typeof LayoutDashboard; supervisorOnly?: boolean };

const nav: NavItem[] = [
  { label: "Dashboard",          href: "/staff",           icon: LayoutDashboard },
  { label: "Leave",              href: "/staff/leave",     icon: CalendarDays },
  { label: "My reports",         href: "/staff/reports",   icon: ClipboardCheck },
  { label: "My documents",       href: "/staff/documents", icon: FileText },
  { label: "My team",            href: "/staff/team",      icon: Users, supervisorOnly: true },
  { label: "Profile & security", href: "/staff/profile",   icon: ShieldCheck },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]               = useState<StaffUser | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [open, setOpen]               = useState(false);
  const [mounted, setMounted]         = useState(false);

  useEffect(() => {
    setMounted(true);
    if (pathname === "/staff/login") return;
    const u = staffAuth.getUser();
    if (!u) { router.push("/staff/login"); return; }
    if (!STAFF_ROLES.includes(u.role)) { staffAuth.clear(); router.push("/staff/login"); return; }
    if (staffAuth.isExpired()) { staffAuth.clear(); router.push("/staff/login?expired=1"); return; }
    setUser(u);
    // Whether to show the "My team" nav — only for people with direct reports.
    apiStaff<{ data: { is_supervisor: boolean } }>("/staff/me")
      .then((r) => setIsSupervisor(!!r.data.is_supervisor))
      .catch(() => { /* leave hidden */ });
  }, [pathname, router]);

  useEffect(() => {
    if (pathname === "/staff/login") return;
    const id = setInterval(() => {
      if (staffAuth.isExpired()) { staffAuth.clear(); router.push("/staff/login?expired=1"); }
    }, 60_000);
    return () => clearInterval(id);
  }, [pathname, router]);

  const logout = async () => {
    try { await apiStaff("/auth/logout", { method: "POST" }); } catch { /* */ }
    staffAuth.clear();
    router.push("/staff/login");
  };

  if (!mounted) return null;
  if (pathname === "/staff/login") return <>{children}</>;
  if (!user) return null;

  const visible = nav.filter((n) => !n.supervisorOnly || isSupervisor);
  const current = [...visible].sort((a, b) => b.href.length - a.href.length)
    .find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F2F2F2" }}>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex flex-col transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
        style={{ backgroundColor: "#1E1E1E", color: "#FFFFFF" }}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b" style={{ borderColor: "rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(197,178,122,0.08), transparent)" }}>
          <Image src="/logo.png" alt="Vitorra" width={32} height={32} className="shrink-0" />
          <div className="leading-tight">
            <p style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "16px", fontWeight: 600, letterSpacing: "-0.01em" }}>
              Vitorra<span style={{ color: "#C5B27A" }}> Team</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.35)" }}>Staff portal</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visible.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || (href !== "/staff" && pathname.startsWith(href + "/"));
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium transition-colors border-l-[3px]"
                style={{
                  background: active ? "rgba(197,178,122,0.12)" : "transparent",
                  color: active ? "#C5B27A" : "rgba(255,255,255,0.6)",
                  borderColor: active ? "#C5B27A" : "transparent",
                }}>
                <Icon className="w-4 h-4 shrink-0" />{label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-3 space-y-0.5 border-t pt-3" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {(user.role === "admin" || user.role === "ops") && (
            <Link href="/admin" className="flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
              <ExternalLink className="w-4 h-4 shrink-0" />Admin panel
            </Link>
          )}
          <button onClick={logout} className="w-full flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-xl text-sm font-medium text-left" style={{ color: "rgba(255,255,255,0.6)" }}>
            <LogOut className="w-4 h-4 shrink-0" />Log out
          </button>
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex-1 lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 sm:px-6 h-16 border-b bg-white/80" style={{ backdropFilter: "blur(8px)", borderColor: "rgba(0,0,0,0.07)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-black/5 shrink-0" onClick={() => setOpen((o) => !o)} aria-label="Toggle navigation">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="truncate" style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "20px", fontWeight: 600, color: "#1E1E1E", letterSpacing: "-0.01em" }}>
              {current?.label ?? "Staff"}
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold shrink-0" style={{ background: "#C5B27A", color: "#1E1E1E" }}>
              {user.name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[13px] font-semibold" style={{ color: "#1E1E1E" }}>{user.name}</span>
              <span className="text-[11px] capitalize" style={{ color: "#999999" }}>{user.role}</span>
            </span>
          </div>
        </header>
        <main className="p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
