import Image from "next/image";
import { Sparkle } from "lucide-react";
import { Container, Label, TextLink } from "@/components/system";
import { CircleLink } from "@/components/system/CircleLink";
import { Parallax } from "@/components/motion/Parallax";

/* ─── Statement hero ──────────────────────────────────────────────────────────
   The homepage opening, set like a poster: two short lines at the width of
   the page, the first with one circle call to action beside it, the second
   pushed right with the lead in the space it leaves, its foot running onto
   a wide photograph that fades up into the paper.

   The real headline is one h1 for screen readers and search; the poster
   lines are its picture (aria-hidden). Lines rise from behind a mask on
   load and the photograph drifts against the scroll; all of it is off
   under reduced motion and reads correctly without JavaScript.            */

export function StatementHero({
  label,
  lines,
  lead,
  cta,
  secondary,
  image,
  alt,
  credit,
  scrollCue,
}: {
  label: string;
  lines: [string, string];
  lead: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  image: string;
  alt: string;
  credit?: string;
  scrollCue?: string;
}) {
  const d = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

  return (
    <section aria-labelledby="hero-title" className="q-scope relative isolate overflow-hidden bg-paper text-ink">
      <Container className="relative z-10 pt-32 lg:pt-40">
        <div className="flex items-center justify-between gap-6 q-rise" style={d(80)}>
          <div className="flex items-center gap-5">
            <Label>{label}</Label>
            <span aria-hidden="true" className="hidden sm:block h-px w-24 bg-line-strong" />
          </div>
          <Sparkle aria-hidden="true" className="h-6 w-6 text-gold-ink" strokeWidth={1.25} />
        </div>

        <h1 id="hero-title" className="sr-only">{lines.join(" ")}</h1>

        {/* Row one: the first line, and on large screens the circle beside it. */}
        <div className="mt-8 lg:mt-10 flex items-center justify-between gap-8">
          <span aria-hidden="true" className="t-statement block overflow-hidden pb-[0.06em] lg:whitespace-nowrap">
            <span className="block q-mask-rise" style={d(200)}>{lines[0]}</span>
          </span>
          <div className="hidden lg:block shrink-0 q-rise" style={d(700)}>
            <CircleLink href={cta.href}>{cta.label}</CircleLink>
          </div>
        </div>

        {/* Row two: the lead in the space the offset second line leaves. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-8">
          <span aria-hidden="true" className="t-statement lg:col-span-8 lg:col-start-5 xl:col-span-9 xl:col-start-4 lg:row-start-1 lg:text-right lg:whitespace-nowrap block overflow-hidden pb-[0.06em]">
            <span className="block q-mask-rise" style={d(340)}>{lines[1]}</span>
          </span>
          <div className="lg:col-span-4 xl:col-span-3 lg:col-start-1 lg:row-start-1 lg:self-start lg:pt-4 q-rise" style={d(600)}>
            <p className="t-body text-ink-soft">{lead}</p>
            {secondary && <div className="mt-5"><TextLink href={secondary.href}>{secondary.label}</TextLink></div>}
            <div className="mt-8 lg:hidden">
              <CircleLink href={cta.href}>{cta.label}</CircleLink>
            </div>
          </div>
        </div>
      </Container>

      {/* The photograph: full width, its top fading up into the paper so the
          foot of the second line can sit on it and stay legible. */}
      <div className="relative mt-10 lg:-mt-[clamp(2rem,4vw,4.5rem)] h-[44svh] min-h-[18rem] lg:h-[62svh] overflow-hidden q-rise" style={d(450)}>
        <Parallax distance={50} className="absolute -inset-y-[12%] inset-x-0">
          <Image src={image} alt={alt} fill priority sizes="100vw" className="object-cover object-[center_72%] q-grade" />
        </Parallax>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-paper to-transparent" />

        {scrollCue && (
          <span aria-hidden="true" className="hidden md:flex absolute left-[clamp(1.25rem,0.6rem+2.8vw,3rem)] bottom-8 flex-col items-center gap-3">
            <span className="relative flex h-16 w-9 justify-center rounded-full border border-white/70 pt-3">
              <span className="q-pill-dot block h-1.5 w-1.5 rounded-full bg-white" />
            </span>
            <span className="t-label text-[0.625rem] text-white/85">{scrollCue}</span>
          </span>
        )}
        {credit && (
          <p className="t-label text-white/85 absolute right-[clamp(1.25rem,0.6rem+2.8vw,3rem)] bottom-8">{credit}</p>
        )}
      </div>
    </section>
  );
}
