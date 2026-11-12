import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Advertise on the Vitorra street screen",
  description: "Build your campaign on the Vitorra street screen on Lumumba Avenue, Kampala.",
  robots: { index: false, follow: false },
};

export default function AdvertiseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="q-scope min-h-screen flex flex-col bg-paper text-ink">
      <header className="sticky top-0 z-20 bg-paper border-b border-line">
        <div className="q-container h-16 flex items-center justify-between gap-4">
          <span className="flex items-center gap-3">
            <Image src="/logo.png" alt="" width={32} height={32} className="mix-blend-multiply" />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[1.375rem] tracking-[-0.01em] text-ink">Vitorra</span>
              <span className="t-label text-[0.625rem] tracking-[0.22em] text-ink-muted mt-1">Street screen</span>
            </span>
          </span>
          <a href="https://vitorra.org" className="q-link t-small text-ink">vitorra.org</a>
        </div>
      </header>
      <main id="main" className="flex-1 w-full q-container py-12 md:py-16">{children}</main>
      <footer className="border-t border-line bg-paper-deep">
        <p className="q-container py-6 t-small text-ink-muted">© {new Date().getFullYear()} Vitorra Holdings Limited.</p>
      </footer>
    </div>
  );
}
