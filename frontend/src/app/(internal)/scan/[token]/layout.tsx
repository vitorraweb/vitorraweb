import type { Metadata } from "next";

/* Finance's phone receipt scanner: a private, token-gated page. */
export const metadata: Metadata = {
  title: "Scan receipts · Vitorra",
  robots: { index: false, follow: false },
};

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
