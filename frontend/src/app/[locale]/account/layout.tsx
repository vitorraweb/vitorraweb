"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { customerAuth, type CustomerUser } from "@/lib/customer-auth";
import { LayoutDashboard, ShoppingBag, MessageSquare, FileText, User, LogOut } from "lucide-react";

const TAB_META = [
  { labelKey: "tabDashboard", href: "/account/dashboard", icon: LayoutDashboard },
  { labelKey: "tabOrders",    href: "/account/orders",    icon: ShoppingBag },
  { labelKey: "tabEnquiries", href: "/account/enquiries", icon: MessageSquare },
  { labelKey: "tabDocuments", href: "/account/documents", icon: FileText },
  { labelKey: "tabProfile",   href: "/account/profile",   icon: User },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/account/login" || pathname === "/account/register";
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<CustomerUser | null>(null);

  useEffect(() => {
    if (isAuthPage) { setReady(true); return; }
    const u = customerAuth.getUser();
    if (!u) { router.push("/account/login"); return; }
    setUser(u);
    setReady(true);
  }, [pathname, isAuthPage, router]);

  const logout = () => { customerAuth.clear(); router.push("/account/login"); };

  if (!ready) return null;

  // Auth pages are intentionally chrome-free — no nav/footer, just the focused
  // split layout. The logo inside AuthShell links home so there's still a way back.
  if (isAuthPage) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>
        {/* ── Dark account header band (aurora + grain, like the site heroes) ── */}
        <section className="relative overflow-hidden" style={{ backgroundColor: "#141414" }}>
          <div aria-hidden="true" className="hero-aurora-right" />
          <div aria-hidden="true" className="hero-grain" />
          <div className="max-w-[1080px] mx-auto px-6 lg:px-10 pt-28 md:pt-32 pb-8 relative z-10">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <span className="eyebrow-light mb-3 inline-flex">{t("yourAccountEyebrow")}</span>
                <h1 style={{ fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)", fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.05, color: "#FFFFFF" }}>
                  {t("welcome", { name: user?.name.split(" ")[0] ?? "" })}
                </h1>
              </div>
              <button onClick={logout} className="btn-ghost-dark"><LogOut className="w-4 h-4" />{t("logout")}</button>
            </div>

            <div className="flex gap-2 mt-8 overflow-x-auto no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0 lg:flex-wrap">
              {TAB_META.map((tab) => {
                const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-colors whitespace-nowrap"
                    style={active
                      ? { background: "#C5B27A", color: "#1E1E1E" }
                      : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <tab.icon className="w-4 h-4" />{t(tab.labelKey)}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Content ──────────────────────────────────────────────────────── */}
        <div className="max-w-[1080px] mx-auto px-6 lg:px-10 py-12 md:py-16">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
