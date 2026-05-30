import Link from "next/link";
import Image from "next/image";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/constants";

const products = [
  { label: "Fuel Eco Tech", href: "/products/fuel-eco-tech" },
  { label: "SEAL Wound Spray", href: "/products/seal-wound-spray" },
  { label: "Vitorra Coffee", href: "/products/coffee" },
  { label: "Logistics Services", href: "/products/logistics" },
];

const company = [
  { label: "About Us", href: "/about" },
  { label: "Blog & Insights", href: "/blog" },
  { label: "Certifications", href: "/trust/certifications" },
  { label: "Contact Us", href: "/contact" },
];

const legal = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms & Conditions", href: "/legal/terms-and-conditions" },
  { label: "Returns & Warranty", href: "/legal/returns-and-warranty" },
  { label: "Cookie Policy", href: "/legal/cookie-policy" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-charcoal text-white/70">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand column */}
        <div className="lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Image
              src="/logo.png"
              alt="Vitorra Holdings Limited"
              width={40}
              height={40}
              className="mix-blend-screen"
            />
            <span className="font-serif text-white text-lg">
              Vitorra<span className="text-gold"> Holdings</span>
            </span>
          </Link>
          <p className="text-sm leading-relaxed mb-6">
            A diversified distribution and management company delivering innovative
            products and dependable solutions across Uganda and East Africa.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-sm text-gold hover:text-gold-light transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
        </div>

        {/* Products */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-5">
            Products
          </h3>
          <ul className="space-y-3">
            {products.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-5">
            Company
          </h3>
          <ul className="space-y-3">
            {company.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-5">
            Legal
          </h3>
          <ul className="space-y-3">
            {legal.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            &copy; {year} {SITE_NAME}. All rights reserved.
          </p>
          <p>
            Uganda &middot; East Africa &middot; International
          </p>
        </div>
      </div>
    </footer>
  );
}
