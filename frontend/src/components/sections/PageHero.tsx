import { Sparkle } from "lucide-react";
import { Container, Label, TextLink } from "@/components/system";
import { CircleLink } from "@/components/system/CircleLink";

/* ─── Page hero ───────────────────────────────────────────────────────────────
   The homepage's opening, scaled for a working page (contact, blog, careers):
   the label with its hairline and the gold sparkle, a large headline rising
   from behind a mask, then the lead with one circle action beside it. No
   photograph; pages that have one show it in their next section.          */

export function PageHero({
  id = "page-title",
  label,
  title,
  lead,
  cta,
  secondary,
}: {
  id?: string;
  label: string;
  title: string;
  lead?: string;
  cta?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

  return (
    <section aria-labelledby={id} className="q-scope relative bg-paper text-ink">
      <Container className="pt-32 lg:pt-44 pb-16 lg:pb-24">
        <div className="flex items-center justify-between gap-6 q-rise" style={d(80)}>
          <div className="flex items-center gap-5">
            <Label>{label}</Label>
            <span aria-hidden="true" className="hidden sm:block h-px w-24 bg-line-strong" />
          </div>
          <Sparkle aria-hidden="true" className="h-6 w-6 text-gold-ink" strokeWidth={1.25} />
        </div>

        <h1 id={id} className="mt-8 lg:mt-10 overflow-hidden pb-[0.06em] font-display font-[330] text-[clamp(2.75rem,0.9rem+6.6vw,7.5rem)] leading-[0.95] tracking-[-0.03em] text-ink max-w-[16ch] [text-wrap:balance]">
          <span className="block q-mask-rise" style={d(200)}>{title}</span>
        </h1>

        {(lead || cta || secondary) && (
          <div className="mt-10 lg:mt-14 grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-t border-line-strong pt-8 lg:pt-10">
            <div className="lg:col-span-6 q-rise" style={d(500)}>
              {lead && <p className="t-lead text-ink-soft max-w-[36rem]">{lead}</p>}
              {secondary && <div className="mt-6"><TextLink href={secondary.href}>{secondary.label}</TextLink></div>}
            </div>
            {cta && (
              <div className="lg:col-span-6 lg:justify-self-end q-rise" style={d(700)}>
                <CircleLink href={cta.href}>{cta.label}</CircleLink>
              </div>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
