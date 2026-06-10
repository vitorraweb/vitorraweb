"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ArrowRight, ArrowUpRight, VolumeX, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS } from "@/lib/constants";

/* ─── Sector registry ─────────────────────────────────────────────────────────
   Cinematic single hero (Apple / Mastercard / Stripe). NO auto-rotation.
   One anchored brand statement + a persistent sector rail the visitor clicks to
   swap the hero. All sectors are visible at once → breadth grasped instantly.

   Background is resolved from each sector's `media`:
   - { type: "video" }   → full-bleed video + Ken Burns (FET today)
   - { type: "image" }   → full-bleed still + overlay (SEAL today)
   - { type: "gradient" }→ branded gold-on-charcoal panel + ghost watermark
                           (Coffee / Logistics / Overview — never looks unfinished)

   To upgrade a sector's media: drop the file in public/ and change its `media`
   field (e.g. gradient → video). No other code changes needed.
   ─────────────────────────────────────────────────────────────────────────── */

type Media =
  | { type: "video"; src: string; poster: string }
  | { type: "image"; src: string; priority?: boolean }
  | { type: "gradient" };

/* Structural config only — all display copy lives in the `hero` messages,
   keyed by sector id. Watermarks are brand terms and stay literal. */
type Sector = {
  id: string;
  secondaryHref: string;
  watermark: string; // ghost text for gradient panels (brand, untranslated)
  media: Media;
};

const SECTORS: Sector[] = [
  {
    id: "overview",
    secondaryHref: "/about",
    watermark: "Vitorra",
    media: { type: "image", src: "/hero/overview.png", priority: true },
  },
  {
    id: "fet",
    secondaryHref: `/products/${PRODUCTS.FET}`,
    watermark: "FET",
    media: { type: "video", src: "/videos/fet.mp4", poster: "/videos/fet-poster.jpg" },
  },
  {
    id: "seal",
    secondaryHref: `/products/${PRODUCTS.SEAL}`,
    watermark: "SEAL",
    media: { type: "image", src: "/hero/seal.png" },
  },
  {
    id: "coffee",
    secondaryHref: `/products/${PRODUCTS.COFFEE}`,
    watermark: "Coffee",
    media: { type: "image", src: "/hero/coffee.png" },
  },
  {
    id: "logistics",
    secondaryHref: `/products/${PRODUCTS.LOGISTICS}`,
    watermark: "Logistics",
    media: { type: "image", src: "/hero/logistics.png" },
  },
];

/* ─── Component ─────────────────────────────────────────────────────────────── */

/* How long each non-video sector stays before auto-advancing (ms). Video
   sectors advance when the clip ends. */
const SLIDE_DURATION = 6500;

