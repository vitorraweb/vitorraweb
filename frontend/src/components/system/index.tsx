import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/* ─── Quiet Authority — public-site building blocks ───────────────────────────
   Every redesigned page composes these instead of hand-styling each section.
   That is the whole point: the old site had 1,076 inline style blocks and 50
   different hex colours for a seven-colour palette, so no two sections quite
   matched and the result read as assembled rather than designed.

   Tokens and utilities live in globals.css ("QUIET AUTHORITY"). If a page needs
   something these don't provide, add it here — don't reach for style={{}}.   */

/* ── Section ──────────────────────────────────────────────────────────────── */

export type Tone = "paper" | "deep" | "ink";

const TONE: Record<Tone, string> = {
  paper: "bg-paper text-ink",
  deep: "bg-paper-deep text-ink",
  ink: "bg-ink text-ink-fg",
};

export function Section({
  tone = "paper",
  tight = false,
  rule = false,
  id,
  className,
  children,
  "aria-labelledby": labelledBy,
}: {
  tone?: Tone;
  /** Smaller vertical rhythm, for bands that follow a full section. */
  tight?: boolean;
  /** Hairline across the top — separates two sections of the same tone. */
  rule?: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
  "aria-labelledby"?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      data-tone={tone}
      className={cn(
        "q-scope",
        TONE[tone],
        tight ? "q-section-tight" : "q-section",
        rule && (tone === "ink" ? "border-t border-ink-line" : "border-t border-line"),
        id && "scroll-mt-24",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("q-container", className)}>{children}</div>;
}

/* ── Label ────────────────────────────────────────────────────────────────────
   Replaces the "• EYEBROW" pill that sat above every heading on the old site.
   Used sparingly: an index number and a name, like a catalogue entry.       */

export function Label({
  index,
  children,
  onInk = false,
  className,
}: {
  /** "01" — renders in gold ahead of a short rule. */
  index?: string;
  children: React.ReactNode;
  onInk?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("t-label flex items-center gap-3", onInk ? "text-ink-fg-muted" : "text-ink-muted", className)}>
      {index && (
        <>
          <span className={cn("font-numeric", onInk ? "text-gold" : "text-gold-ink")}>{index}</span>
          <span aria-hidden="true" className={cn("h-px w-6", onInk ? "bg-ink-line" : "bg-line-strong")} />
        </>
      )}
      <span>{children}</span>
    </p>
  );
}

/* ── Heading ──────────────────────────────────────────────────────────────── */

type HeadingSize = "display" | "h1" | "h2" | "h3";
const HEADING: Record<HeadingSize, string> = {
  display: "t-display",
  h1: "t-h1",
  h2: "t-h2",
  h3: "t-h3",
};

export function Heading({
  as: Tag = "h2",
  size = "h2",
  id,
  className,
  children,
}: {
  as?: "h1" | "h2" | "h3" | "h4" | "p";
  size?: HeadingSize;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tag id={id} className={cn(HEADING[size], className)}>
      {children}
    </Tag>
  );
}

/* ── Text ─────────────────────────────────────────────────────────────────── */

type TextSize = "lead" | "body" | "small";
export function Text({
  size = "body",
  muted = false,
  onInk = false,
  className,
  children,
}: {
  size?: TextSize;
  muted?: boolean;
  onInk?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const colour = onInk
    ? muted ? "text-ink-fg-muted" : "text-ink-fg"
    : muted ? "text-ink-muted" : "text-ink-soft";
  return <p className={cn(`t-${size}`, colour, className)}>{children}</p>;
}

/* ── Buttons & links ──────────────────────────────────────────────────────────
   Three variants, by surface. Primary is ink on paper, paper on ink. Gold is
   deliberately not a button fill: at large size it reads as a template.    */

type ButtonVariant = "primary" | "secondary";

function buttonClass(variant: ButtonVariant, onInk: boolean, className?: string) {
  const v =
    variant === "primary"
      ? onInk
        ? "bg-ink-fg text-ink hover:bg-white"
        : "bg-ink text-paper hover:bg-black"
      : onInk
        ? "border border-ink-line text-ink-fg hover:border-ink-fg-muted"
        : "border border-line-strong text-ink hover:border-ink";
  return cn("q-btn", v, className);
}

export function ButtonLink({
  href,
  variant = "primary",
  onInk = false,
  arrow = true,
  external = false,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  onInk?: boolean;
  arrow?: boolean;
  /** tel:, mailto:, wa.me or another site — rendered as a plain anchor. */
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = buttonClass(variant, onInk, className);
  const icon = arrow && <ArrowRight aria-hidden="true" className="h-4 w-4" />;
  if (external) {
    return (
      <a href={href} className={cls} {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {icon}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {icon}
    </Link>
  );
}

export function TextLink({
  href,
  onInk = false,
  external = false,
  className,
  children,
}: {
  href: string;
  onInk?: boolean;
  /** Opens another site / a document — shows the outward arrow. */
  external?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const cls = cn("q-link t-small", onInk ? "text-ink-fg" : "text-ink", className);
  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
    </Link>
  );
}

/* ── Rule ─────────────────────────────────────────────────────────────────── */

export function Rule({ onInk = false, className }: { onInk?: boolean; className?: string }) {
  return <hr className={cn("border-0 h-px", onInk ? "bg-ink-line" : "bg-line", className)} />;
}

/* ── Figure ───────────────────────────────────────────────────────────────────
   Real photographs only, always captioned. A caption — where, what, when — is
   the cheapest way to make an image read as evidence rather than decoration.
   Generated imagery does not go in a Figure.                                */

export function Figure({
  src,
  alt,
  caption,
  ratio = "4/5",
  priority = false,
  sizes = "(min-width: 1024px) 45vw, 100vw",
  onInk = false,
  className,
  imageClassName,
}: {
  src: string;
  alt: string;
  caption?: React.ReactNode;
  /** CSS aspect-ratio, e.g. "4/5", "3/2". */
  ratio?: string;
  priority?: boolean;
  sizes?: string;
  onInk?: boolean;
  className?: string;
  imageClassName?: string;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <div className="relative overflow-hidden rounded-frame bg-paper-deep" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className={cn("object-cover", imageClassName)} />
      </div>
      {caption && (
        <figcaption className={cn("t-small mt-3 flex gap-3", onInk ? "text-ink-fg-muted" : "text-ink-muted")}>
          <span aria-hidden="true" className={cn("mt-[0.7em] h-px w-4 shrink-0", onInk ? "bg-ink-line" : "bg-line-strong")} />
          <span>{caption}</span>
        </figcaption>
      )}
    </figure>
  );
}
