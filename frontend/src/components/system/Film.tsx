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
   requested when someone presses play. Muted-autoplay is never used.        */

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
          >
            <Image src={poster} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            <span className="absolute left-5 bottom-5 inline-flex items-center gap-3 rounded-edge bg-paper/95 px-4 min-h-11 t-small font-medium text-ink transition-colors group-hover:bg-paper">
              <Play aria-hidden="true" className="h-4 w-4 fill-current" />
              {playLabel}
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
