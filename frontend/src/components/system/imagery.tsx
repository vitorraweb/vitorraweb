import Image from "next/image";
import { Container, Label, ButtonLink, TextLink } from "@/components/system";
import { cn } from "@/lib/utils";

/* ─── Quiet Authority — imagery ───────────────────────────────────────────────
   How the site uses photographs, after looking at how luxury houses do:
   large, full-bleed, few, and moving slowly. Three layouts only —
     • CinematicHero — a full-screen opening; the photo settles from a slow
       zoom, the headline rises in line by line;
     • ImageBand — a full-width photograph between sections, with parallax;
     • Mosaic — two photographs, asymmetric, unveiling as they scroll in.
   Stock photographs carry `.q-grade` so images from different photographers
   read as one set. All motion is CSS (globals.css) and additive: with
   JavaScript off or reduced motion on, every image and word is simply there. */

export function CinematicHero({
  image,
  alt,
  label,
  index,
  lines,
  lead,
  primary,
  secondary,
  credit,
  grade = true,
  priority = true,
}: {
  image: string;
  alt: string;
  label: string;
  /** "01" — shows the business number, as on the homepage doors. */
  index?: string;
  /** The headline, one entry per line — each line rises in on its own. */
  lines: string[];
  lead?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Short location/subject note shown bottom-right, e.g. "Kampala at dusk". */
  credit?: string;
  grade?: boolean;
  priority?: boolean;
}) {
  return (
    <section aria-labelledby="hero-title" className="q-scope relative isolate overflow-hidden bg-ink text-ink-fg min-h-[82svh] lg:min-h-[92svh] flex">
      <div className="absolute inset-0 -z-10">
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          sizes="100vw"
          className={cn("object-cover q-settle", grade && "q-grade")}
        />
        {/* Legibility: a deep wash from the bottom-left, where the type sits. */}
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.88)_0%,rgba(20,20,20,0.42)_40%,rgba(20,20,20,0.08)_68%,rgba(20,20,20,0.5)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_right,rgba(20,20,20,0.45)_0%,transparent_55%)]" />
      </div>

      <Container className="relative mt-auto pb-14 lg:pb-20 pt-40">
        <div className="max-w-[46rem]">
          <div className="q-rise" style={{ "--d": "100ms" } as React.CSSProperties}>
            <Label onInk index={index} className="mb-8 text-ink-fg">{label}</Label>
          </div>
          <h1 id="hero-title" className="t-display text-ink-fg">
            {lines.map((l, i) => (
              <span key={l} className="block q-rise" style={{ "--d": `${250 + i * 140}ms` } as React.CSSProperties}>
                {l}
              </span>
            ))}
          </h1>
          {lead && (
            <p className="t-lead text-ink-fg/85 mt-8 max-w-[36rem] q-rise" style={{ "--d": `${400 + lines.length * 140}ms` } as React.CSSProperties}>
              {lead}
            </p>
          )}
          {(primary || secondary) && (
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 q-rise" style={{ "--d": `${550 + lines.length * 140}ms` } as React.CSSProperties}>
              {primary && <ButtonLink href={primary.href} onInk>{primary.label}</ButtonLink>}
              {secondary && <TextLink href={secondary.href} onInk>{secondary.label}</TextLink>}
            </div>
          )}
        </div>
        {credit && (
          <p className="t-label text-ink-fg-muted absolute right-[clamp(1.25rem,0.6rem+2.8vw,3rem)] bottom-6 hidden md:block">{credit}</p>
        )}
      </Container>
    </section>
  );
}

/* A strip of checkable facts, sitting directly under a cinematic hero. */
export function FactStrip({ facts }: { facts: { k: string; v: string }[] }) {
  return (
    <div className="q-scope bg-paper border-b border-line">
      <Container>
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-line">
          {facts.map((f) => (
            <div key={f.k} className="bg-paper py-6 lg:py-8 pr-4 lg:px-8 lg:first:pl-0">
              <dt className="t-label text-ink-muted">{f.k}</dt>
              <dd className="font-display text-[1.375rem] leading-tight text-ink mt-2">{f.v}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </div>
  );
}

/* Full-width photograph with slow parallax. Optional statement over it. */
export function ImageBand({
  image,
  alt,
  statement,
  caption,
  height = "tall",
  grade = true,
}: {
  image: string;
  alt: string;
  statement?: string;
  caption?: string;
  height?: "tall" | "medium";
  grade?: boolean;
}) {
  return (
    <figure className="q-scope relative m-0 overflow-hidden bg-ink">
      <div className={cn("relative q-parallax", height === "tall" ? "h-[62svh] lg:h-[78svh]" : "h-[44svh] lg:h-[56svh]")}>
        <Image src={image} alt={alt} fill sizes="100vw" className={cn("object-cover", grade && "q-grade")} />
        {statement && (
          <>
            <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.75),rgba(20,20,20,0.1)_60%)]" />
            <Container className="absolute inset-x-0 bottom-0 pb-12 lg:pb-16">
              <p className="t-h1 text-ink-fg max-w-[40rem]">{statement}</p>
            </Container>
          </>
        )}
      </div>
      {caption && (
        <figcaption className="absolute right-[clamp(1.25rem,0.6rem+2.8vw,3rem)] bottom-5 t-label text-ink-fg/70">{caption}</figcaption>
      )}
    </figure>
  );
}

/* A single photograph that unveils as it scrolls in. */
export function Picture({
  src,
  alt,
  ratio = "4/5",
  caption,
  sizes = "(min-width: 1024px) 45vw, 100vw",
  grade = true,
  zoom = false,
  className,
}: {
  src: string;
  alt: string;
  ratio?: string;
  caption?: string;
  sizes?: string;
  grade?: boolean;
  /** Slow zoom on hover — for photographs inside links. */
  zoom?: boolean;
  className?: string;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <div className={cn("relative overflow-hidden rounded-frame bg-paper-deep q-unveil", zoom && "q-zoom")} style={{ aspectRatio: ratio }}>
        <div className="q-inner absolute inset-0">
          <Image src={src} alt={alt} fill sizes={sizes} className={cn("object-cover", grade && "q-grade")} />
        </div>
      </div>
      {caption && (
        <figcaption className="t-small mt-3 flex gap-3 text-ink-muted">
          <span aria-hidden="true" className="mt-[0.7em] h-px w-4 shrink-0 bg-line-strong" />
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}

/* Two photographs, asymmetric — a tall one and a wide one set lower. */
export function Mosaic({
  a,
  b,
}: {
  a: { src: string; alt: string; caption?: string };
  b: { src: string; alt: string; caption?: string };
}) {
  return (
    <div className="grid grid-cols-12 gap-4 md:gap-8 items-start">
      <Picture className="col-span-7" src={a.src} alt={a.alt} caption={a.caption} ratio="4/5" sizes="(min-width: 1024px) 40vw, 58vw" />
      <Picture className="col-span-5 mt-[22%]" src={b.src} alt={b.alt} caption={b.caption} ratio="3/4" sizes="(min-width: 1024px) 30vw, 42vw" />
    </div>
  );
}
