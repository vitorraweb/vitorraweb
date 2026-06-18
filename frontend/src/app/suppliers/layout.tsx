import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Supplier — Vitorra Holdings",
  description: "Register as a supplier to Vitorra Holdings. Submit your company details and documents for review.",
};

export default function SuppliersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F2F2F2" }}>
      <header className="sticky top-0 z-20 bg-white/85 border-b" style={{ backdropFilter: "blur(8px)", borderColor: "rgba(0,0,0,0.07)" }}>
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/suppliers" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Vitorra" width={32} height={32} />
            <span style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "18px", fontWeight: 600, color: "#1E1E1E" }}>
              Vitorra<span style={{ color: "#C5B27A" }}> Suppliers</span>
            </span>
          </Link>
          <a href="https://vitorra.org" className="text-sm font-semibold" style={{ color: "#7A6020" }}>vitorra.org →</a>
        </div>
      </header>
      <main className="flex-1 max-w-3xl w-full mx-auto px-5 py-10 md:py-14">{children}</main>
      <footer className="border-t py-6" style={{ borderColor: "rgba(0,0,0,0.07)" }}>
        <p className="max-w-3xl mx-auto px-5 text-xs" style={{ color: "#999" }}>
          © {new Date().getFullYear()} Vitorra Holdings Limited. Your details and bank information are stored securely and used only for supplier review.
        </p>
      </footer>
    </div>
  );
}
