"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

/* A statement whose words fill in, one after another, as it scrolls through
   the screen — the reader's own scrolling "speaks" the line. The full text is
   always in the page (and read whole by screen readers); only the colour
   moves. */

function Word({ word, range, progress }: { word: string; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <span className="relative inline-block mr-[0.25em]">
      <motion.span style={{ opacity }}>{word}</motion.span>
    </span>
  );
}

export function WordReveal({ text, className, as: Tag = "p" }: { text: string; className?: string; as?: "p" | "h2" }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.4"] });
  const words = text.split(/\s+/);
  return (
    <Tag ref={ref as React.RefObject<HTMLParagraphElement & HTMLHeadingElement>} className={cn(className)} aria-label={text}>
      <span aria-hidden="true">
        {words.map((w, i) => (
          <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
        ))}
      </span>
    </Tag>
  );
}
