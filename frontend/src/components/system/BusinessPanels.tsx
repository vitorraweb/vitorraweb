"use client";

import { useState, ViewTransition } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { TextLink } from "@/components/system";
import { cn } from "@/lib/utils";

/* ─── The four businesses, as panels ──────────────────────────────────────────
   On a desktop the four businesses stand side by side as tall panels; the one
   under the pointer (or keyboard focus) opens out to full colour with its
   description and next step, the others fold to a spine with their name.
   Each photograph carries the same view-transition name as the hero of the
   page it opens, so following a panel feels like stepping into the picture.
   Phones get the same four as a simple stack.                              */

export type Door = {
  key: string;
  href: string;
  image: string;
  imageAlt: string;
  name: string;
  tagline: string;
  body: string;
  action: { label: string; href: string };
  second?: { label: string; href: string };
};

const ease = [0.16, 1, 0.3, 1] as const;

export function BusinessPanels({ doors, viewLabel }: { doors: Door[]; viewLabel: string }) {
  const [active, setActive] = useState(0);

  return (
    <>
      {/* Desktop */}
      <ol className="hidden lg:flex gap-3 h-[min(80svh,46rem)]" onMouseLeave={() => undefined}>
        {doors.map((d, i) => {
          const on = active === i;
          return (
            <motion.li
              key={d.key}
              className="relative overflow-hidden rounded-frame bg-ink min-w-0"
              animate={{ flexGrow: on ? 3.4 : 1 }}
              transition={{ duration: 0.9, ease }}
              style={{ flexBasis: 0 }}
              onMouseEnter={() => setActive(i)}
              onFocusCapture={() => setActive(i)}
            >
              <Link href={d.href} className="absolute inset-0 z-0" aria-label={d.name} data-cursor={viewLabel} tabIndex={-1}>
                <ViewTransition name={`hero-${d.key}`} share="morph">
                  <motion.div className="absolute inset-0" animate={{ scale: on ? 1.02 : 1.12 }} transition={{ duration: 1.4, ease }}>
                    <Image src={d.image} alt={d.imageAlt} fill sizes="(min-width: 1024px) 60vw, 100vw" className={cn("object-cover q-grade transition-[filter] duration-1000", on ? "" : "grayscale-[0.6] brightness-[0.55]")} />
                  </motion.div>
                </ViewTransition>
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.92)_0%,rgba(20,20,20,0.35)_45%,rgba(20,20,20,0.1)_100%)]" />
              </Link>

              {/* Spine — folded state */}
              <motion.div
                aria-hidden={on}
                className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none"
                animate={{ opacity: on ? 0 : 1 }}
                transition={{ duration: 0.4 }}
              >
                <span className="font-numeric t-label text-gold">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-display text-ink-fg text-[1.75rem] leading-none whitespace-nowrap [writing-mode:vertical-rl] rotate-180">{d.name}</span>
              </motion.div>

              {/* Open state */}
              <motion.div
                className="absolute inset-x-0 bottom-0 z-10 p-10 max-w-[34rem] text-ink-fg"
                animate={{ opacity: on ? 1 : 0, y: on ? 0 : 24 }}
                transition={{ duration: on ? 0.8 : 0.3, delay: on ? 0.25 : 0, ease }}
                style={{ pointerEvents: on ? "auto" : "none" }}
              >
                <p className="t-label text-ink-fg-muted flex items-center gap-3">
                  <span className="font-numeric text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span aria-hidden="true" className="h-px w-6 bg-ink-line" />
                  {d.tagline}
                </p>
                <h3 className="t-h1 mt-5">
                  <Link href={d.href} className="inline-flex items-start gap-3 hover:text-gold transition-colors">
                    {d.name}
                    <ArrowUpRight aria-hidden="true" className="h-6 w-6 mt-2 shrink-0" />
                  </Link>
                </h3>
                <p className="t-body text-ink-fg/80 mt-4 max-w-[28rem]">{d.body}</p>
                <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3">
                  <TextLink href={d.action.href} onInk>{d.action.label}</TextLink>
                  {d.second && <TextLink href={d.second.href} onInk className="text-ink-fg-muted">{d.second.label}</TextLink>}
                </div>
              </motion.div>
            </motion.li>
          );
        })}
      </ol>

      {/* Phones and tablets */}
      <ol className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-14">
        {doors.map((d, i) => (
          <li key={d.key}>
            <Link href={d.href} className="group block relative overflow-hidden rounded-frame bg-paper-deep q-unveil" style={{ aspectRatio: "4/5" }} aria-label={d.name}>
              <div className="q-inner absolute inset-0">
                <Image src={d.image} alt={d.imageAlt} fill sizes="(min-width: 640px) 46vw, 100vw" className="object-cover q-grade" />
              </div>
            </Link>
            <p className="t-label text-ink-muted mt-6 flex items-center gap-3">
              <span className="font-numeric text-gold-ink">{String(i + 1).padStart(2, "0")}</span>
              <span aria-hidden="true" className="h-px w-6 bg-line-strong" />
              {d.tagline}
            </p>
            <h3 className="t-h3 text-ink mt-3"><Link href={d.href}>{d.name}</Link></h3>
            <p className="t-small text-ink-soft mt-3 mb-6">{d.body}</p>
            <div className="flex flex-col items-start gap-3">
              <TextLink href={d.action.href}>{d.action.label}</TextLink>
              {d.second && <TextLink href={d.second.href} className="text-ink-muted">{d.second.label}</TextLink>}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
