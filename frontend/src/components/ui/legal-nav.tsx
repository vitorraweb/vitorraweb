"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* The legal side menu; marks the document being read. */
export function LegalNav({ heading, links }: { heading: string; links: { label: string; href: string }[] }) {
  const pathname = usePathname();
  return (
    <nav className="lg:sticky lg:top-28" aria-label={heading}>
      <p className="t-label text-ink-muted mb-5">{heading}</p>
      <ul className="border-t border-line">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <li key={l.href} className="border-b border-line">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn("flex items-center gap-3 py-3.5 t-small transition-colors", active ? "text-ink" : "text-ink-muted hover:text-ink")}
              >
                <span aria-hidden="true" className={cn("h-px w-3 transition-colors", active ? "bg-gold" : "bg-transparent")} />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
