"use client";

import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, ShoppingBag, User, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";

/* ─── Header — Quiet Authority ────────────────────────────────────────────────
   Two tiers, the way holdings groups like LVMH structure it:
     • a thin utility row — careers, blog, contact, language, account;
     • the main row, which leads with the four businesses, because those are
       what a client arrives for. (The old floating pill hid them in a
       "Products" dropdown, one hover away.)
   A solid paper bar with a hairline, not a floating shadowed pill. The utility
   row folds away once the page scrolls, leaving a 64px bar.                  */

const businesses = [
  { key: "fet", href: "/products/fuel-eco-tech" },
  { key: "seal", href: "/products/seal-wound-spray" },
  { key: "coffee", href: "/products/coffee" },
  { key: "logistics", href: "/products/logistics" },
] as const;

const utilityLinks = [
  { key: "careers", href: "/careers" },
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
] as const;

function CartButton({ onNavigate }: { onNavigate?: () => void }) {
  const { count, ready } = useCart();
  const t = useTranslations("header");
  return (
    <Link
      href="/shop/cart"
      onClick={onNavigate}
      aria-label={`${t("cartAria")}${ready && count ? `, ${count}` : ""}`}
      className="relative inline-flex items-center gap-1.5 text-ink-muted hover:text-ink transition-colors"
    >
      <ShoppingBag aria-hidden="true" className="h-4 w-4" />
      {ready && count > 0 && <span className="font-numeric text-ink">{count > 9 ? "9+" : count}</span>}
    </Link>
  );
}

function Wordmark({ small = false, onNavigate }: { small?: boolean; onNavigate?: () => void }) {
  return (
    <Link href="/" onClick={onNavigate} className="flex items-center gap-3 shrink-0" aria-label="Vitorra Holdings Limited — home">
      <Image src="/logo.png" alt="" width={small ? 30 : 34} height={small ? 30 : 34} className="mix-blend-multiply" priority />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.375rem] tracking-[-0.01em] text-ink">Vitorra</span>
        <span className="t-label text-[0.625rem] tracking-[0.22em] text-ink-muted mt-1">Holdings Limited</span>
      </span>
    </Link>
  );
}

export default function Header() {
  const t = useTranslations();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Lock page scroll while the menu is open; Escape closes it. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const close = () => setOpen(false);

  return (
    <>
      <header
        className="q-scope fixed inset-x-0 top-0 z-[60] bg-paper border-b border-line"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        {/* ── Utility row (desktop) ──────────────────────────────────────── */}
        <div
          className={cn(
            "hidden lg:block overflow-hidden border-b border-line transition-[height,opacity] duration-300 ease-quiet",
            scrolled ? "h-0 opacity-0 border-transparent" : "h-9 opacity-100",
          )}
        >
          <div className="q-container flex h-9 items-center justify-end gap-7 t-label text-ink-muted">
            {utilityLinks.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={cn("transition-colors hover:text-ink", isActive(l.href) && "text-ink")}
              >
                {t(`nav.${l.key}`)}
              </Link>
            ))}
            <span aria-hidden="true" className="h-3 w-px bg-line-strong" />
            <LanguageSwitcher />
            {COFFEE_SHOP_ENABLED && <CartButton />}
            <Link
              href="/account/dashboard"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-ink"
            >
              <User aria-hidden="true" className="h-3.5 w-3.5" />
              {t("common.myAccount")}
            </Link>
          </div>
        </div>

        {/* ── Main row ───────────────────────────────────────────────────── */}
        <div className="q-container flex h-16 items-center justify-between gap-6">
          <Wordmark onNavigate={close} />

          <nav aria-label={t("header.navigation")} className="hidden lg:block">
            <ul className="flex items-center gap-8">
              {businesses.map((b) => (
                <li key={b.key}>
                  <Link
                    href={b.href}
                    aria-current={isActive(b.href) ? "page" : undefined}
                    className={cn(
                      "relative py-5 text-[0.9375rem] transition-colors",
                      isActive(b.href) ? "text-ink" : "text-ink-soft hover:text-ink",
                      "after:absolute after:inset-x-0 after:bottom-[-1px] after:h-px after:bg-gold after:transition-transform after:duration-300 after:ease-quiet after:origin-left",
                      isActive(b.href) ? "after:scale-x-100" : "after:scale-x-0 hover:after:scale-x-100",
                    )}
                  >
                    {t(`products.${b.key}.name`)}
                  </Link>
                </li>
              ))}
              <li aria-hidden="true" className="h-4 w-px bg-line-strong" />
              <li>
                <Link
                  href="/about"
                  aria-current={isActive("/about") ? "page" : undefined}
                  className={cn("text-[0.9375rem] transition-colors", isActive("/about") ? "text-ink" : "text-ink-soft hover:text-ink")}
                >
                  {t("nav.about")}
                </Link>
              </li>
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/enquire" className="q-btn hidden lg:inline-flex min-h-10 px-5 bg-ink text-paper hover:bg-black">
              {t("common.requestQuote")}
            </Link>
            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
            <button
              type="button"
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center text-ink"
              onClick={() => setOpen(true)}
              aria-label={t("header.toggleMenu")}
              aria-expanded={open}
              aria-controls="site-menu"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu — a full sheet, businesses first ──────────────────── */}
      <div
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label={t("header.navigation")}
        aria-hidden={!open}
        className={cn(
          "q-scope fixed inset-0 z-[70] flex flex-col bg-paper lg:hidden transition-[opacity,visibility] duration-300 ease-quiet",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="q-container flex h-16 shrink-0 items-center justify-between border-b border-line">
          <Wordmark small onNavigate={close} />
          <button
            type="button"
            onClick={close}
            aria-label={t("header.toggleMenu")}
            className="inline-flex h-10 w-10 items-center justify-center text-ink"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav className="q-container flex-1 overflow-y-auto py-6">
          <ol className="divide-y divide-line border-b border-line">
            {businesses.map((b, i) => (
              <li key={b.key}>
                <Link
                  href={b.href}
                  onClick={close}
                  aria-current={isActive(b.href) ? "page" : undefined}
                  className="group flex items-start gap-4 py-5"
                >
                  <span className="t-label font-numeric text-gold-ink pt-2">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    <span className="t-h3 block text-ink">{t(`products.${b.key}.name`)}</span>
                    <span className="t-small block text-ink-muted mt-1">{t(`products.${b.key}.tagline`)}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="h-4 w-4 mt-2 text-ink-muted transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ol>

          <ul className="mt-6 space-y-4 t-body">
            {[{ key: "about", href: "/about" }, ...utilityLinks].map((l) => (
              <li key={l.key}>
                <Link href={l.href} onClick={close} className="text-ink-soft hover:text-ink">
                  {t(`nav.${l.key}`)}
                </Link>
              </li>
            ))}
            {COFFEE_SHOP_ENABLED && (
              <li>
                <Link href="/shop" onClick={close} className="text-ink-soft hover:text-ink">
                  {t("nav.coffeeShop")}
                </Link>
              </li>
            )}
            <li>
              <Link href="/account/dashboard" onClick={close} className="inline-flex items-center gap-2 text-ink-soft hover:text-ink">
                <User aria-hidden="true" className="h-4 w-4" />
                {t("common.myAccount")}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="q-container shrink-0 pt-4">
          <Link href="/enquire" onClick={close} className="q-btn w-full bg-ink text-paper hover:bg-black">
            {t("common.requestQuote")}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
