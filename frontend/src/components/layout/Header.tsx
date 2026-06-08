"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Menu, X, ChevronDown, ArrowRight, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/lib/cart";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";

/* ── Cart button with live count badge (Mastercard pill style) ──────────── */
function CartButton({ onNavigate }: { onNavigate?: () => void }) {
  const { count, ready } = useCart();
  const t = useTranslations("header");
  return (
    <Link
      href="/shop/cart"
      onClick={onNavigate}
      aria-label={`${t("cartAria")}${ready && count ? `, ${count}` : ""}`}
      className="relative flex items-center justify-center w-9 h-9 rounded-full bg-charcoal/5 hover:bg-charcoal/10 transition-colors text-charcoal"
    >
      <ShoppingBag className="w-[18px] h-[18px]" />
      {ready && count > 0 && (
        <span
          className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: "#C5B27A" }}
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

/* Product display names are brand terms and stay constant across locales; only
   the descriptions are translated (see messages products.<key>.tagline).      */
const products = [
  { key: "fet", href: "/products/fuel-eco-tech" },
  { key: "seal", href: "/products/seal-wound-spray" },
  { key: "coffee", href: "/products/coffee" },
  { key: "logistics", href: "/products/logistics" },
] as const;

type NavLink = { key: string; href: string; hasDropdown?: boolean };
const navLinks: NavLink[] = [
  { key: "about", href: "/about" },
  { key: "products", href: "#", hasDropdown: true },
  // Coffee Shop hidden until retail prices are confirmed (see lib/config).
  ...(COFFEE_SHOP_ENABLED ? [{ key: "coffeeShop", href: "/shop" }] : []),
  { key: "blog", href: "/blog" },
  { key: "contact", href: "/contact" },
];

export default function Header() {
  const t = useTranslations();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ── Floating Pill Navigation (Mastercard signature) ───────────── */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 flex justify-center px-4 md:px-6 transition-all duration-300",
          mobileOpen && "inset-x-0 bg-transparent"
        )}
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        {/* The pill itself */}
        <nav
          className={cn(
            "w-full max-w-6xl bg-white rounded-[999px] transition-shadow duration-300",
            scrolled ? "shadow-[rgba(0,0,0,0.10)_0px_8px_32px_0px]" : "shadow-pill-nav"
          )}
        >
          <div className="flex items-center justify-between px-5 md:px-8 h-14">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image
                src="/logo.png"
                alt="Vitorra Holdings Limited"
                width={38}
                height={38}
                className="mix-blend-multiply"
                priority
              />
              <span
                className="font-serif text-charcoal text-base leading-tight hidden sm:block"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)", letterSpacing: "-0.01em" }}
              >
                Vitorra<span className="text-[#A89255]"> Holdings</span>
              </span>
            </Link>

            {/* Desktop links — center */}
            <div className="hidden lg:flex items-center gap-7">
              {navLinks.map((link) =>
                link.hasDropdown ? (
                  <div
                    key={link.key}
                    className="relative"
                    onMouseEnter={() => setProductsOpen(true)}
                    onMouseLeave={() => setProductsOpen(false)}
                  >
                    <button className="flex items-center gap-1 text-sm font-medium text-charcoal/80 hover:text-charcoal transition-colors">
                      {t(`nav.${link.key}`)}
                      <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", productsOpen && "rotate-180")} />
                    </button>

                    {/* Dropdown */}
                    <div
                      className={cn(
                        "absolute top-full left-1/2 -translate-x-1/2 pt-3 transition-all duration-200",
                        productsOpen
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 -translate-y-2 pointer-events-none"
                      )}
                    >
                      <div className="bg-white rounded-[24px] shadow-[rgba(0,0,0,0.12)_0px_16px_40px] p-3 w-64 border border-black/5">
                        {products.map((p) => (
                          <Link
                            key={p.href}
                            href={p.href}
                            className="group flex items-start gap-3 px-4 py-3 rounded-[16px] hover:bg-[#F2F2F2] transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-charcoal group-hover:text-[#A89255] transition-colors">
                                {t(`products.${p.key}.name`)}
                              </p>
                              <p className="text-xs text-charcoal/50 mt-0.5 leading-relaxed">
                                {t(`products.${p.key}.tagline`)}
                              </p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-charcoal/30 group-hover:text-gold mt-0.5 shrink-0 transition-all group-hover:translate-x-0.5" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.key}
                    href={link.href}
                    className="text-sm font-medium text-charcoal/80 hover:text-charcoal transition-colors"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                )
              )}
            </div>

            {/* CTA + mobile toggle — right */}
            <div className="flex items-center gap-3">
              {COFFEE_SHOP_ENABLED && <CartButton />}
              <Link
                href="/account/dashboard"
                aria-label={t("header.accountAria")}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-charcoal/5 hover:bg-charcoal/10 transition-colors text-charcoal"
              >
                <User className="w-[18px] h-[18px]" />
              </Link>
              <Link
                href="/enquire"
                className="hidden lg:inline-flex btn-primary text-sm"
                style={{ padding: "8px 22px", fontSize: "14px", borderRadius: "20px" }}
              >
                {t("common.requestQuote")}
              </Link>
              <button
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-full bg-charcoal/5 hover:bg-charcoal/10 transition-colors text-charcoal"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={t("header.toggleMenu")}
              >
                {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile menu ──────────────────────────────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 pt-24 px-4 bg-[#F2F2F2]">
          <div className="bg-white rounded-[32px] shadow-card p-6">
            <nav className="flex flex-col gap-1">
              <p className="eyebrow mb-3 px-3">{t("header.navigation")}</p>
              {navLinks.map((link) =>
                link.hasDropdown ? (
                  <div key={link.key}>
                    <p className="px-3 py-1 text-xs font-bold uppercase tracking-widest text-charcoal/40 mt-4 mb-1">
                      {t("header.productsHeading")}
                    </p>
                    {products.map((p) => (
                      <Link
                        key={p.href}
                        href={p.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-[16px] hover:bg-[#F2F2F2] transition-colors"
                      >
                        <div>
                          <p className="text-sm font-semibold text-charcoal">{t(`products.${p.key}.name`)}</p>
                          <p className="text-xs text-charcoal/50">{t(`products.${p.key}.tagline`)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Link
                    key={link.key}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-3 text-sm font-medium text-charcoal rounded-[16px] hover:bg-[#F2F2F2] transition-colors"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                )
              )}
              <div className="pt-4 mt-2 border-t border-black/5 space-y-2">
                <Link
                  href="/account/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-charcoal rounded-[16px] hover:bg-[#F2F2F2] transition-colors"
                >
                  <User className="w-4 h-4" />{t("common.myAccount")}
                </Link>
                <Link
                  href="/enquire"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary w-full justify-center"
                >
                  {t("common.requestQuote")}
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
