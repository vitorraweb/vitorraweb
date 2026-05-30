import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

const cols = [
  {
    heading: "Products",
    links: [
      { label: "Fuel Eco Tech", href: "/products/fuel-eco-tech" },
      { label: "SEAL Wound Spray", href: "/products/seal-wound-spray" },
      { label: "Vitorra Coffee", href: "/products/coffee" },
      { label: "Logistics Services", href: "/products/logistics" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Blog & Insights", href: "/blog" },
      { label: "Certifications", href: "/trust/certifications" },
      { label: "Coffee Shop", href: "/shop" },
    ],
  },
  {
    heading: "Get in Touch",
    links: [
      { label: "Request a Quote", href: "/enquire" },
      { label: "Contact Us", href: "/contact" },
      { label: "WhatsApp", href: "#" },
      { label: "Email Us", href: `mailto:${CONTACT_EMAIL}` },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal/privacy-policy" },
      { label: "Terms & Conditions", href: "/legal/terms-and-conditions" },
      { label: "Returns & Warranty", href: "/legal/returns-and-warranty" },
      { label: "Cookie Policy", href: "/legal/cookie-policy" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-canvas-dark text-white/60">

      {/* ── Conversational headline (Mastercard footer pattern) ─────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 pt-20 pb-12 border-b border-white/[0.08]">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
              <Image
                src="/logo.png"
                alt="Vitorra Holdings Limited"
                width={40}
                height={40}
                className="mix-blend-screen"
              />
              <span
                className="text-white text-lg"
                style={{ fontFamily: "var(--font-playfair, Georgia, serif)", letterSpacing: "-0.01em" }}
              >
                Vitorra<span className="text-gold"> Holdings</span>
              </span>
            </Link>
            <h2
              className="text-white max-w-md leading-tight"
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              We&apos;re always here when you need us.
            </h2>
          </div>
          <Link
            href="/enquire"
            className="btn-primary inline-flex items-center gap-2 self-start lg:self-auto shrink-0"
          >
            Request a Quote
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── 4-column link grid ──────────────────────────────────────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 py-14 grid grid-cols-2 lg:grid-cols-4 gap-10">
        {cols.map((col) => (
          <div key={col.heading}>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 mb-5">
              {col.heading}
            </h3>
            <ul className="space-y-3">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.08]">
        <div className="container-max mx-auto px-6 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>&copy; {year} {SITE_NAME}. All rights reserved.</p>
          <p>Uganda &middot; East Africa &middot; International</p>
        </div>
      </div>
    </footer>
  );
}
