"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, VolumeX, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Slide registry ────────────────────────────────────────────────────────
   Slide types:
   - "brand"  : The primary Vitorra text hero (always first, always present)
   - "video"  : A product video plays full-bleed with text overlay

   To add a new video slide:
     1. Drop `{id}.mp4` + `{id}-poster.jpg` into public/videos/
     2. Add an entry below with available: true
   ─────────────────────────────────────────────────────────────────────── */

type BrandSlide = { id: string; type: "brand"; available: true };
type VideoSlide = {
  id: string;
  type: "video";
  available: boolean;
  eyebrow: string;
  headline: string;
  body: string;
  videoSrc: string;
  posterSrc: string;
  href: string;
  ctaLabel: string;
};
type Slide = BrandSlide | VideoSlide;

const ALL_SLIDES: Slide[] = [
  {
    id: "brand",
    type: "brand",
    available: true,
  },
  {
    id: "fet",
    type: "video",
    available: true,
    eyebrow: "Fuel Eco Technology",
    headline: "Proven fuel savings.\nMeasurable results.",
    body: "Reducing fuel consumption and extending engine life for commercial fleets across East Africa.",
    videoSrc: "/videos/fet.mp4",
    posterSrc: "/videos/fet-poster.jpg",
    href: "/products/fuel-eco-tech",
    ctaLabel: "Request a Fuel Savings Assessment",
  },
  {
    id: "seal",
    type: "video",
    available: false, // set true + drop seal.mp4 to activate
    eyebrow: "SEAL Wound Spray",
    headline: "Stop bleeding fast.\nSave lives.",
    body: "Clinical-grade hemostatic wound control for hospitals, emergency responders, and military procurement.",
    videoSrc: "/videos/seal.mp4",
    posterSrc: "/videos/seal-poster.jpg",
    href: "/products/seal-wound-spray",
    ctaLabel: "Request Product Information",
  },
  {
    id: "coffee",
    type: "video",
    available: false,
    eyebrow: "Vitorra Coffee",
    headline: "Premium Ugandan coffee.\nFarm to cup.",
    body: "Traceable, responsibly sourced coffee for consumers, hospitality businesses, and international importers.",
    videoSrc: "/videos/coffee.mp4",
    posterSrc: "/videos/coffee-poster.jpg",
    href: "/products/coffee",
    ctaLabel: "Shop Coffee",
  },
];

const SLIDES = ALL_SLIDES.filter((s) => s.available);
const BRAND_DURATION = 5500; // ms on the text slide before auto-advancing

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slide = SLIDES[current];

  /* ── Navigation ─────────────────────────────────────────────────────── */
  const goTo = useCallback((idx: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    videoRef.current?.pause();
    setCurrent(idx);
  }, []);

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = useCallback(() => goTo((current + 1) % SLIDES.length), [current, goTo]);

  /* ── Auto-advance (brand slide only — video slide advances when it ends) */
  useEffect(() => {
    if (slide.type === "brand") {
      timerRef.current = setTimeout(next, BRAND_DURATION);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, slide.type, next]);

  /* ── When switching to a video slide, play the video ─────────────────── */
  useEffect(() => {
    if (slide.type === "video") {
      const video = videoRef.current;
      if (video) {
        video.currentTime = 0;
        video.muted = muted;
        video.play().catch(() => {});
      }
    }
  }, [current, slide.type, muted]);

  /* ── Sync muted state to video ──────────────────────────────────────── */
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const handleVideoEnd = () => next();

  const multiSlide = SLIDES.length > 1;

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "90vh", backgroundColor: "#161616" }}
    >
      {/* ── Slides ─────────────────────────────────────────────────────── */}
      {SLIDES.map((s, i) => {
        const active = i === current;
        return (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: active ? 1 : 0, pointerEvents: active ? "auto" : "none" }}
            aria-hidden={!active}
          >
            {s.type === "brand" ? (
              /* keyed by active so entrance animation re-runs each time slide returns */
              <BrandSlideContent key={active ? "brand-on" : "brand-off"} active={active} />
            ) : (
              <VideoSlideContent
                key={active ? `${s.id}-on` : `${s.id}-off`}
                slide={s}
                active={active}
                videoRef={active ? videoRef : undefined}
                muted={muted}
                onEnded={handleVideoEnd}
              />
            )}
          </div>
        );
      })}

      {/* ── Controls bar — absolute bottom ───────────────────────────────
          Dots (centre) + mute toggle (right, video slides only)
          Prev/next arrows are subtle circles on the sides             */}
      {multiSlide && (
        <>
          {/* Side arrows */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)", color: "#FFFFFF", backdropFilter: "blur(8px)" }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
            style={{ background: "rgba(255,255,255,0.12)", color: "#FFFFFF", backdropFilter: "blur(8px)" }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Bottom bar — dots + mute */}
      <div className="absolute bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-4 px-6">
        {/* Dots */}
        {multiSlide && (
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className="rounded-full transition-all duration-400"
                style={{
                  width: i === current ? "28px" : "8px",
                  height: "8px",
                  backgroundColor: i === current ? "#C5B27A" : "rgba(255,255,255,0.4)",
                }}
              />
            ))}
          </div>
        )}

        {/* Mute toggle — only when current slide is video */}
        {slide.type === "video" && (
          <button
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? "Unmute" : "Mute"}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-all hover:scale-105"
            style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF", backdropFilter: "blur(8px)" }}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </section>
  );
}

