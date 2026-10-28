import type { Metadata } from "next";

/* Pages that open as a tab inside Microsoft Teams. Private, never indexed, and
   the only routes allowed to be framed by Microsoft hosts (next.config.ts). */
export const metadata: Metadata = {
  title: "Vitorra · Teams",
  robots: { index: false, follow: false },
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
