"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform, AnimatePresence } from "motion/react";
import { FetDevice } from "@/components/three/FetDevice";
import { TextLink } from "@/components/system";

/* ─── The evidence, told on scroll ────────────────────────────────────────────
   A pinned chapter: the device holds the left of the screen and turns as the
   reader scrolls, while the measured result builds up on the right in the
   order an engineer would check it — before, after, the difference, and what
   that difference does and does not prove. The device opens to the
   (illustrated) swirl chamber at the moment the saving is stated.

   Desktop pins for 320vh. Phones get the same content as a simple sequence,
   with the device above it — pinning on a small screen fights the thumb.   */

type Props = {
  label: string;
  before: { k: string; v: string };
  after: { k: string; v: string };
  /** Unit printed small after the before/after figures, e.g. "L/100 km". */
  unit: string;
  noise: { k: string; v: string };
  figureCaption: string;
  source: string;
  honest: string;
  illustration: string;
  deviceAlt: string;
  links: { label: string; href: string }[];
};

export function EvidenceStory(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const spin = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const open = useTransform(scrollYProgress, [0.42, 0.62, 0.86, 1], [0, 1, 1, 0.35]);
  const pct = useTransform(scrollYProgress, [0.4, 0.62], [0, 13.9], { clamp: true });
  const [step, setStep] = useState(0);
  const [shown, setShown] = useState("0.0");

  useMotionValueEvent(scrollYProgress, "change", (v) => setStep(v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.72 ? 2 : 3));
  useMotionValueEvent(pct, "change", (v) => setShown(v.toFixed(1)));

  const steps = [
    { k: p.before.k, v: p.before.v },
    { k: p.after.k, v: p.after.v },
    null, // the figure
    null, // the honest reading
  ];

  return (
    <section aria-label={p.label} data-tone="ink" className="q-scope bg-ink text-ink-fg relative">
      {/* Desktop: pinned chapter */}
      <div ref={ref} className="hidden lg:block relative" style={{ height: "320vh" }}>
        <div className="sticky top-0 h-svh overflow-hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_45%_55%_at_30%_55%,rgba(197,178,122,0.16),transparent_70%)]" />
          <div className="q-container h-full grid grid-cols-12 gap-10 items-center relative">
            <div className="col-span-6 flex flex-col">
              <FetDevice spin={spin} open={open} fallbackAlt={p.deviceAlt} className="h-[70svh] w-full" />
              <motion.p style={{ opacity: open }} className="t-small text-ink-fg-muted mt-2 max-w-[24rem] text-[0.75rem]">
                {p.illustration}
              </motion.p>
            </div>

            <div className="col-span-6 col-start-7 relative min-h-[26rem]">
              <p className="t-label text-ink-fg-muted mb-10">{p.label}</p>
              {/* Progress rail */}
              <div className="flex gap-2 mb-12" aria-hidden="true">
                {steps.map((_, i) => (
                  <span key={i} className="h-px flex-1 bg-ink-line overflow-hidden">
                    <motion.span className="block h-full bg-gold origin-left" animate={{ scaleX: step >= i ? 1 : 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} />
                  </span>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step < 2 && steps[step] && (
                    <>
                      <p className="t-small text-ink-fg-muted max-w-[26rem]">{steps[step]!.k}</p>
                      <p className="t-figure text-ink-fg mt-6">
                        {steps[step]!.v}
                        <span className="t-h3 text-ink-fg-muted ml-3 align-baseline">{p.unit}</span>
                      </p>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <p className="t-figure text-ink-fg">{shown}<span className="text-gold">%</span></p>
                      <p className="t-lead text-ink-fg mt-6 max-w-[30rem]">{p.figureCaption}</p>
                      <p className="t-small text-ink-fg-muted mt-8">{p.noise.k}: <span className="text-ink-fg">{p.noise.v}</span></p>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <p className="t-h2 text-ink-fg max-w-[32rem]">{p.honest}</p>
                      <p className="t-small text-ink-fg-muted mt-8 max-w-[30rem]">{p.source}</p>
                      <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
                        {p.links.map((l) => <TextLink key={l.href} href={l.href} onInk>{l.label}</TextLink>)}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Phones and tablets: the same story as a sequence */}
      <div className="lg:hidden q-section">
        <div className="q-container">
          <p className="t-label text-ink-fg-muted mb-8">{p.label}</p>
          <FetDevice fallbackAlt={p.deviceAlt} className="h-[56svh] w-full mb-10" />
          <p className="t-figure text-ink-fg">13.9<span className="text-gold">%</span></p>
          <p className="t-lead text-ink-fg mt-5">{p.figureCaption}</p>
          <dl className="border-t border-ink-line mt-10">
            {[{ k: p.before.k, v: `${p.before.v} ${p.unit}` }, { k: p.after.k, v: `${p.after.v} ${p.unit}` }, p.noise].map((r) => (
              <div key={r.k} className="flex items-baseline justify-between gap-6 border-b border-ink-line py-5">
                <dt className="t-small text-ink-fg-muted">{r.k}</dt>
                <dd className="font-display text-[1.5rem] leading-none text-ink-fg whitespace-nowrap">{r.v}</dd>
              </div>
            ))}
          </dl>
          <p className="t-small text-ink-fg-muted mt-6">{p.source}</p>
          <p className="t-small text-ink-fg mt-4">{p.honest}</p>
          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
            {p.links.map((l) => <TextLink key={l.href} href={l.href} onInk>{l.label}</TextLink>)}
          </div>
        </div>
      </div>
    </section>
  );
}
