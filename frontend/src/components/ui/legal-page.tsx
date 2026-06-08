import { useTranslations } from "next-intl";

/* Shared prose wrapper for legal documents.
   Usage: <LegalPage title="..." updated="2026-06-01">…sections…</LegalPage> */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const t = useTranslations("legal");
  return (
    <article>
      <header className="mb-10 pb-8" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <span className="eyebrow block mb-3">{t("eyebrow")}</span>
        <h1 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(30px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.08, color: "#1E1E1E" }}>
          {title}
        </h1>
        <p className="mt-3 text-sm" style={{ color: "#999999" }}>{t("lastUpdated")} {updated}</p>
      </header>
      <div className="legal-prose">{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: 700, letterSpacing: "-0.015em", color: "#1E1E1E", marginBottom: "12px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4" style={{ fontSize: "15px", lineHeight: 1.8, color: "#555555" }}>{children}</p>;
}

export function Ul({ items }: { items: string[] }) {
  return (
    <ul className="mb-4 space-y-1.5 pl-5" style={{ fontSize: "15px", lineHeight: 1.8, color: "#555555", listStyleType: "disc" }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
