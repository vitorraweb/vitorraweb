"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Play, Pause, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Slide registry ────────────────────────────────────────────────────────
   To add a new video:
   1. Drop `{id}.mp4` + `{id}-poster.jpg` into public/videos/
   2. Set available: true on the corresponding entry below
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
    headline: "Proven fuel savings.\nMeasurable results.",
    description:
      "See how Fuel Eco Tech reduces fuel consumption and extends engine life for commercial fleets across East Africa.",
    videoSrc: "/videos/fet.mp4",
    posterSrc: "/videos/fet-poster.jpg",
    href: "/products/fuel-eco-tech",
    ctaLabel: "Request a Fuel Savings Assessment",
  },
  {
    id: "seal",
    available: false, // ← change to true + drop seal.mp4 to activate
    eyebrow: "SEAL Hemostatic Spray",
    headline: "Stop bleeding fast.\nSave lives.",
    description:
      "Clinical-grade hemostatic wound control for hospitals, emergency responders, and military procurement.",
    videoSrc: "/videos/seal.mp4",
    posterSrc: "/videos/seal-poster.jpg",
    href: "/products/seal-wound-spray",
    ctaLabel: "Request Product Information",
  },
  {
    id: "coffee",
    available: false, // ← change to true + drop coffee.mp4 to activate
    eyebrow: "Vitorra Coffee",
    headline: "Premium Ugandan coffee.\nFarm to cup.",
    description:
      "Traceable, responsibly sourced coffee from the heart of Uganda — for consumers and international importers.",
    videoSrc: "/videos/coffee.mp4",
    posterSrc: "/videos/coffee-poster.jpg",
    href: "/products/coffee",
    ctaLabel: "Shop Coffee",
  },
  {
    id: "logistics",
    available: false, // ← change to true + drop logistics.mp4 to activate
    eyebrow: "Logistics Services",
    headline: "Move goods\nwith confidence.",
    description:
      "End-to-end freight, warehousing, customs clearance, and supply chain management across East Africa.",
    videoSrc: "/videos/logistics.mp4",
    posterSrc: "/videos/logistics-poster.jpg",
    href: "/products/logistics",
    ctaLabel: "Request a Logistics Quote",
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function VideoShowcase() {
  const slides = ALL_SLIDES.filter((s) => s.available);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const multiSlide = slides.length > 1;

  /* Navigate — always pause before switching */
  const goTo = useCallback((idx: number) => {
    videoRef.current?.pause();
    setPlaying(false);
    setCurrent(idx);
  }, []);

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

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

  return (
    <section className="section-padding bg-canvas">
      <div className="container-max">

        {/* ── Section header ───────────────────────────────────────────── */}
        <div className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <span className="eyebrow block mb-4">Products in Action</span>
            <h2
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(36px, 4.5vw, 56px)",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 0.97,
                color: "#1E1E1E",
              }}
            >
              See what we deliver.
            </h2>
          </div>

          {/* Circular prev / next — only when >1 slide */}
          {multiSlide && (
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={prev}
                aria-label="Previous"
                className="w-11 h-11 rounded-full border border-black/15 flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                style={{ color: "#1E1E1E" }}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={next}
                aria-label="Next"
                className="w-11 h-11 rounded-full border border-black/15 flex items-center justify-center hover:bg-black/[0.04] transition-colors"
                style={{ color: "#1E1E1E" }}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Video + info grid ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-8 xl:gap-12 items-center">

          {/* Video container — stadium card, Mastercard Image 1 style */}
          <div
            className={cn(
              "relative aspect-video rounded-[40px] overflow-hidden cursor-pointer group",
              "bg-[#1A1A1A] shadow-card"
            )}
            onClick={togglePlay}
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
              onEnded={() => setPlaying(false)}
              className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Play / Pause overlay */}
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
                playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
              )}
            >
              <div className="w-[72px] h-[72px] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-[0_8px_40px_rgba(0,0,0,0.28)] transition-transform duration-200 group-hover:scale-105">
                {playing ? (
                  <Pause className="w-6 h-6" style={{ color: "#1E1E1E" }} />
                ) : (
                  <Play className="w-6 h-6 ml-1" style={{ color: "#1E1E1E" }} />
                )}
              </div>
            </div>

            {/* Gold brand dot — top-left corner accent */}
            <div
              className="absolute top-4 left-4 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "#C5B27A" }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#1E1E1E" }} />
            </div>
          </div>

          {/* Info panel */}
          <div className="flex flex-col">
            <span className="eyebrow block mb-5">{slide.eyebrow}</span>

            <h3
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: "clamp(26px, 2.5vw, 36px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#1E1E1E",
                whiteSpace: "pre-line",
                marginBottom: "16px",
              }}
            >
              {slide.headline}
            </h3>

            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.7,
                color: "#454545",
                marginBottom: "28px",
              }}
            >
              {slide.description}
            </p>

            <Link
              href={slide.href}
              className="inline-flex items-center gap-2 font-semibold transition-colors hover:opacity-70"
              style={{ fontSize: "14px", color: "#1E1E1E" }}
            >
              {slide.ctaLabel}
              <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Dot indicators — only when >1 slide */}
            {multiSlide && (
              <div className="flex items-center gap-2 mt-8 pt-8 border-t border-black/[0.06]">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); goTo(i); }}
                    aria-label={`Go to slide ${i + 1}`}
                    className={cn(
                      "rounded-full transition-all duration-300 focus-visible:outline-none",
                      i === current
                        ? "w-6 h-2"
                        : "w-2 h-2 hover:opacity-60"
                    )}
                    style={{
                      backgroundColor: i === current ? "#C5B27A" : "#1E1E1E",
                      opacity: i === current ? 1 : 0.2,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
