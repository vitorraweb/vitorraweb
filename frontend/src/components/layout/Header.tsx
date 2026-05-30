"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";
import { NAV_LINKS } from "@/lib/constants";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-charcoal/95 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 relative">
            {/* Logo placeholder — replace src once John drops the file */}
            <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-charcoal font-serif font-bold text-sm">
              V
            </div>
          </div>
          <span className="font-serif text-white text-lg leading-tight hidden sm:block">
            Vitorra<span className="text-gold"> Holdings</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) =>
            "children" in link ? (
              <div key={link.label} className="relative group">
                <button
                  className="flex items-center gap-1 text-sm text-white/80 hover:text-gold transition-colors"
                  onMouseEnter={() => setProductsOpen(true)}
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  {link.label}
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <div
                  className={cn(
                    "absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200",
                    productsOpen
                      ? "opacity-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 -translate-y-1 pointer-events-none"
                  )}
                  onMouseEnter={() => setProductsOpen(true)}
                  onMouseLeave={() => setProductsOpen(false)}
                >
                  <div className="bg-charcoal border border-white/10 rounded-lg shadow-xl p-2 w-52">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-4 py-2.5 text-sm text-white/80 hover:text-gold hover:bg-white/5 rounded-md transition-colors"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-white/80 hover:text-gold transition-colors"
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <LinkButton
            href="/enquire"
            size="sm"
            className="bg-gold text-charcoal hover:bg-gold-light font-medium"
          >
            Request a Quote
          </LinkButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-white p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-charcoal border-t border-white/10 px-6 pb-6 pt-4">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) =>
              "children" in link ? (
                <div key={link.label}>
                  <p className="text-xs uppercase tracking-widest text-white/40 mt-4 mb-2 px-3">
                    {link.label}
                  </p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2.5 text-sm text-white/80 hover:text-gold transition-colors rounded-md"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-sm text-white/80 hover:text-gold transition-colors rounded-md"
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-4 border-t border-white/10 mt-4">
              <LinkButton
                href="/enquire"
                onClick={() => setMobileOpen(false)}
                className="w-full bg-gold text-charcoal hover:bg-gold-light font-medium"
              >
                Request a Quote
              </LinkButton>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