export default function Hero() {
  const t = useTranslations("hero");
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-advance machinery — kept in refs so the rAF loop never re-renders.
  const indexRef = useRef(0);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const lastTsRef = useRef(0);
  const rafRef = useRef(0);
  const reducedRef = useRef(false);
  const progressRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const active = SECTORS[index];
  const activeIsVideo = active.media.type === "video";

  const setBar = (i: number, p: number) => {
    const el = progressRefs.current[i];
    if (el) el.style.transform = `scaleX(${p})`;
  };

  const goTo = useCallback((idx: number) => {
    setBar(indexRef.current, 0);
    indexRef.current = idx;
    elapsedRef.current = 0;
    lastTsRef.current = 0;
    if (reducedRef.current) setBar(idx, 1);
    setIndex(idx);
  }, []);

  /* ── Auto-advance loop (rAF). Video sectors are driven by the clip; other
        sectors by a timer. Pauses while the hero is hovered. ───────────────── */
  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedRef.current) {
      setBar(0, 1); // static full indicator, no motion
      return;
    }
    const loop = (ts: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (lastTsRef.current === 0) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;
      if (pausedRef.current) return;

      const i = indexRef.current;
      if (SECTORS[i].media.type === "video") {
        const v = videoRef.current;
        if (v && v.duration) setBar(i, Math.min(1, v.currentTime / v.duration));
        // advancement handled by the video's onEnded
      } else {
        elapsedRef.current += dt;
        const p = Math.min(1, elapsedRef.current / SLIDE_DURATION);
        setBar(i, p);
        if (p >= 1) goTo((i + 1) % SECTORS.length);
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [goTo]);

  /* ── Play the active video on sector change; keep muted state in sync ── */
  useEffect(() => {
    const video = videoRef.current;
    if (activeIsVideo && video) {
      video.currentTime = 0;
      video.muted = muted;
      if (!pausedRef.current) video.play().catch(() => {});
    }
  }, [index, activeIsVideo, muted]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  /* ── Pause/resume on hover (desktop). Touch has no hover → keeps playing. */
  const setPaused = (state: boolean) => {
    pausedRef.current = state;
    const v = videoRef.current;
    if (SECTORS[indexRef.current].media.type === "video" && v) {
      if (state) v.pause();
      else v.play().catch(() => {});
    }
  };

  /* ── Swipe to change sector (mobile). Ignores swipes that begin on the
        sector rail so its horizontal scroll still works. ──────────────────── */
  const touchStart = useRef<{ x: number; y: number; onRail: boolean } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const tt = e.touches[0];
    const onRail = !!(e.target as HTMLElement).closest?.('[role="tablist"]');
    touchStart.current = { x: tt.clientX, y: tt.clientY, onRail };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touchStart.current;
    touchStart.current = null;
    if (!s || s.onRail) return;
    const tt = e.changedTouches[0];
    const dx = tt.clientX - s.x;
    const dy = tt.clientY - s.y;
    // Only count a deliberate, mostly-horizontal swipe.
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    const i = indexRef.current;
    goTo(dx < 0 ? (i + 1) % SECTORS.length : (i - 1 + SECTORS.length) % SECTORS.length);
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "92vh", backgroundColor: "#161616" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Persistent gold aurora — right-side glow visible on all sectors ── */}
      <div aria-hidden="true" className="hero-aurora-right" />

      {/* ── Film grain texture — adds tactility on high-DPI screens ────────── */}
      <div aria-hidden="true" className="hero-grain" />

      {/* ── Background layers — cross-fade, only active one visible ───────── */}
      {SECTORS.map((s, i) => {
        const isActive = i === index;
        return (
          <div
            key={s.id}
            aria-hidden={!isActive}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: isActive ? 1 : 0, pointerEvents: "none" }}
          >
            <SectorBackground
              sector={s}
              active={isActive}
              videoRef={s.media.type === "video" && isActive ? videoRef : undefined}
              muted={muted}
              onEnded={() => goTo((indexRef.current + 1) % SECTORS.length)}
            />
          </div>
        );
      })}

      {/* ── Foreground: content (bottom-left) + sector rail ───────────────── */}
      <div className="absolute inset-0 z-10 flex flex-col justify-end">
        <div className="max-w-[1200px] mx-auto w-full px-6 md:px-12 lg:px-20 pt-36 pb-10 md:pb-12">
          {/* keyed by index so the entrance animation replays on each switch */}
          <HeroContent key={active.id} sector={active} t={t} />

          {/* ── Sector rail (persistent + progress indicators) ──────────── */}
          <div
            role="tablist"
            aria-label={t("sectorsLabel")}
            className="mt-10 md:mt-12 flex items-center gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden no-scrollbar pt-5"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            {SECTORS.map((s, i) => {
              const isActive = i === index;
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => goTo(i)}
                  className="relative shrink-0 px-3 sm:px-4 py-2 text-sm font-semibold transition-colors duration-200 whitespace-nowrap"
                  style={{ color: isActive ? "#FFFFFF" : "rgba(255,255,255,0.55)", letterSpacing: "-0.01em" }}
                >
                  {t(`sectors.${s.id}.tab`)}
                  {/* progress track + gold fill (auto-advance indicator) */}
                  <span
                    aria-hidden="true"
                    className="absolute left-3 right-3 sm:left-4 sm:right-4 bottom-0 h-[2px] rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.18)" }}
                  >
                    <span
                      ref={(el) => { progressRefs.current[i] = el; }}
                      className="block h-full w-full rounded-full"
                      style={{ background: "#C5B27A", transformOrigin: "left", transform: "scaleX(0)" }}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Mute toggle — only while a video is the active background ─────── */}
      {activeIsVideo && (
        <button
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? t("unmute") : t("mute")}
          className="absolute top-28 right-4 md:right-8 z-20 flex items-center justify-center w-9 h-9 rounded-full transition-all hover:scale-105"
          style={{ background: "rgba(255,255,255,0.15)", color: "#FFFFFF", backdropFilter: "blur(8px)" }}
        >
          {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}
    </section>
  );
}

