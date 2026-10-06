import { useTranslations } from "next-intl";

/* Legal documents — Quiet Authority. A calm reading column: the display serif
   for headings, hairline section breaks, a comfortable measure. Usage:
   <LegalPage title="..." updated="2026-06-01">…sections…</LegalPage>        */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  const t = useTranslations("legal");
  return (
    <article className="max-w-[44rem]">
      <header className="mb-14 pb-10 border-b border-line">
        <p className="t-label text-ink-muted mb-6">{t("eyebrow")}</p>
        <h1 className="t-h1 text-ink">{title}</h1>
        <p className="t-small text-ink-muted mt-5">{t("lastUpdated")} <span className="font-numeric">{updated}</span></p>
      </header>
      <div>{children}</div>
    </article>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pb-10 mb-10 border-b border-line last:border-b-0">
      <h2 className="t-h3 text-ink mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="t-body text-ink-soft mb-4 last:mb-0">{children}</p>;
}

export function Ul({ items }: { items: string[] }) {
  return (
    <ul className="t-body text-ink-soft mb-4 space-y-2 pl-5 list-disc marker:text-gold-ink">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}
