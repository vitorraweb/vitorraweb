"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRotation } from "@/lib/kiosk";

/* ─── The stage ────────────────────────────────────────────────────────────
   The reception screen is a brand stage, not a dashboard: the media runs
   full-bleed to all four edges and everything else floats over it. Each
   business line runs its own film. Borrowing one line's film for another put
   an engine bay behind a coffee caption, which read as a mistake. The still
   path below is kept because it is how a sector runs before its footage
   exists — all four have footage today.

   Films are all mounted at once and cross-faded so a change never shows a
   black frame mid-buffer, and only the visible one plays — this runs all day
   on modest front-desk hardware. Posters cover the ten-odd seconds a cold
   start spends buffering.
   ─────────────────────────────────────────────────────────────────────────── */

type Media =
  | { kind: "film"; src: string; poster: string; grade?: string }
  | { kind: "still"; src: string; grade?: string };

type Sector = {
  index: string;
  tag: string;
  media: Media;
  headline: string;
  accent: string;
  body: string;
  proof?: string;
};

const SECTORS: Sector[] = [
  {
    index: "01",
    tag: "Fuel Eco Tech",
    media: { kind: "film", src: "/videos/fet-hero.mp4", poster: "/videos/fet-hero-poster.jpg" },
    headline: "A verified",
    accent: "13.9% fuel reduction",
    body: "Independently tested by CTI GmbH, Germany — VW T5 fleet, November 2025.",
    proof: "Measured, not estimated",
  },
  {
    index: "02",
    tag: "SEAL Wound Spray",
    media: { kind: "film", src: "/videos/seal-hero.mp4", poster: "/videos/seal-hero-poster.jpg" },
    headline: "FDA-cleared,",
    accent: "field\u2011proven hemostatic care", // non-breaking hyphen: never split across lines
    body: "Chitosan-based rapid bleeding control — field-deployed with Maryland EMS.",
    proof: "US 510(k) cleared",
  },
  {
    index: "03",
    tag: "Vitorra Coffee",
    media: {
      kind: "film",
      src: "/videos/coffee-hero.mp4",
      poster: "/videos/coffee-hero-poster.jpg",
      /* Shot high-key on near-white for a product page. Left ungraded it blows
         out next to the other three and the white headline dies on it, so it
         is brought down and warmed to sit in the same world. */
      grade: "brightness(0.42) contrast(1.18) saturate(1.25) sepia(0.22)",
    },
    headline: "Ugandan coffee,",
    accent: "graded and exported at origin",
    body: "Farm-direct sourcing across Uganda's highlands, held to export standard.",
    proof: "Export grade",
  },
  {
    index: "04",
    tag: "Logistics",
    media: { kind: "film", src: "/videos/logistics-hero.mp4", poster: "/videos/logistics-hero-poster.jpg" },
    headline: "Dependable freight,",
    accent: "port to door across East Africa",
    body: "Warehousing, customs clearance, and delivery for B2B partners regionwide.",
    proof: "Regionwide",
  },
];

const ROTATE_MS = 9000;
const CROSSFADE_MS = 1400;

/* Media is hoisted out so the <video> elements keep a stable identity across
   rotations — remounting one would restart the download.

   Each layer carries the index of the sector it belongs to. It used to be
   matched by file path instead, which worked only because every sector happens
   to hold a film today: the moment one is a still, `flatMap` shortens the list
   and every layer after it answers to the wrong sector. Carrying the index
   removes that trap rather than relying on nobody tripping it. */
type Layer<T> = { media: T; sector: number };

const FILMS: Layer<Extract<Media, { kind: "film" }>>[] = SECTORS.flatMap((s, i) =>
  s.media.kind === "film" ? [{ media: s.media, sector: i }] : []
);
const STILLS: Layer<Extract<Media, { kind: "still" }>>[] = SECTORS.flatMap((s, i) =>
  s.media.kind === "still" ? [{ media: s.media, sector: i }] : []
);

/* One rotation index, shared. The media bed and the headline are rendered in
   different places in the layout — the bed is a full-bleed backdrop, the
   headline sits in the content grid — but a screen whose caption disagrees
   with its footage is worse than either alone, so they read the same counter
   rather than each running their own. */
const RotationContext = createContext(0);

export function KioskStageProvider({ children }: { children: React.ReactNode }) {
  const index = useRotation(SECTORS.length, ROTATE_MS);
  return <RotationContext.Provider value={index}>{children}</RotationContext.Provider>;
}

