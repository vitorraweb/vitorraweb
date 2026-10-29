"use client";

import { useRef, useState } from "react";
import { motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { FetDevice } from "@/components/three/FetDevice";

/* ─── How it works, with the device in hand ───────────────────────────────────
   Fuel Eco Tech's three steps, read beside the device itself. The device turns
   through the chapter and opens to the (illustrated) swirl chamber on the
   step that describes it, then closes again for the measurement step. Pinned
   on desktop; a plain sequence on phones.                                   */

type Step = { title: string; body: string };

export function DeviceSteps({
  label, title, body, steps, illustration, deviceAlt, children,
}: {
  label: string;
  title: string;
  body: string;
  steps: Step[];
  illustration: string;
  deviceAlt: string;
  /** Rendered after the chapter, e.g. the manufacturer's film. */
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const spin = useTransform(scrollYProgress, [0, 1], [0, 0.75]);
  const open = useTransform(scrollYProgress, [0.28, 0.42, 0.62, 0.76], [0, 1, 1, 0]);
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(steps.length - 1, Math.floor(v * steps.length * 0.999))));

  return (
    <section aria-labelledby="fet-how" className="q-scope bg-paper text-ink">
      <div ref={ref} className="hidden lg:block relative" style={{ height: `${steps.length * 90 + 60}vh` }}>
        <div className="sticky top-0 h-svh overflow-hidden">
          <div className="q-container h-full grid grid-cols-12 gap-8 sm:gap-12 items-center">
            <div className="col-span-5">
              <p className="t-label text-ink-muted mb-6">{label}</p>
              <h2 id="fet-how" className="t-h2 text-ink">{title}</h2>
              <p className="t-body text-ink-soft mt-6 max-w-[28rem]">{body}</p>
              <ol className="mt-10 sm:mt-12 border-t border-line">
                {steps.map((s, i) => (
                  <li key={s.title} className="border-b border-line py-5">
                    <div className="flex gap-5">
                      <span className={`font-numeric t-label pt-1.5 transition-colors duration-500 ${active === i ? "text-gold-ink" : "text-ink-muted"}`}>{String(i + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <p className={`t-h3 transition-colors duration-500 ${active === i ? "text-ink" : "text-ink-muted"}`}>{s.title}</p>
                        <motion.div
                          initial={false}
                          animate={{ height: active === i ? "auto" : 0, opacity: active === i ? 1 : 0 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="t-small text-ink-soft pt-3 max-w-[30rem]">{s.body}</p>
                        </motion.div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="col-span-7 h-[86svh] relative rounded-frame bg-ink overflow-hidden" data-tone="ink">
              <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_50%_55%_at_50%_50%,rgba(197,178,122,0.18),transparent_70%)]" />
              <FetDevice spin={spin} open={open} fallbackAlt={deviceAlt} className="absolute inset-0" />
              <motion.p style={{ opacity: open }} className="absolute left-8 bottom-6 right-8 t-small text-ink-fg-muted max-w-[26rem]">{illustration}</motion.p>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden q-section">
        <div className="q-container">
          <p className="t-label text-ink-muted mb-6">{label}</p>
          <h2 className="t-h2 text-ink">{title}</h2>
          <p className="t-body text-ink-soft mt-6">{body}</p>
          <ol className="mt-10 border-t border-line">
            {steps.map((s, i) => (
              <li key={s.title} className="border-b border-line py-6 flex gap-5">
                <span className="font-numeric t-label text-gold-ink pt-1.5">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className="t-h3 text-ink">{s.title}</p>
                  <p className="t-small text-ink-soft mt-3">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {children && <div className="q-container pb-[clamp(4.5rem,2.8rem+7vw,9rem)] lg:pt-16">{children}</div>}
    </section>
  );
}
