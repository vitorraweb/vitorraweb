"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Film — a captioned film that plays when asked ───────────────────────────
   The old product heroes ran 3–15 MB brand films as autoplaying backgrounds.
   On Ugandan mobile data that is a real cost to the visitor for something they
   didn't choose to watch, and as a background the film was mostly darkened
   behind text anyway. Here the poster loads (a few KB); the video file is only
   requested when someone presses play. Muted-autoplay is never used; the
   still carries the motion instead (a slow drift and a breathing play ring). */

export function Film({
  src,
  poster,
  title,
  caption,
  playLabel,
  ratio = "16/9",
  onInk = false,
  className,
}: {
  src: string;
  poster: string;
  /** Accessible name for the video, e.g. "Fuel Eco Tech manufacturer film". */
  title: string;
  caption?: React.ReactNode;
  playLabel: string;
  ratio?: string;
  onInk?: boolean;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <figure className={cn("m-0", className)}>
      <div className="relative overflow-hidden rounded-frame bg-ink" style={{ aspectRatio: ratio }}>
        {playing ? (
          <video
            ref={ref}
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-label={title}
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full text-left"
            aria-label={`${playLabel}: ${title}`}
            data-cursor={playLabel}
          >
            {/* The still drifts slowly (a few KB, not the film), so the panel
                reads as moving picture before anyone presses play. */}
            <span className="absolute inset-0 q-kenburns">
              <Image src={poster} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover transition-transform duration-[1200ms] ease-[var(--ease-cinematic)] group-hover:scale-[1.03]" />
            </span>
            <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,20,20,0.78),rgba(20,20,20,0.12)_55%,rgba(20,20,20,0.05))]" />

            {/* Play: a large disc with a ring that breathes outwards. */}
            <span aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center">
              <span className="absolute h-24 w-24 rounded-full border border-white/60 q-ring" />
              <span className="absolute h-24 w-24 rounded-full border border-white/40 q-ring [animation-delay:1200ms]" />
              <span className="relative grid place-items-center h-20 w-20 rounded-full bg-paper/95 text-ink transition-[background-color,scale] duration-500 group-hover:bg-gold group-hover:scale-110">
                <Play className="h-6 w-6 fill-current translate-x-0.5" />
              </span>
            </span>

            <span className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
              <span className="t-h3 text-ink-fg max-w-[22rem]">{title}</span>
              <span className="t-label text-ink-fg/85 shrink-0">{playLabel}</span>
            </span>
          </button>
        )}
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