export function KioskSpotlight() {
  const index = useContext(RotationContext);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);

  /* The incoming film has to be the layer on top, and that cannot come from
     document order.

     The films are stacked siblings with no z-index, so paint order was fixed by
     the order they are written: Fuel Eco Tech at the bottom, Logistics on top.
     Only the active layer was opaque, so each dissolve ran the incoming film up
     from zero while the outgoing one ran down — and which of the two you
     actually saw depended on the direction of travel. Going forward the
     incoming film is written later, so it covers the one it replaces. On the
     wrap from Logistics back to Fuel Eco Tech it is written *first*, so it
     faded in underneath, and Logistics held the screen while the caption,
     index and dwell bar had all already moved on to Fuel Eco Tech. That is the
     one transition in the loop that shows the previous sector's footage under
     the next sector's words.

     So the stage keeps two layers and promotes by state, not by position: the
     sector coming in sits above the one going out and fades over it, whichever
     direction the loop travels. The outgoing layer stays fully opaque
     underneath for the length of the fade rather than fading out, so the two
     are never both part-transparent at once — previously that let a third
     sector show through from below, and it is why a layer is given its own
     poster as a background further down. Every other layer is parked at zero,
     so the film on screen is the only one that can be seen. */
  const [stage, setStage] = useState({ incoming: index, outgoing: index });
  if (stage.incoming !== index) {
    setStage({ incoming: index, outgoing: stage.incoming });
  }

  const depth = (sector: number) =>
    sector === stage.incoming ? 2 : sector === stage.outgoing ? 1 : 0;

  useEffect(() => {
    /* The outgoing film keeps running while it is still visible beneath the
       incoming one — pausing it on the spot freezes a still mid-dissolve. */
    const stopOutgoing = window.setTimeout(() => {
      const el = videos.current[stage.outgoing];
      if (el && stage.outgoing !== stage.incoming) el.pause();
    }, CROSSFADE_MS);

    FILMS.forEach(({ sector }) => {
      const el = videos.current[sector];
      if (!el) return;

      if (sector === stage.incoming) {
        /* Open on the first frame. A film resumed from wherever it was paused
           shows its middle, and a long-paused layer may have had its buffer
           reclaimed — seeking to zero re-primes it instead of waiting on a
           frame that is no longer held. */
        try {
          if (el.currentTime > 0) el.currentTime = 0;
        } catch {
          /* Seeking before metadata lands throws; it plays from the top anyway. */
        }
        void el.play().catch(() => {
          /* Autoplay blocked — the poster still shows the brand. */
        });
      } else if (sector !== stage.outgoing) {
        el.pause();
      }
    });

    return () => window.clearTimeout(stopOutgoing);
  }, [stage]);

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      {/* ── Media bed ──────────────────────────────────────────────────────
          Held in its own stacking context. The layers below order themselves
          with z-index, and without `isolate` a positive z-index would outrank
          every scrim after it — the footage would sit on top of the gradient
          that makes the headline readable. Contained here, the scrims still win
          on document order.                                                */}
      <div className="absolute inset-0" style={{ zIndex: 0, isolation: "isolate" }}>
      {FILMS.map(({ media: film, sector }) => (
        <video
          key={film.src}
          ref={(el) => {
            videos.current[sector] = el;
          }}
          data-src={film.src}
          src={film.src}
          poster={film.poster}
          autoPlay={sector === 0}
          muted
          loop
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ease-in-out"
          style={{
            /* Opaque while incoming or outgoing; the z-index decides which of
               the two is seen, so the one going out never dissolves to reveal a
               sector below it. */
            opacity: depth(sector) > 0 ? 1 : 0,
            zIndex: depth(sector),
            /* Parked layers are hidden outright, not merely transparent. A
               playing video gets its own compositing layer, and a layer left at
               `opacity: 0` is still a layer the compositor owns — on hardware
               we do not control, and cannot watch, that is a thing that can go
               on being drawn. `hidden` takes it out of the picture altogether
               while leaving the element, its buffer and its position intact, so
               the only films that can reach the screen are the two in the
               dissolve. It is not transitioned, but it never needs to be: a
               layer only parks underneath one that is already opaque. */
            visibility: depth(sector) > 0 ? "visible" : "hidden",
            filter: film.grade,
            /* The poster is also painted behind the element, not just set as the
               `poster` attribute. A browser drops decoded video for a hidden tab,
               so a TV waking from sleep can have the sector on screen holding no
               frame — and a transparent layer shows the film stacked beneath it,
               which looks exactly like the caption disagreeing with the footage.
               This way a layer with nothing to draw still draws its own sector. */
            backgroundImage: `url(${film.poster})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}
      {STILLS.map(({ media: still, sector }) => {
        const on = sector === stage.incoming;
        return (
          <div
            key={still.src}
            className="absolute inset-0 transition-opacity duration-[1400ms] ease-in-out"
            style={{
              opacity: depth(sector) > 0 ? 1 : 0,
              zIndex: depth(sector),
              visibility: depth(sector) > 0 ? "visible" : "hidden",
            }}
          >
            <Image
              src={still.src}
              alt=""
              fill
              sizes="100vw"
              priority={false}
              className="object-cover"
              style={{
                animation: on ? "vitorra-ken-burns 22s ease-out both" : "none",
                transformOrigin: "60% 45%",
                filter: still.grade,
              }}
            />
          </div>
        );
      })}
      </div>

      {/* ── Cinematic scrim ────────────────────────────────────────────────
          Three layers rather than one flat wash: a left-weighted ramp that
          guarantees contrast under the headline column, a floor for the
          ticker, and a soft ceiling for the header. The footage keeps its
          mid-tones on the right instead of being blacked out.             */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(100deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.82) 26%, rgba(10,10,10,0.42) 52%, rgba(10,10,10,0.30) 100%)" }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[42%]"
        style={{ background: "linear-gradient(to top, rgba(8,8,8,0.92) 0%, rgba(8,8,8,0.35) 55%, transparent 100%)" }}
      />
      <div
        className="absolute inset-x-0 top-0 h-[30%]"
        style={{ background: "linear-gradient(to bottom, rgba(8,8,8,0.80) 0%, rgba(8,8,8,0.25) 60%, transparent 100%)" }}
      />
      {/* Vignette — keeps the eye centred, the way a projected image falls off */}
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(130% 100% at 62% 45%, transparent 38%, rgba(0,0,0,0.42) 100%)" }}
      />
      <div className="hero-aurora-right" />
      <div className="hero-grain" />
    </div>
  );
}

/* ─── The headline block ───────────────────────────────────────────────────
   Exported separately so the page can place it inside the content grid while
   the media above stays a true full-bleed backdrop. It drives its own
   rotation on the same interval, so the two stay in step.
   ─────────────────────────────────────────────────────────────────────────── */
export function KioskHeadline() {
  const index = useContext(RotationContext);
  const active = SECTORS[index];

  return (
    <div className="max-w-[58ch]">
      {/* Numbered index + rule — editorial, and it says how long the loop is */}
      <div key={`idx-${index}`} className="hero-enter flex items-center gap-4 mb-7">
        <span
          className="font-numeric"
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "#C5B27A" }}
        >
          {active.index}
          <span style={{ color: "rgba(255,255,255,0.32)" }}> / {String(SECTORS.length).padStart(2, "0")}</span>
        </span>
        <span className="h-px w-14" style={{ background: "linear-gradient(90deg, #C5B27A, rgba(197,178,122,0))" }} />
        <span
          style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.88)" }}
        >
          {active.tag}
        </span>
      </div>

      <h2
        key={`h-${index}`}
        className="hero-enter"
        style={{
          fontFamily: "var(--font-playfair, 'Cormorant Garamond', Georgia, serif)",
          fontSize: "clamp(40px, 4.6vw, 78px)",
          fontWeight: 300,
          letterSpacing: "-0.025em",
          lineHeight: 1.04,
          color: "#FFFFFF",
          textWrap: "balance",
        }}
      >
        {active.headline}{" "}
        <em className="text-gold-gradient" style={{ fontStyle: "italic", fontWeight: 500 }}>
          {active.accent}
        </em>
      </h2>

      <div key={`b-${index}`} className="hero-enter hero-enter-2 mt-6 flex items-start gap-5">
        {active.proof && (
          <span
            className="shrink-0 mt-0.5 px-3.5 py-1.5 rounded-full whitespace-nowrap"
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#0E0E0E",
              background: "#C5B27A",
            }}
          >
            {active.proof}
          </span>
        )}
        <p style={{ fontSize: "clamp(15px, 1.15vw, 19px)", lineHeight: 1.6, color: "rgba(255,255,255,0.74)" }}>
          {active.body}
        </p>
      </div>

      {/* Dwell progress — four rules that fill in turn, so the screen reads as
          deliberate rather than stalled. */}
      <div className="mt-10 flex items-center gap-2.5">
        {SECTORS.map((s, i) => (
          <div key={s.index} className="h-[3px] w-16 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.18)" }}>
            {i === index && (
              <div
                key={`fill-${index}`}
                className="h-full rounded-full"
                style={{ background: "#C5B27A", animation: `kiosk-dwell ${ROTATE_MS}ms linear both` }}
              />
            )}
            {i < index && <div className="h-full rounded-full" style={{ background: "rgba(197,178,122,0.45)" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}
