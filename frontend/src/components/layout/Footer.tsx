import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, MapPin, Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_ADDRESS, COMPANY_REG_NO, SITE_NAME } from "@/lib/constants";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";

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
      // Coffee Shop hidden until retail prices are confirmed (see lib/config).
      ...(COFFEE_SHOP_ENABLED ? [{ label: "Coffee Shop", href: "/shop" }] : []),
      { label: "Blog & Insights", href: "/blog" },
      { label: "Certifications", href: "/trust/certifications" },
      { label: "My Account", href: "/account/dashboard" },
      { label: "Contact Us", href: "/contact" },
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

const telHref = `tel:${CONTACT_PHONE.replace(/\s+/g, "")}`;

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-canvas-dark text-white/60">

      {/* ── Logo + CTA ──────────────────────────────────────────────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 pt-16 pb-12 border-b border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
          <Link href="/" aria-label="Vitorra Holdings Limited — home" className="inline-block">
            <Image
              src="/logo.png"
              alt="Vitorra Holdings Limited"
              width={132}
              height={132}
              className="h-24 md:h-28 w-auto"
            />
          </Link>
          <Link
            href="/enquire"
            className="btn-primary inline-flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            Request a Quote
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Brand + contact · link columns ──────────────────────────────── */}
      <div className="container-max mx-auto px-6 lg:px-20 py-14 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-12 lg:gap-10">

        {/* Contact */}
        <div className="max-w-xs">
          <p className="text-sm leading-relaxed text-white/45 mb-7">
            A diversified company across fuel technology, healthcare, premium
            coffee, and logistics.
          </p>

          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C5B27A" }} />
              <span className="text-sm leading-relaxed text-white/55">
                {CONTACT_ADDRESS.map((line, i) => (
                  <span key={i} className="block">{line}</span>
                ))}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-sm text-white/55 hover:text-white transition-colors">
                {CONTACT_EMAIL}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <Phone className="w-4 h-4 shrink-0" style={{ color: "#C5B27A" }} />
              <a href={telHref} className="text-sm text-white/55 hover:text-white transition-colors">
                {CONTACT_PHONE}
              </a>
            </li>
          </ul>
        </div>

        {/* Link columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-10 lg:col-span-3">
          {cols.map((col) => (
            <div key={col.heading}>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-white/30 mb-5">
                {col.heading}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-white/55 hover:text-white transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ──────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.08]">
        <div className="container-max mx-auto px-6 lg:px-20 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/30">
          <p>&copy; {year} {SITE_NAME}. All rights reserved.</p>
          <p>Reg. No. {COMPANY_REG_NO} &middot; Kampala, Uganda</p>
        </div>
      </div>
    </footer>
  );
}
