import { CircleLink } from "@/components/system/CircleLink";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { Section, Container, Label, Heading, Text, ButtonLink, TextLink } from "@/components/system";
import { Reveal } from "@/components/ui/reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { CONTACT_ADDRESS, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/* ─── Quiet Authority — composed blocks for product and company pages ─────────
   Each block is one section with one job. Product pages pick the blocks their
   buying journey needs, in the order a buyer needs them, instead of every page
   running the same nine-section template.                                    */

/* ── Product intro ────────────────────────────────────────────────────────── */

export function ProductIntro({
  index,
  name,
  title,
  lead,
  primary,
  secondary,
  facts,
  media,
}: {
  /** "01" — the business's number, matching the homepage doors. */
  index: string;
  name: string;
  title: React.ReactNode;
  lead: string;
  primary: { label: string; href: string };
  secondary?: { label: string; href: string };
  /** Short, checkable facts shown under the actions. */
  facts?: { k: string; v: string }[];
  media: React.ReactNode;
}) {
  return (
    <Section tone="paper" className="!pt-12 lg:!pt-20" aria-labelledby="product-title">
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        <div className="lg:col-span-6 lg:pt-6">
          <Label index={index} className="mb-8">{name}</Label>
          <Heading as="h1" size="h1" id="product-title" className="text-ink">{title}</Heading>
          <Text size="lead" className="mt-7 max-w-[34rem]">{lead}</Text>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5">
            <ButtonLink href={primary.href}>{primary.label}</ButtonLink>
            {secondary && <TextLink href={secondary.href}>{secondary.label}</TextLink>}
          </div>
          {facts && facts.length > 0 && (
            <dl className="mt-12 grid grid-cols-2 gap-px bg-line border-y border-line">
              {facts.map((f) => (
                <div key={f.k} className="bg-paper py-4 pr-4">
                  <dt className="t-label text-ink-muted">{f.k}</dt>
                  <dd className="t-small text-ink mt-1.5">{f.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <div className="lg:col-span-6">{media}</div>
      </Container>
    </Section>
  );
}

/* ── Section heading (label + title + optional body), used by most blocks ── */

export function SectionHead({
  label,
  title,
  body,
  onInk = false,
  id,
  className,
}: {
  label?: string;
  title: React.ReactNode;
  body?: string;
  onInk?: boolean;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[40rem]", className)}>
      {label && <Label onInk={onInk} className="mb-6">{label}</Label>}
      <Heading id={id} size="h2" className={onInk ? "text-ink-fg" : "text-ink"}>{title}</Heading>
      {body && <Text onInk={onInk} muted={onInk} className="mt-6">{body}</Text>}
    </div>
  );
}

/* ── Steps — a numbered process, hairline-divided ─────────────────────────── */

export function Steps({
  items,
  onInk = false,
  className,
}: {
  items: { title: string; body: string }[];
  onInk?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn("border-t", onInk ? "border-ink-line" : "border-line-strong", className)}>
      {items.map((s, i) => (
        <li
          key={s.title}
          className={cn("grid grid-cols-[3rem_1fr] md:grid-cols-[5rem_1fr_1.4fr] gap-x-6 gap-y-2 py-7 border-b", onInk ? "border-ink-line" : "border-line")}
        >
          <span className={cn("t-label font-numeric pt-1.5", onInk ? "text-gold" : "text-gold-ink")}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className={cn("t-h3", onInk ? "text-ink-fg" : "text-ink")}>{s.title}</h3>
          <p className={cn("t-body col-start-2 md:col-start-3", onInk ? "text-ink-fg-muted" : "text-ink-soft")}>{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

/* ── FactGrid — titled points in a hairline grid ──────────────────────────── */

export function FactGrid({
  items,
  columns = 2,
  surface = "paper",
}: {
  items: { title: string; body: string }[];
  columns?: 2 | 3 | 4;
  /** The section tone it sits on, so the cells match the background. */
  surface?: "paper" | "deep" | "ink";
}) {
  const onInk = surface === "ink";
  const cell = { paper: "bg-paper", deep: "bg-paper-deep", ink: "bg-ink" }[surface];
  const cols = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <ul className={cn("grid grid-cols-1 gap-px border-y", cols, onInk ? "bg-ink-line border-ink-line" : "bg-line border-line")}>
      {items.map((f) => (
        <li key={f.title} className={cn("py-8 md:p-8", cell)}>
          <h3 className={cn("t-h3", onInk ? "text-ink-fg" : "text-ink")}>{f.title}</h3>
          <p className={cn("t-small mt-3", onInk ? "text-ink-fg-muted" : "text-ink-soft")}>{f.body}</p>
        </li>
      ))}
    </ul>
  );
}

/* ── SpecTable — key/value rows ───────────────────────────────────────────── */

export function SpecTable({
  rows,
  onInk = false,
  className,
}: {
  rows: [string, React.ReactNode][];
  onInk?: boolean;
  className?: string;
}) {
  return (
    <dl className={cn("border-t", onInk ? "border-ink-line" : "border-line-strong", className)}>
      {rows.map(([k, v]) => (
        <div key={k} className={cn("grid grid-cols-1 sm:grid-cols-[minmax(10rem,1fr)_2fr] gap-1 sm:gap-6 py-4 border-b", onInk ? "border-ink-line" : "border-line")}>
          <dt className={cn("t-label pt-0.5", onInk ? "text-ink-fg-muted" : "text-ink-muted")}>{k}</dt>
          <dd className={cn("t-body", onInk ? "text-ink-fg" : "text-ink")}>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── Credentials — grouped by what each one actually covers ───────────────── */

export function CredentialGroups({
  groups,
}: {
  groups: { title: string; items: { name: string; what: string }[] }[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-10">
      {groups.map((g) => (
        <Reveal key={g.title}>
          <h3 className="t-label text-ink-muted pb-4 border-b border-line-strong">{g.title}</h3>
          <ul>
            {g.items.map((c) => (
              <li key={c.name} className="q-row group relative border-b border-line py-5">
                <p className="font-display text-[1.375rem] leading-tight text-ink transition-transform duration-500 ease-[var(--ease-cinematic)] group-hover:translate-x-2">{c.name}</p>
                <p className="t-small text-ink-muted mt-1 transition-transform duration-500 delay-75 ease-[var(--ease-cinematic)] group-hover:translate-x-2">{c.what}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

/* ── ContactBand — the close of every page ────────────────────────────────── */

export function ContactBand({
  title,
  body,
  briefLabel,
  briefHref = "/enquire",
  labels,
}: {
  title: string;
  body: string;
  briefLabel: string;
  briefHref?: string;
  labels: { call: string; email: string; visit: string; whatsapp: string };
}) {
  const wa = `https://wa.me/${CONTACT_PHONE.replace(/[^0-9]/g, "")}`;
  /* Sage, light and calm, so the dark footer below reads as its own close:
     the big question and one circle action on the left, the three ways to
     reach us on the right. This is the only place contact details appear
     (the footer no longer repeats them). */
  return (
    <Section tone="sage" aria-labelledby="contact-band-heading">
      <Container className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7">
          <Heading id="contact-band-heading" size="h1" className="text-ink">{title}</Heading>
          <Text size="lead" className="mt-6 max-w-[30rem]">{body}</Text>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <CircleLink href={briefHref} size="lg">{briefLabel}</CircleLink>
            <Magnetic><ButtonLink href={wa} external variant="secondary" arrow={false}><WhatsAppIcon className="h-4 w-4" />{labels.whatsapp}</ButtonLink></Magnetic>
          </div>
        </div>
        <dl className="lg:col-span-5 border-t border-line-strong">
          {[
            { k: labels.call, v: CONTACT_PHONE, href: `tel:${CONTACT_PHONE.replace(/\s/g, "")}` },
            { k: labels.email, v: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
            { k: labels.visit, v: CONTACT_ADDRESS.join(", "), href: undefined },
          ].map((r) => (
            <div key={r.k} className="grid grid-cols-3 gap-4 border-b border-line-strong py-5">
              <dt className="t-label text-ink-muted pt-1">{r.k}</dt>
              <dd className="col-span-2 t-body text-ink">
                {r.href ? <a href={r.href} className="q-link">{r.v}</a> : r.v}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </Section>
  );
}
