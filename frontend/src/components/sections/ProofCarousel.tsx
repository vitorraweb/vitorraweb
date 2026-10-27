"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container, Label } from "@/components/system";
import { cn } from "@/lib/utils";

/* ─── Proof carousel ──────────────────────────────────────────────────────────
   One designed proof slide per business (Olivia's 4:3 banners), each a link
   to its page. A native horizontal scroll with snap points, so touch, the
   trackpad and the keyboard all work without a library; the arrows step one
   slide, and the counter follows the slide nearest the left edge. The next
   slide peeks in at the edge so it reads as "there's more".               */

export type ProofSlide = { src: string; alt: string; href: string; name: string };

export function ProofCarousel({
  label,
  title,
  slides,
  prevLabel,
  nextLabel,
}: {
  label: string;
  title: string;
  slides: ProofSlide[];
  prevLabel: string;
  nextLabel: string;
}) {
  const track = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  /* The current slide is the one whose left edge is nearest the track's
     scroll position — robust when the next slide peeks in. */
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const items = Array.from(el.children) as HTMLElement[];
      let best = 0;
      let dist = Infinity;
      items.forEach((item, i) => {
        const d = Math.abs(item.offsetLeft - el.offsetLeft - el.scrollLeft);
        if (d < dist) { dist = d; best = i; }
      });
      setActive(best);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const go = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const next = Math.max(0, Math.min(slides.length - 1, active + dir));
    const item = el.children[next] as HTMLElement | undefined;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (item) el.scrollTo({ left: item.offsetLeft - el.offsetLeft, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="proof-heading" className="q-scope bg-ink text-ink-fg py-[clamp(4.5rem,3rem+6vw,9rem)] overflow-hidden">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-8 mb-12">
          <div>
            <Label onInk className="mb-6">{label}</Label>
            <h2 id="proof-heading" className="t-h1 text-ink-fg max-w-[36rem]">{title}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="t-label text-ink-fg-muted font-numeric" aria-live="polite">
              {String(active + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
            </span>
            {([-1, 1] as const).map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => go(dir)}
                disabled={dir === -1 ? active === 0 : active === slides.length - 1}
                aria-label={dir === -1 ? prevLabel : nextLabel}
                className="grid place-items-center h-12 w-12 rounded-full border border-ink-line text-ink-fg transition-colors hover:border-gold hover:text-gold disabled:opacity-35 disabled:hover:border-ink-line disabled:hover:text-ink-fg"
              >
                {dir === -1 ? <ArrowLeft aria-hidden="true" className="h-4 w-4" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>

        <ul
          ref={track}
          className="flex gap-5 lg:gap-8 overflow-x-auto snap-x snap-mandatory pb-4 -mb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((s, i) => (
            <li key={s.href} className="snap-start shrink-0 basis-[86%] sm:basis-[70%] lg:basis-[58%]">
              <Link href={s.href} className="group block" aria-label={`${s.name}: ${s.alt}`}>
                <div className={cn("relative overflow-hidden rounded-frame bg-ink-line q-zoom transition-opacity duration-500", i !== active && "lg:opacity-60")} style={{ aspectRatio: "1448/1086" }}>
                  <Image src={s.src} alt={s.alt} fill sizes="(min-width: 1024px) 58vw, 86vw" className="object-cover" />
                </div>
                <p className="t-label text-ink-fg-muted mt-4 group-hover:text-gold transition-colors">{s.name} →</p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