/* ─── Brand slide ────────────────────────────────────────────────────────── */

function BrandSlideContent({ active }: { active: boolean }) {
  const anim = (n: number) => (active ? `hero-enter hero-enter-${n}` : "");
  return (
    <div
      className="absolute inset-0 flex flex-col justify-end"
      style={{ background: "linear-gradient(160deg, #181818 0%, #242424 100%)" }}
    >
      {/* Watermark */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none select-none flex items-center"
      >
        <span
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "clamp(80px, 12vw, 160px)",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            color: "rgba(255,255,255,0.04)",
            userSelect: "none",
            paddingLeft: "clamp(24px, 5vw, 80px)",
            whiteSpace: "nowrap",
          }}
        >
          Vitorra
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 pb-20 md:pb-28 pt-36 md:pt-40">
        <span className={cn("eyebrow-light mb-6 inline-flex", anim(1))}>
          Vitorra Holdings Limited · Uganda &amp; East Africa
        </span>

        <h1
          className={cn("mb-6 max-w-4xl", anim(2))}
          style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontSize: "clamp(40px, 5.5vw, 68px)",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            lineHeight: 1.06,
            color: "#FFFFFF",
          }}
        >
          Innovative products.{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #C5B27A 0%, #D4C49A 50%, #A89255 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Dependable solutions.
          </span>
        </h1>

        <p
          className={cn("mb-10 max-w-xl", anim(3))}
          style={{ fontSize: "17px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}
        >
          A diversified company delivering Fuel Eco Tech, logistics, healthcare
          products, and premium coffee across Uganda, East Africa, and international markets.
        </p>

        <div className={cn("flex flex-col sm:flex-row gap-3", anim(4))}>
          <Link href="/enquire" className="btn-primary">
            Request a Quote
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/about" className="btn-ghost-dark">
            About Vitorra
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Video slide ─────────────────────────────────────────────────────────── */

function VideoSlideContent({
  slide,
  active,
  videoRef,
  muted,
  onEnded,
}: {
  slide: VideoSlide;
  active: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  onEnded: () => void;
}) {
  const anim = (n: number) => (active ? `hero-enter hero-enter-${n}` : "");
  return (
    <div className="absolute inset-0">
      {/* Video background — slow Ken Burns zoom while active */}
      <video
        ref={videoRef}
        src={slide.videoSrc}
        poster={slide.posterSrc}
        preload="metadata"
        playsInline
        muted={muted}
        onEnded={onEnded}
        className="absolute inset-0 w-full h-full object-cover"
        style={
          active
            ? { animation: "vitorra-ken-burns 12s ease-out both" }
            : undefined
        }
      />

      {/* Gradient overlay — dark at bottom for text, subtle at top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.15) 100%)",
        }}
      />

      {/* Slide content — bottom-left, Mastercard style */}
      <div className="absolute inset-0 flex flex-col justify-end">
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 pb-24 md:pb-32">
          <span className={cn("eyebrow-light mb-5 inline-flex", anim(1))}>{slide.eyebrow}</span>

          <h2
            className={cn("mb-4 max-w-2xl", anim(2))}
            style={{
              fontFamily: "var(--font-playfair, Georgia, serif)",
              fontSize: "clamp(32px, 4.5vw, 60px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.06,
              color: "#FFFFFF",
              whiteSpace: "pre-line",
            }}
          >
            {slide.headline}
          </h2>

          <p
            className={cn("mb-8 max-w-lg", anim(3))}
            style={{ fontSize: "15px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}
          >
            {slide.body}
          </p>

          <div className={anim(4)}>
            <Link href={slide.href} className="btn-primary inline-flex items-center gap-2">
              {slide.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
