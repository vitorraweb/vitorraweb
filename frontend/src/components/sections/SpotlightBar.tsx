import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/system";
import type { Spotlight } from "@/lib/api";

/* ─── Spotlight ───────────────────────────────────────────────────────────────
   One current, dated message straight under a hero — set by Marketing in the
   console (Marketing → Spotlight) with start and end dates, so the homepage
   and the FET page always carry something new. Nothing renders when no
   spotlight is live, so the page never shows an empty band.               */

export function SpotlightBar({ spotlight }: { spotlight: Spotlight | null }) {
  if (!spotlight) return null;
  const { eyebrow, title, body, cta_label, cta_url } = spotlight;
  const external = cta_url?.startsWith("https://");

  const cta = cta_url && cta_label && (external ? (
    <a href={cta_url} target="_blank" rel="noopener noreferrer" className="q-link t-small text-ink whitespace-nowrap">{cta_label}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></a>
  ) : (
    <Link href={cta_url} className="q-link t-small text-ink whitespace-nowrap">{cta_label}<ArrowRight aria-hidden="true" className="h-3.5 w-3.5" /></Link>
  ));

  return (
    <aside aria-label={eyebrow ?? title} className="q-scope bg-cream text-ink border-b border-line">
      <Container className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8 py-5">
        {eyebrow && (
          <p className="t-label text-gold-ink flex items-center gap-3 shrink-0">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
            {eyebrow}
          </p>
        )}
        <p className="t-small text-ink flex-1">
          <span className="font-medium">{title}</span>
          {body && <span className="text-ink-soft"> {body}</span>}
        </p>
        {cta}
      </Container>
    </aside>
  );
}
