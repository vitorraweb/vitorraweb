"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, Link } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { apiCustomer, customerAuth, type CustomerUser } from "@/lib/customer-auth";
import { LayoutDashboard, ShoppingBag, MessageSquare, Inbox, FileText, User, LogOut, Gauge } from "lucide-react";

const TAB_META = [
  { labelKey: "tabDashboard", href: "/account/dashboard", icon: LayoutDashboard },
  { labelKey: "tabOrders",    href: "/account/orders",    icon: ShoppingBag },
  { labelKey: "tabFet",       href: "/account/fet",       icon: Gauge },
  { labelKey: "tabEnquiries", href: "/account/enquiries", icon: MessageSquare },
  { labelKey: "tabMessages",  href: "/account/messages",  icon: Inbox },
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
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (isAuthPage) { setReady(true); return; }
    const u = customerAuth.getUser();
    if (!u) { router.push("/account/login"); return; }
    setUser(u);
    setReady(true);
    apiCustomer<{ unread_count: number }>("/account/communications")
      .then((r) => setUnreadMessages(r.unread_count))
      .catch(() => {});
  }, [pathname, isAuthPage, router]);

  const logout = () => { customerAuth.clear(); router.push("/account/login"); };

  if (!ready) return null;

  // Auth pages are intentionally chrome-free — no nav/footer, just the focused
  // split layout. The logo inside AuthShell links home so there's still a way back.
  if (isAuthPage) {
    return <main id="main" className="flex-1">{children}</main>;
  }

  /* Quiet Authority portal shell: a paper header with the customer's name,
     underlined tabs (scrolling sideways on phones), then the content. */
  return (
    <>
      <Header />
      <main id="main" className="q-scope flex-1 bg-paper pt-16 lg:pt-[6.25rem]">
        <section className="border-b border-line bg-paper">
          <div className="q-container pt-12 lg:pt-16">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <p className="t-label text-ink-muted mb-5">{t("yourAccountEyebrow")}</p>
                <h1 className="t-h1 text-ink">{t("welcome", { name: user?.name.split(" ")[0] ?? "" })}</h1>
              </div>
              <button onClick={logout} className="q-link t-small text-ink-muted hover:text-ink">
                <LogOut aria-hidden="true" className="w-3.5 h-3.5" />{t("logout")}
              </button>
            </div>

            <nav aria-label={t("yourAccountEyebrow")} className="mt-10 -mx-5 px-5 md:mx-0 md:px-0 overflow-x-auto no-scrollbar">
              <ul className="flex gap-8 min-w-max">
                {TAB_META.map((tab) => {
                  const active = pathname === tab.href || pathname.startsWith(tab.href + "/");
                  return (
                    <li key={tab.href}>
                      <Link
                        href={tab.href}
                        aria-current={active ? "page" : undefined}
                        className={`relative inline-flex items-center gap-2 pb-4 t-small transition-colors after:absolute after:inset-x-0 after:-bottom-px after:h-px after:transition-colors ${active ? "text-ink after:bg-gold" : "text-ink-muted hover:text-ink after:bg-transparent"}`}
                      >
                        <tab.icon aria-hidden="true" className="w-4 h-4" strokeWidth={1.5} />
                        {t(tab.labelKey)}
                        {tab.href === "/account/messages" && unreadMessages > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gold" aria-label={String(unreadMessages)} />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </section>

        <div className="q-container py-12 md:py-16">{children}</div>
      </main>
      <Footer />
    </>
  );
}
