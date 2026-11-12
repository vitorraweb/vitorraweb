import type { Metadata, Viewport } from "next";

/* The screens install as full-screen apps (no tabs, no address bar): open the
   page once in Chrome or Edge on the screen's computer and choose "Install". */
export const metadata: Metadata = {
  title: "Vitorra · Screen",
  robots: { index: false, follow: false },
  manifest: "/display.webmanifest",
  appleWebApp: { capable: true, title: "Vitorra Screen", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#09090A" };

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
