"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Slide registry ────────────────────────────────────────────────────────
   To activate a new video:
     1. Drop `{id}.mp4` + `{id}-poster.jpg` into public/videos/
     2. Set available: true on the matching entry below
   ─────────────────────────────────────────────────────────────────────── */

interface Slide {
  id: string;
  available: boolean;
  eyebrow: string;
  headline: string;
  description: string;
  videoSrc: string;
  posterSrc: string;
  href: string;
  ctaLabel: string;
}

const ALL_SLIDES: Slide[] = [
  {
    id: "fet",
    available: true,
    eyebrow: "Fuel Eco Technology",
    headline: "Proven fuel savings. Measurable results.",
    description:
      "See how Fuel Eco Tech reduces fuel consumption and extends engine life for commercial fleets across East Africa.",
    videoSrc: "/videos/fet.mp4",
    posterSrc: "/videos/fet-poster.jpg",
    href: "/products/fuel-eco-tech",
    ctaLabel: "Request a Fuel Savings Assessment",
  },
  {
    id: "seal",
    available: false,
    eyebrow: "SEAL Hemostatic Spray",
    headline: "Stop bleeding fast. Save lives.",
    description:
      "Clinical-grade hemostatic wound control for hospitals, emergency responders, and military procurement.",
    videoSrc: "/videos/seal.mp4",
    posterSrc: "/videos/seal-poster.jpg",
    href: "/products/seal-wound-spray",
    ctaLabel: "Request Product Information",
  },
  {
    id: "coffee",
    available: false,
    eyebrow: "Vitorra Coffee",
    headline: "Premium Ugandan coffee. Farm to cup.",
    description:
      "Traceable, responsibly sourced coffee for consumers, hospitality businesses, and international importers.",
    videoSrc: "/videos/coffee.mp4",
    posterSrc: "/videos/coffee-poster.jpg",
    href: "/products/coffee",
    ctaLabel: "Shop Coffee",
  },
  {
    id: "logistics",
    available: false,
    eyebrow: "Logistics Services",
    headline: "Move goods with confidence.",
    description:
      "End-to-end freight, warehousing, customs clearance, and supply chain management across East Africa.",
    videoSrc: "/videos/logistics.mp4",
    posterSrc: "/videos/logistics-poster.jpg",
    href: "/products/logistics",
    ctaLabel: "Request a Logistics Quote",
  },
];

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function VideoShowcase() {
  const slides = ALL_SLIDES.filter((s) => s.available);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const multiSlide = slides.length > 1;

  const goTo = useCallback((idx: number) => {
    videoRef.current?.pause();
    setPlaying(false);
    setCurrent(idx);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playing) {
      video.pause();
      setPlaying(false);
    } else {
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    }
  };

  const slide = slides[current];
  if (!slide) return null;

  /* ── Single-slide layout ─────────────────────────────────────────────────
     One video = feature section: eyebrow + headline centred above,
     full-width stadium video, description + CTA below.
  ── Multi-slide layout ──────────────────────────────────────────────────
     Two or more videos = editorial grid: video left (2fr), info panel right.
  ─────────────────────────────────────────────────────────────────────── */

  return (
    <section className="section-padding" style={{ backgroundColor: "#F8F7F5" }}>
      <div className="container-max">

        {multiSlide ? (
          /* ── MULTI-SLIDE: grid layout ────────────────────────────────── */
          <>
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <span className="eyebrow block mb-4">Products in Action</span>
                <h2 style={styles.sectionH2}>See what we deliver.</h2>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => goTo((current - 1 + slides.length) % slides.length)}
                  aria-label="Previous"
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-black/12 hover:bg-black/[0.04] transition-colors"
                  style={{ color: "#1E1E1E" }}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goTo((current + 1) % slides.length)}
                  aria-label="Next"
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-black/12 hover:bg-black/[0.04] transition-colors"
                  style={{ color: "#1E1E1E" }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-center">
              <VideoPlayer
                slide={slide}
                playing={playing}
                videoRef={videoRef}
                onToggle={togglePlay}
                onEnded={() => setPlaying(false)}
              />
              <div>
                <span className="eyebrow block mb-4">{slide.eyebrow}</span>
                <h3 className="mb-4" style={styles.slideH3}>{slide.headline}</h3>
                <p className="mb-7" style={styles.body}>{slide.description}</p>
                <Link href={slide.href} className="inline-flex items-center gap-2 font-semibold text-sm hover:opacity-70 transition-opacity" style={{ color: "#1E1E1E" }}>
                  {slide.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <div className="flex items-center gap-2 mt-8 pt-6 border-t border-black/[0.07]">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Slide ${i + 1}`}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === current ? "24px" : "8px",
                        height: "8px",
                        backgroundColor: i === current ? "#C5B27A" : "#1E1E1E",
                        opacity: i === current ? 1 : 0.18,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── SINGLE-SLIDE: feature section layout ───────────────────── */
          <>
            <div className="text-center mb-10">
              <span className="eyebrow mb-4 inline-flex">{slide.eyebrow}</span>
              <h2 className="max-w-xl mx-auto" style={styles.sectionH2}>{slide.headline}</h2>
            </div>

            <VideoPlayer
              slide={slide}
              playing={playing}
              videoRef={videoRef}
              onToggle={togglePlay}
              onEnded={() => setPlaying(false)}
            />

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <p style={{ ...styles.body, maxWidth: "520px" }}>{slide.description}</p>
              <Link
                href={slide.href}
                className="btn-primary shrink-0"
              >
                {slide.ctaLabel}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* ─── VideoPlayer sub-component ─────────────────────────────────────────── */

function VideoPlayer({
  slide,
  playing,
  videoRef,
  onToggle,
  onEnded,
}: {
  slide: Slide;
  playing: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onToggle: () => void;
  onEnded: () => void;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden cursor-pointer group",
        "bg-[#161616] rounded-[32px] aspect-video"
      )}
      onClick={onToggle}
      role="button"
      aria-label={playing ? "Pause video" : "Play video"}
    >
      <video
        ref={videoRef}
        key={slide.id}
        src={slide.videoSrc}
        poster={slide.posterSrc}
        preload="none"
        playsInline
        onEnded={onEnded}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Play / Pause button */}
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      >
        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-[0_4px_24px_rgba(0,0,0,0.22)] transition-transform duration-150 group-hover:scale-105">
          {playing ? (
            <Pause className="w-5 h-5" style={{ color: "#1E1E1E" }} />
          ) : (
            <Play className="w-5 h-5 ml-0.5" style={{ color: "#1E1E1E" }} />
          )}
        </div>
      </div>

      {/* Gold brand badge */}
      <div
        className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
        style={{ backgroundColor: "#C5B27A", color: "#1E1E1E", letterSpacing: "0.07em" }}
      >
        Vitorra
      </div>
    </div>
  );
}

/* ─── Shared style tokens ───────────────────────────────────────────────── */

const styles = {
  sectionH2: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(28px, 3.2vw, 44px)",
    fontWeight: 700,
    letterSpacing: "-0.02em",
    lineHeight: 1.12,
    color: "#1E1E1E",
  } as React.CSSProperties,
  slideH3: {
    fontFamily: "var(--font-playfair, Georgia, serif)",
    fontSize: "clamp(22px, 2.2vw, 30px)",
    fontWeight: 600,
    letterSpacing: "-0.015em",
    lineHeight: 1.15,
    color: "#1E1E1E",
  } as React.CSSProperties,
  body: {
    fontSize: "15px",
    lineHeight: 1.7,
    color: "#555555",
  } as React.CSSProperties,
};