/* ─── Foreground content ──────────────────────────────────────────────────── */

function HeroContent({
  sector,
  t,
}: {
  sector: Sector;
  t: ReturnType<typeof useTranslations>;
}) {
  const anim = (n: number) => `hero-enter hero-enter-${n}`;
  const accent = t(`sectors.${sector.id}.headlineAccent`);
  return (
    <div className="max-w-3xl">
      <span className={cn("eyebrow-light mb-5 inline-flex", anim(1))}>
        {t(`sectors.${sector.id}.eyebrow`)}
      </span>

      <h1
        className={cn("mb-5", anim(2))}
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: "clamp(38px, 5.2vw, 66px)",
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1.06,
          color: "#FFFFFF",
          whiteSpace: "pre-line",
        }}
      >
        {t(`sectors.${sector.id}.headlineLead`)}
        {accent && (
          <>
            {" "}
            <span className="text-gold-shimmer">{accent}</span>
          </>
        )}
      </h1>

      <p
        className={cn("mb-8 max-w-xl", anim(3))}
        style={{ fontSize: "16px", lineHeight: 1.7, color: "rgba(255,255,255,0.65)" }}
      >
        {t(`sectors.${sector.id}.body`)}
      </p>

      <div className={cn("flex flex-col sm:flex-row gap-3", anim(4))}>
        <Link href="/enquire" className="btn-primary">
          {t("primaryCta")}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href={sector.secondaryHref} className="btn-ghost-dark">
          {t(`sectors.${sector.id}.secondaryLabel`)}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

/* ─── Background ──────────────────────────────────────────────────────────── */

/* Dark gradient base shared by every sector — guarantees text legibility and a
   premium "cinema" feel even with no photography. */
const BASE_GRADIENT = "linear-gradient(160deg, #181818 0%, #242424 100%)";
/* Bottom-weighted overlay so the bottom-left content stays readable over media. */
const MEDIA_OVERLAY =
  "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%)";

function SectorBackground({
  sector,
  active,
  videoRef,
  muted,
  onEnded,
}: {
  sector: Sector;
  active: boolean;
  videoRef?: React.RefObject<HTMLVideoElement | null>;
  muted: boolean;
  onEnded?: () => void;
}) {
  const { media } = sector;

  if (media.type === "video") {
    return (
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          src={media.src}
          poster={media.poster}
          preload="metadata"
          playsInline
          muted={muted}
          onEnded={active ? onEnded : undefined}
          className="absolute inset-0 w-full h-full object-cover"
          style={active ? { animation: "vitorra-ken-burns 14s ease-out both" } : undefined}
        />
        <div className="absolute inset-0" style={{ background: MEDIA_OVERLAY }} />
      </div>
    );
  }

  if (media.type === "image") {
    return (
      <div className="absolute inset-0">
        {/* Ken Burns lives on the wrapper so next/image stays optimised */}
        <div
          className="absolute inset-0"
          style={active ? { animation: "vitorra-ken-burns 14s ease-out both" } : undefined}
        >
          <Image
            src={media.src}
            alt=""
            fill
            priority={media.priority}
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0" style={{ background: MEDIA_OVERLAY }} />
      </div>
    );
  }

  /* gradient — branded gold-on-charcoal panel + ghost watermark */
  return (
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(circle at 22% 18%, rgba(197,178,122,0.16) 0%, transparent 55%), ${BASE_GRADIENT}`,
      }}
    >
      <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none select-none">
        <span
          className="ghost-text-dark"
          style={{ paddingLeft: "clamp(24px, 5vw, 80px)", whiteSpace: "nowrap" }}
        >
          {sector.watermark}
        </span>
      </div>
    </div>
  );
}
