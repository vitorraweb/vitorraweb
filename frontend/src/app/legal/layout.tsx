import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Link from "next/link";

const legalLinks = [
  { label: "Privacy Policy",       href: "/legal/privacy-policy" },
  { label: "Terms & Conditions",   href: "/legal/terms-and-conditions" },
  { label: "Returns & Warranty",   href: "/legal/returns-and-warranty" },
  { label: "Cookie Policy",        href: "/legal/cookie-policy" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1" style={{ backgroundColor: "#F2F2F2" }}>
        <div className="px-6 md:px-12 lg:px-20 pb-20 md:pb-28" style={{ paddingTop: "clamp(128px, 12vh, 168px)" }}>
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-10 lg:gap-16 items-start">

            {/* Sidebar nav */}
            <nav className="lg:sticky lg:top-28" aria-label="Legal pages">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-4" style={{ color: "#999999" }}>Legal</p>
              <ul className="space-y-1">
                {legalLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="block px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white"
                      style={{ color: "#555555" }}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Page content */}
            <div>{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
