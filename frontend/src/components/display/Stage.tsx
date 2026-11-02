"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { API_BASE_URL, CONTACT_PHONE } from "@/lib/constants";
import { useKioskClock, useKioskFx, useKioskHeadlines, useKioskWeather, weatherEntry } from "@/lib/kiosk";
import { CREDENTIALS, FILMS, MONTAGE, MOMENT_STARTS, SECTORS, STILLS, TICKER_LINES, daypartAt, durationOf, storyFor, type Daypart, type Mode, type Moment, type ReelScene, type Scene, type SectorScene, type Still, type Wash } from "./scenes";

/* ─── The stage ───────────────────────────────────────────────────────────────
   A full-screen loop for the reception TV and the street-facing screen.

   - The picture is composed for 1920×1080. It is a true 16:9 stage, centred
     with black bars on any other shape of screen, and everything inside is
     sized in cqmin (1cqmin = 10.8px at 1080p), so 1080p and 4K panels show
     exactly the same composition.
   - Films are all mounted once and cross-faded; only the visible one plays,
     so the loop never shows a black frame and modest hardware keeps up.
   - Each scene's text is re-keyed on entry, so its rise-in plays every loop.
   - Burn-in care for a screen that never sleeps: the overlay drifts a few
     pixels every three minutes, invisibly.
   ─────────────────────────────────────────────────────────────────────────── */

type Welcome = { name: string; line: string } | null;

const DRIFT = [[0, 0], [3, -2], [-2, 3], [2, 2], [-3, -1]];

/* Colour tokens. Reception is a dim lobby; the street screen competes with
   daylight, so it gets brighter type and gold, but stays dark: saturated colour
   on near-black holds up in sun and never becomes a white glare after dark. */
const THEMES = {
  reception: { "--vx-bg": "#09090A", "--vx-fg": "#F4EFE6", "--vx-gold": "#C5B27A", "--vx-muted": "rgba(244,239,230,0.72)", "--vx-track": "rgba(244,239,230,0.16)", "--vx-line": "rgba(197,178,122,0.35)" },
  street:    { "--vx-bg": "#0E0E10", "--vx-fg": "#FFFFFF", "--vx-gold": "#EED596", "--vx-muted": "rgba(255,255,255,0.9)", "--vx-track": "rgba(255,255,255,0.3)", "--vx-line": "rgba(238,213,150,0.6)" },
  /* Projector in a corridor with daylight on the wall: outside light lifts
     every dark area towards grey, so only full-strength colours survive —
     pure white, pure black, a saturated gold, and no pale "muted" greys. */
  projector:      { "--vx-bg": "#000000", "--vx-fg": "#FFFFFF", "--vx-gold": "#FFCC33", "--vx-muted": "#FFFFFF", "--vx-track": "rgba(255,255,255,0.4)", "--vx-line": "#FFCC33" },
} as const;

export function Stage({ mode, pin, at, hold, turn }: { mode: Mode; pin?: string | null; at?: Daypart | null; hold?: number | null; turn?: number }) {
  return (
    <div className="fixed inset-0 grid place-items-center" style={{ background: "#000" }}>
      {/* The 1920×1080 frame: everything inside measures itself against this box. */}
      <div className="relative overflow-hidden" style={{ width: "min(100vw, 177.778vh)", height: "min(100vh, 56.25vw)", containerType: "size" }}>
        {pin === "check" ? <ProjectorCheck /> : <Loop mode={mode} pin={pin} at={at} hold={hold} turn={turn} />}
      </div>
    </div>
  );
}

function Loop({ mode, pin, at, hold, turn = 0 }: { mode: Mode; pin?: string | null; at?: Daypart | null; hold?: number | null; turn?: number }) {
  const welcome = useWelcome(mode);
  const story = useMemo(() => storyFor(mode, !!welcome), [mode, welcome]);
  const [i, setI] = useState(0);
  const [loop, setLoop] = useState(0);
  const pinned = pin ? story.findIndex((s) => s.id === pin) : -1;
  const index = pinned >= 0 ? pinned : i % story.length;
  const scene = story[index];
  const seconds = durationOf(scene, mode);

  const adverts = useAdverts(mode);
  const played = useRef<Record<number, number>>({});
  const [ad, setAd] = useState<Advert | null>(null);

  const advance = useCallback(() => {
    setI((n) => (n + 1) % story.length);
    if (index === story.length - 1) setLoop((l) => l + 1);
  }, [index, story.length]);

  // Paid adverts go between scenes, never over one, each at its booked rate.
  useEffect(() => {
    if (pinned >= 0 || ad) return;
    const t = setTimeout(() => {
      const due = dueAdvert(adverts, played.current, Date.now());
      if (due) { played.current[due.id] = Date.now(); setAd(due); }
      else advance();
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [index, seconds, pinned, ad, adverts, advance]);

  const endAd = useCallback(() => { setAd(null); advance(); }, [advance]);

  const [drift, setDrift] = useState(0);
  useEffect(() => { const t = setInterval(() => setDrift((d) => (d + 1) % DRIFT.length), 180_000); return () => clearInterval(t); }, []);
  const [dx, dy] = DRIFT[drift];

  const moment = useMoment(`${scene.id}-${loop}`, seconds, hold);
  const daypart = useDaypart(at);

  const street = mode === "street";
  const projector = mode === "projector";
  // Bright modes (street, projector) share the big type and brighter films.
  const big = mode !== "reception";
  const activeSector = scene.kind === "sector" || scene.kind === "reel" ? scene.id : null;
  const theme = projector ? THEMES.projector : street ? THEMES.street : THEMES.reception;
  const accent = scene.kind === "sector" || scene.kind === "reel" ? scene.accent : theme["--vx-gold"];
  // What this moment puts behind the words: the film, or its own photograph.
  const look = scene.kind === "sector" ? lookOf(scene, moment, daypart, loop + turn) : null;

  return (
    <div className="vx absolute inset-0 overflow-hidden select-none cursor-none" data-mode={mode} data-daypart={daypart}
      style={{ ...theme, "--vx-accent": accent, background: "var(--vx-bg)", color: "var(--vx-fg)", transition: "background-color 1.2s ease, color 1.2s ease" } as unknown as React.CSSProperties}>
      <Backdrops activeSector={activeSector} kind={scene.kind} seconds={seconds} street={big} projector={projector} moment={moment} look={look} night={daypart === "night"} />
      <div className="hero-grain absolute inset-0 pointer-events-none" style={{ opacity: projector ? 0 : street ? 0.025 : 0.035 }} />
      <ScreenCare />
      {ad && <AdvertFilm ad={ad} onEnd={endAd} />}

      {/* The whole overlay — story and information band — drifts together
          against burn-in. Projectors usually crop the edges (overscan), so
          their safe area is wider. */}
      <div className="relative z-10 h-full flex flex-col" style={{ translate: `${dx}px ${dy}px`, transition: "translate 4s ease" }}>
      <div className="flex-1 min-h-0 flex flex-col" style={{ padding: projector ? "6.5cqmin 7.5cqmin 1.6cqmin" : "3.4cqmin 5cqmin 1.4cqmin", textShadow: street && !projector ? "0 0.25cqmin 1.6cqmin rgba(0,0,0,0.5)" : undefined }}>
        <TopBar hidden={scene.kind === "ident"} />
        <div key={`${scene.id}-${loop}`} className="relative flex-1 min-h-0 flex" style={{ visibility: ad ? "hidden" : undefined }}>
          {scene.kind === "ident" && <Ident />}
          {scene.kind === "welcome" && welcome && <WelcomeScene welcome={welcome} />}
          {scene.kind === "reel" && <ReelView r={scene} street={big} panel={projector} />}
          {scene.kind === "sector" && <SectorView s={scene} moment={moment} daypart={daypart} turn={loop + turn} road={street} />}
          {scene.kind === "proof" && <Proof seconds={seconds} />}
          {scene.kind === "visit" && <Visit panel={projector} road={street} />}
        </div>
        <Progress story={story} index={index} seconds={seconds} loop={loop} />
      </div>
      <UtilityBar big={big} inset={projector ? "7.5cqmin" : "5cqmin"} />
      </div>
    </div>
  );
}

/* ── Backgrounds: films for the businesses, a living gold field for the rest ── */

function Backdrops({ activeSector, kind, seconds, street, projector = false, moment, look, night }: { activeSector: string | null; kind: Scene["kind"]; seconds: number; street: boolean; projector?: boolean; moment: number; look: Still | null; night: boolean }) {
  const sector = SECTORS.find((s) => s.id === activeSector);
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    for (const s of FILMS) {
      const v = videos.current[s.id];
      if (!v) continue;
      if (s.id === activeSector) { v.currentTime = 0; void v.play().catch(() => {}); }
      else v.pause();
    }
  }, [activeSector]);

  const t = sector?.tint ?? "0,0,0";
  const wash = look?.wash ?? (sector && moment > 0 ? "left" : "none");
  const WASHES: Record<Exclude<Wash, "none">, string> = {
    left: `linear-gradient(90deg, rgba(${t},0.95) 0%, rgba(${t},0.78) 36%, rgba(${t},0.2) 64%, rgba(${t},0) 84%)`,
    bottom: `linear-gradient(0deg, rgba(${t},0.94) 0%, rgba(${t},0.66) 34%, rgba(${t},0) 66%)`,
    full: sector ? `radial-gradient(70% 90% at 72% 40%, ${sector.accent}38 0%, rgba(${t},0) 70%), rgb(${t})` : "#000",
  };

  return (
    <div className="absolute inset-0">
      {/* Brand field: welcome and credentials, a gold glow on black */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "welcome" || kind === "proof" ? 1 : 0 }}>
        <div className="vx-aurora absolute -inset-[20%]" />
      </div>

      {/* Ident: Kampala, the port and the roaster pass faintly behind the name */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "ident" ? 1 : 0, background: "#05070D" }}>
        {MONTAGE.map((src, n) => (
          <div key={`${src}-${kind === "ident"}`} className={kind !== "ident" ? "absolute inset-0 opacity-0" : n === MONTAGE.length - 1 ? "vx-montage vx-montage-last absolute inset-0" : "vx-montage absolute inset-0"} style={{ ["--d" as string]: `${(n * seconds) / MONTAGE.length}s`, ["--dur" as string]: `${seconds / MONTAGE.length + 1.4}s` }}>
            <Image src={src} alt="" fill sizes="100vw" loading="eager" className="object-cover vx-kenburns" style={{ objectPosition: n === 0 ? "50% 78%" : "50% 50%", filter: "brightness(0.5) contrast(1.24) saturate(0.9)", ["--dur" as string]: "12s" }} />
          </div>
        ))}
      </div>

      {/* Visit: the building itself */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "visit" ? 1 : 0 }}>
        <Image src="/photos/company-A-head-office.jpg" alt="" fill sizes="100vw" priority={false}
          className={kind === "visit" ? "object-cover vx-kenburns" : "object-cover"} style={{ filter: "brightness(0.66) contrast(1.1) saturate(1.1)", ["--dur" as string]: `${seconds}s` }} />
      </div>

      {FILMS.map((s) => (
        <div key={s.id} className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: activeSector === s.id ? 1 : 0 }}>
          {/* A feature reel plays once, uncropped and ungraded (it is already
              finished film); the business films loop under a slow push-in. */}
          <video
            ref={(el) => { videos.current[s.id] = el; }}
            src={s.film} poster={s.poster} muted loop={!s.reel} playsInline preload="auto"
            className={`absolute inset-0 h-full w-full object-cover ${activeSector === s.id && !s.reel ? "vx-kenburns" : ""}`}
            style={{ filter: s.reel ? (projector ? "brightness(1.18) contrast(1.12) saturate(1.2)" : s.grade ?? (street ? "brightness(1.1) saturate(1.1)" : undefined)) : projector ? "brightness(1) contrast(1.28) saturate(1.35)" : street ? s.streetGrade ?? "brightness(0.95) contrast(1.08) saturate(1.12)" : s.grade ?? "brightness(0.86) contrast(1.06) saturate(1.08)", ["--dur" as string]: `${seconds}s` }}
          />
        </div>
      ))}

      {/* Each message's own photograph, all loaded up front */}
      {STILLS.map((src) => {
        const on = look?.src === src;
        return (
          <div key={src} className="absolute inset-0 overflow-hidden transition-opacity duration-[1400ms]" style={{ opacity: on ? 1 : 0, background: "#000" }}>
            <Image src={src} alt="" fill sizes="100vw" loading="eager" className={on ? "object-cover vx-drift" : "object-cover"}
              style={{ objectPosition: on ? look?.position : undefined, filter: on ? look?.filter : undefined, translate: on && look?.shift ? `${look.shift} 0` : undefined, ["--dur" as string]: "14s" }} />
          </div>
        );
      })}

      {/* The business's colour falls across the picture without hiding it */}
      {(Object.keys(WASHES) as Exclude<Wash, "none">[]).map((w) => (
        <div key={w} className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: wash === w ? 1 : 0, background: WASHES[w] }} />
      ))}

      {/* A product alone on its colour, physically present: rim-lit, and larger than the frame */}
      {sector?.product && (
        <div className="absolute inset-0 overflow-hidden transition-opacity duration-[1200ms]" style={{ opacity: moment === 1 ? 1 : 0, background: `radial-gradient(38% 80% at 76% 44%, ${sector.accent}8C 0%, ${sector.accent}26 46%, rgba(0,0,0,0) 74%), rgb(${t})` }}>
          <div className="vx-float absolute" style={{ right: "11cqw", top: "6cqh", height: "112cqh", aspectRatio: "574 / 1245" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- a fixed cut-out on an unattended screen */}
            <img src={sector.product.src} alt={sector.product.alt} className="absolute inset-0 h-full w-full" style={{ filter: `drop-shadow(-0.3cqmin -0.1cqmin 0.12cqmin ${sector.accent}) drop-shadow(0 0 3.6cqmin ${sector.accent}88) drop-shadow(0 3cqmin 7cqmin rgba(0,0,0,0.75))` }} />
            <div className="vx-sweep absolute inset-0" style={{ maskImage: `url(${sector.product.src})`, WebkitMaskImage: `url(${sector.product.src})`, maskSize: "100% 100%", WebkitMaskSize: "100% 100%" }} />
          </div>
        </div>
      )}

      {/* A light passes over the FET device while the number holds */}
      {look?.src === "/display/fet-device.jpg" && <div className="vx-sweep vx-sweep-wide absolute inset-0 pointer-events-none" />}

      {/* Scrims stay light, only enough for the name, the address and the words:
          heavy overlays are what make a screen look like a slide. */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: kind === "reel" ? 0 : 1, background: kind === "ident"
        ? "linear-gradient(90deg, rgba(5,7,13,0.74) 0%, rgba(5,7,13,0.3) 62%, rgba(5,7,13,0.1) 100%)"
        : kind === "visit"
        ? "linear-gradient(90deg, rgba(4,5,9,0.92) 0%, rgba(4,5,9,0.72) 46%, rgba(4,5,9,0.1) 78%)"
        : kind === "welcome" || kind === "proof"
        ? "linear-gradient(90deg, rgba(9,9,10,0.88) 0%, rgba(9,9,10,0.45) 48%, rgba(9,9,10,0.15) 100%)"
        : "none" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: kind === "reel"
        ? "linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 46%), linear-gradient(180deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 12%)"
        : "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 22%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 14%)" }} />

      {/* After dark the picture settles lower, so a big screen never glares. */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[4000ms]" style={{ background: "#000", opacity: night ? 0.3 : 0 }} />
    </div>
  );
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

function TopBar({ hidden }: { hidden: boolean }) {
  return (
    <header className="flex items-center justify-between transition-opacity duration-700" style={{ opacity: hidden ? 0 : 1 }}>
      <Image src="/logo.png" alt="Vitorra Holdings" width={120} height={120} style={{ width: "5cqmin", height: "auto" }} priority />
      <p className="font-sans" style={{ fontSize: "1.9cqmin", fontWeight: 600, color: "var(--vx-muted)" }}>vitorra.org</p>
    </header>
  );
}

/* ── The utility bar ─────────────────────────────────────────────────────
   Everything management needs on screen, whispering: like the instruments of
   a good car, not a news channel. Spacing instead of boxes, one touch of gold,
   and quiet enough that the campaign is always seen first. Each feed refreshes
   itself and falls back quietly if it is offline. */
const BAND = { bg: "#060608", fg: "rgba(255,255,255,0.86)", dim: "rgba(255,255,255,0.56)", gold: "#E9C766" };

function UtilityBar({ big, inset }: { big: boolean; inset: string }) {
  const { time } = useKioskClock();
  const [today, setToday] = useState("");
  useEffect(() => {
    const set = () => setToday(new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }));
    set(); const t = setInterval(set, 60_000); return () => clearInterval(t);
  }, []);
  const weather = useKioskWeather();
  const fx = useKioskFx();
  const headlines = useKioskHeadlines();
  const Now = weatherEntry(weather.code).icon;

  const fs = big ? 1.75 : 1.6;                       // text size, cqmin
  const gap = "3cqmin";
  const items = useMemo(() => {
    const news = headlines.map((h) => h.title);
    const out: string[] = [];
    for (let i = 0; i < Math.max(news.length, TICKER_LINES.length); i++) {
      if (TICKER_LINES[i]) out.push(TICKER_LINES[i]);
      if (news[i]) out.push(news[i]);
    }
    return out;
  }, [headlines]);
  // A steady reading speed whatever the number of items: about 9 characters a second.
  const seconds = Math.max(40, Math.round(items.join("   ").length / 9));

  return (
    <div className="relative shrink-0 flex items-center overflow-hidden tabular-nums" style={{ background: BAND.bg, color: BAND.fg, height: "5cqmin", padding: `0 ${inset}`, gap, fontSize: `${fs}cqmin`, fontWeight: 500, textShadow: "none" }}>
      <span className="shrink-0" style={{ fontWeight: 700, color: "#fff" }}>{time}</span>
      <span className="shrink-0" style={{ color: BAND.dim, marginLeft: "-1.6cqmin" }}>{today}</span>
      <span className="flex items-center shrink-0" style={{ gap: "0.7cqmin" }}>
        <Now style={{ width: "1.8cqmin", height: "1.8cqmin", color: BAND.dim }} />
        {weather.tempNow !== null ? `${weather.tempNow}°` : "—"}
        <span style={{ color: BAND.dim, marginLeft: "0.3cqmin" }}>Kampala</span>
      </span>
      <span className="shrink-0" style={{ color: BAND.dim }}>
        {weather.days.slice(1, 4).map((d) => `${d.label} ${d.hi}°`).join("  ·  ")}
      </span>
      <span className="shrink-0" style={{ color: BAND.dim }}>
        USD <span style={{ color: BAND.fg }}>{fx.ugxPerUsd ? Math.round(fx.ugxPerUsd).toLocaleString("en-US") : "—"}</span>
        {"   "}EUR <span style={{ color: BAND.fg }}>{fx.ugxPerEur ? Math.round(fx.ugxPerEur).toLocaleString("en-US") : "—"}</span>
      </span>
      {/* The one touch of gold on the bar */}
      <span className="shrink-0" style={{ color: BAND.gold, fontWeight: 700 }}>Vitorra News</span>
      <div className="relative flex-1 min-w-0 overflow-hidden flex items-center" style={{ marginLeft: "-1.6cqmin", color: "rgba(255,255,255,0.72)", maskImage: "linear-gradient(90deg, transparent 0, #000 3%, #000 96%, transparent 100%)" }}>
        <div className="vx-ticker flex items-center w-max" style={{ ["--dur" as string]: `${seconds}s` }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
              {items.map((t, i) => <span key={`${copy}-${i}`} className="shrink-0" style={{ paddingRight: "5cqmin" }}>{t}</span>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Progress({ story, index, seconds, loop }: { story: Scene[]; index: number; seconds: number; loop: number }) {
  return (
    <div className="flex" style={{ gap: "0.8cqmin", marginTop: "1.8cqmin", opacity: 0.5 }}>
      {story.map((s, n) => (
        <div key={s.id} className="flex-1 overflow-hidden" style={{ height: "0.16cqmin", minHeight: 1, background: "var(--vx-track)" }}>
          <div
            key={n === index ? `${loop}-${index}` : s.id}
            className={n === index ? "vx-progress h-full" : "h-full"}
            style={{ background: "var(--vx-fg)", width: "100%", transformOrigin: "left", transform: n < index ? "scaleX(1)" : n > index ? "scaleX(0)" : undefined, ["--dur" as string]: `${seconds}s` }}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Scenes ─────────────────────────────────────────────────────────────── */

function Ident() {
  return (
    <div className="self-end w-full" style={{ paddingBottom: "3cqmin" }}>
      <div className="vx-rise" style={{ ["--d" as string]: "0.1s" }}>
        <Image src="/logo.png" alt="" width={160} height={160} style={{ width: "6.4cqmin", height: "auto" }} priority />
      </div>
      <h1 className="vx-mega font-sans vx-rise" style={{ fontSize: "38cqmin", fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.05em", marginTop: "2cqmin", marginLeft: "-0.06em", ["--d" as string]: "0.5s" }}>VITORRA</h1>
      <div className="vx-draw" style={{ width: "26cqmin", height: "0.6cqmin", background: "var(--vx-accent)", margin: "2.4cqmin 0", ["--d" as string]: "1.2s" }} />
      <h2 className="vx-mega font-sans vx-rise" style={{ fontSize: "7cqmin", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.02em", color: "var(--vx-accent)", ["--d" as string]: "1.5s" }}>
        BUILT FOR WHAT MOVES EAST AFRICA
      </h2>
    </div>
  );
}

function WelcomeScene({ welcome }: { welcome: NonNullable<Welcome> }) {
  const chars = Array.from(welcome.name).length;
  return (
    <div className="self-end w-full" style={{ paddingBottom: "4cqmin" }}>
      <p className="vx-rise uppercase" style={{ fontSize: "1.6cqmin", letterSpacing: "0.42em", color: "var(--vx-gold)", ["--d" as string]: "0.2s" }}>Today at Vitorra</p>
      <h1 className="font-sans" style={{ fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.02, marginTop: "2.4cqmin" }}>
        <span className="vx-rise block" style={{ fontSize: "11cqmin", ["--d" as string]: "0.45s" }}>Welcome,</span>
        <span className="vx-rise block" style={{ color: "var(--vx-gold)", fontSize: `min(11cqmin, calc(150cqw / ${Math.max(chars, 9)}))`, ["--d" as string]: "0.8s" }}>{welcome.name}</span>
      </h1>
      <p className="vx-rise" style={{ fontSize: "2.6cqmin", color: "var(--vx-muted)", marginTop: "3.4cqmin", maxWidth: "70cqmin", ["--d" as string]: "1.2s" }}>
        {welcome.line || "Please make yourself comfortable. Someone will be with you shortly."}
      </p>
    </div>
  );
}

/* On a projector the words keep a solid black panel: a projected gradient goes
   grey and muddy, while a solid panel stays crisp. */
const PANEL: React.CSSProperties = { background: "#000000", padding: "2.4cqmin 3cqmin", borderRadius: "1cqmin" };

/** Seconds since this scene began, ticking four times a second. */
function useElapsed(): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setT((performance.now() - start) / 1000), 250);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ── The FET film: captions timed to the picture, out of the way of its titles ── */

function ReelView({ r, street, panel = false }: { r: ReelScene; street: boolean; panel?: boolean }) {
  const t = useElapsed();
  const cap = r.captions.find((c) => t >= c.from && t < c.to) ?? null;
  const shown = cap ?? r.captions.filter((c) => c.from <= t).at(-1) ?? r.captions[0];
  return (
    <div className="w-full self-end" style={{ paddingBottom: "1cqmin" }}>
      <div style={{ maxWidth: "150cqmin", width: "fit-content", opacity: cap ? 1 : 0, transform: cap ? "none" : "translateY(1.2cqmin)", transition: "opacity 700ms ease, transform 900ms cubic-bezier(0.16,1,0.3,1)", ...(panel ? PANEL : {}) }}>
        <SectorTag>{r.tag}</SectorTag>
        <h2 key={shown.from} className="vx-mega font-sans vx-rise" style={{ fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.04, marginTop: "1.8cqmin", fontSize: street ? "8cqmin" : "7.4cqmin" }}>
          <span className="block">{shown.line1}</span>
          <span className="block" style={{ color: "var(--vx-accent)" }}>{shown.line2}</span>
        </h2>
      </div>
    </div>
  );
}

/** The business's name, in its colour: present in every frame, so any single glance says whose message this is. */
function SectorTag({ children, large = false }: { children: React.ReactNode; large?: boolean }) {
  return (
    <div className="font-sans flex items-center" style={{ gap: "1.2cqmin", fontSize: large ? "6.4cqmin" : "2.1cqmin", fontWeight: 700, letterSpacing: large ? "-0.02em" : "0.06em", textTransform: "uppercase", lineHeight: 1 }}>
      <span style={{ width: large ? "1.4cqmin" : "0.6cqmin", height: large ? "6.4cqmin" : "2.1cqmin", background: "var(--vx-accent)" }} />
      {children}
    </div>
  );
}

/** Headline type scaled so the longest line fills the room it has, and no more. */
function fitSize(lines: string[], room: number, max: number): number {
  const longest = Math.max(...lines.map((l) => l.length));
  return Math.min(max, room / (longest * 0.64));
}

/** This loop's headline and proof: the time of day first, otherwise the next headline in turn. */
function copyOf(s: SectorScene, daypart: Daypart, turn: number): { hero: Moment; proof: Moment } {
  const timed = s.timed?.[daypart];
  if (timed) return timed;
  const heroes = [s.hero, ...(s.more ?? [])];
  return { hero: heroes[turn % heroes.length], proof: s.proof };
}

/** What sits behind the words at this moment of this business's film. */
function lookOf(s: SectorScene, moment: number, daypart: Daypart, turn: number): Still | null {
  const copy = copyOf(s, daypart, turn);
  if (moment === 1) return copy.hero.still ?? null;
  if (moment === 2) return copy.proof.still ?? null;
  if (moment === 3) return s.ctaStill ?? null;
  return null;
}

/* One idea at a time, in four moments across the film's slot: the picture on
   its own, the headline, the proof, the call to action. The compositions differ
   on purpose (number-led, product-led, image-led, call-to-action): same family,
   not one template. */
function SectorView({ s, moment, daypart, turn, road }: { s: SectorScene; moment: number; daypart: Daypart; turn: number; road: boolean }) {
  const copy = copyOf(s, daypart, turn);
  return (
    <div className="w-full self-end" style={{ paddingBottom: "0.6cqmin" }}>
      {moment === 0 && <div key="picture" className="vx-rise"><SectorTag large>{s.tag}</SectorTag></div>}
      {moment === 1 && <MomentView key="hero" tag={s.tag} m={copy.hero} />}
      {moment === 2 && <MomentView key="proof" tag={s.tag} m={copy.proof} />}
      {moment === 3 && <CallToAction s={s} road={road} />}
    </div>
  );
}

/* QR codes are for people who can stop. On the road the action is a short
   address to remember: nobody should be asked to scan from a moving car. */
function CallToAction({ s, road }: { s: SectorScene; road: boolean }) {
  const lines = s.cta?.lines ?? wrapLines(s.qr.label);
  return (
    <div className="flex items-end justify-between" style={{ gap: "6cqmin" }}>
      <div className="min-w-0">
        <div className="vx-rise" style={{ ["--d" as string]: "0.1s" }}><SectorTag>{s.tag}</SectorTag></div>
        <h2 className="vx-mega font-sans vx-rise" style={{ fontSize: `${fitSize(lines, road ? 150 : 118, 15)}cqmin`, fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.035em", marginTop: "2cqmin", textTransform: "uppercase", ["--d" as string]: "0.3s" }}>
          {lines.map((l) => <span key={l} className="block">{l}</span>)}
        </h2>
        {s.cta && <div className="font-sans vx-rise" style={{ fontSize: "5cqmin", fontWeight: 700, letterSpacing: "-0.01em", marginTop: "1.8cqmin", ["--d" as string]: "0.5s" }}>{s.cta.sub}</div>}
        {road && <div className="vx-mega font-sans vx-rise" style={{ fontSize: "7.4cqmin", fontWeight: 800, letterSpacing: "-0.02em", marginTop: "2.4cqmin", color: "var(--vx-accent)", ["--d" as string]: "0.7s" }}>{s.url}</div>}
      </div>
      {!road && <QrCard src={s.qr.src} label={s.qr.label} size="27cqmin" delay="0.6s" />}
    </div>
  );
}

/** A call to action on two lines, broken near its middle. */
function wrapLines(label: string): string[] {
  const words = label.split(" ");
  let best = 1, gap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
    if (d < gap) { gap = d; best = i; }
  }
  return words.length < 2 ? [label] : [words.slice(0, best).join(" "), words.slice(best).join(" ")];
}

/* Three distances: from far the number or headline, from the middle the second
   line, close up the small print. The scale between them is the design. */
function MomentView({ tag, m }: { tag: string; m: Moment }) {
  const size = fitSize(m.lines, m.room ?? 150, m.max ?? 15);
  return (
    <div>
      <div className="vx-rise" style={{ ["--d" as string]: "0.1s" }}><SectorTag>{tag}</SectorTag></div>
      {m.number && <BigNumber n={m.number} />}
      <h2 className="vx-mega font-sans" style={{ fontSize: `${size}cqmin`, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.035em", marginTop: m.number ? "0.6cqmin" : "2cqmin" }}>
        {m.lines.map((l, i) => (
          <span key={l} className="vx-rise block" style={{ color: m.accent?.includes(i) ? "var(--vx-accent)" : undefined, ["--d" as string]: `${0.3 + i * 0.3}s` }}>{l}</span>
        ))}
      </h2>
      {m.small && (
        <div className="font-sans vx-rise" style={{ fontSize: "2.5cqmin", fontWeight: 600, marginTop: "1.8cqmin", ["--d" as string]: "1.2s" }}>{m.small}</div>
      )}
    </div>
  );
}

function BigNumber({ n }: { n: NonNullable<Moment["number"]> }) {
  const shown = useCountUp(n.value, n.decimals ?? 0, 1500, 300);
  return (
    <div className="vx-stat vx-mega font-sans tabular-nums vx-rise flex items-baseline" style={{ fontSize: `${n.size}cqmin`, fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.055em", marginTop: "0.6cqmin", marginLeft: "-0.04em", color: n.beside ? "var(--vx-accent)" : "#fff" }}>
      {shown}
      <span style={{ fontSize: n.beside ? "0.26em" : "0.6em", letterSpacing: "-0.02em", marginLeft: n.beside ? "0.16em" : "0.05em", color: "#fff" }}>{n.unit}</span>
    </div>
  );
}

/* One credential at a time, large: six names in a grid is a slide; one name is a statement. */
function Proof({ seconds }: { seconds: number }) {
  const t = useElapsed();
  const n = Math.min(CREDENTIALS.length - 1, Math.floor(t / (seconds / CREDENTIALS.length)));
  const c = CREDENTIALS[n];
  return (
    <div className="self-end w-full" style={{ paddingBottom: "3cqmin" }}>
      <h2 className="vx-mega font-sans vx-rise" style={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, fontSize: "4.6cqmin", textTransform: "uppercase", color: "var(--vx-gold)", ["--d" as string]: "0.1s" }}>Proof, not promises</h2>
      <div key={n}>
        <div className="vx-mega font-sans vx-rise" style={{ fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02, marginTop: "3cqmin", fontSize: "15cqmin" }}>{c.name}</div>
        <div className="font-sans vx-rise" style={{ fontSize: "4cqmin", fontWeight: 600, marginTop: "2cqmin", ["--d" as string]: "0.25s" }}>{c.what}</div>
      </div>
    </div>
  );
}

function Visit({ panel = false, road = false }: { panel?: boolean; road?: boolean }) {
  return (
    <div className="w-full flex items-end justify-between" style={{ gap: "5cqmin" }}>
      <div className="vx-rise min-w-0" style={{ ["--d" as string]: "0.15s", ...(panel ? PANEL : {}) }}>
        <SectorTag>{road ? "Vitorra" : "Visit us"}</SectorTag>
        <h2 className="vx-mega font-sans" style={{ fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.02, marginTop: "2cqmin", fontSize: "11cqmin" }}>
          <span className="vx-rise block" style={{ ["--d" as string]: "0.4s" }}>{road ? "YOU'LL FIND US HERE" : "FIND VITORRA"}</span>
          <span className="vx-rise block" style={{ color: "var(--vx-accent)", ["--d" as string]: "0.7s" }}>{road ? "PADRE PIO HOUSE" : "ON LUMUMBA AVENUE"}</span>
        </h2>
        <div className="vx-rise flex flex-wrap items-baseline" style={{ marginTop: "2.2cqmin", columnGap: "5cqmin", rowGap: "1.2cqmin", ["--d" as string]: "1.1s" }}>
          <Contact label="Call" value={CONTACT_PHONE} />
          <Contact label="Online" value="vitorra.org" />
        </div>
      </div>
      {!road && <QrCard src="/display/qr/whatsapp.svg" label="Chat with us on WhatsApp" size="24cqmin" delay="1.4s" whatsapp card={panel ? PANEL : undefined} />}
    </div>
  );
}

function Contact({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="uppercase block" style={{ fontSize: "1.8cqmin", fontWeight: 700, letterSpacing: "0.16em", color: "var(--vx-muted)" }}>{label}</span>
      <span className="font-sans block" style={{ fontSize: "3.8cqmin", fontWeight: 700, marginTop: "0.5cqmin" }}>{value}</span>
    </p>
  );
}

function QrCard({ src, label, size, delay, whatsapp = false, card }: { src: string; label: string; size: string; delay: string; whatsapp?: boolean; card?: React.CSSProperties }) {
  return (
    <div className="vx-rise flex flex-col items-center shrink-0" style={{ gap: "1.4cqmin", ["--d" as string]: delay, ...card, ...(card ? { padding: "1.4cqmin" } : {}) }}>
      <div className="relative shrink-0 bg-white" style={{ width: size, height: size, padding: "1.2cqmin", borderRadius: "1.4cqmin", boxShadow: card ? undefined : "0 2cqmin 6cqmin rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.08)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG; nothing for the image optimiser to do */}
        <img src={src} alt={label} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
        {whatsapp && (
          <span className="absolute grid place-items-center rounded-full bg-white" style={{ width: "22%", height: "22%", left: "39%", top: "39%" }}>
            <svg viewBox="0 0 24 24" style={{ width: "78%", height: "78%" }} fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
          </span>
        )}
      </div>
      <p className="font-sans" style={{ fontSize: "2.6cqmin", fontWeight: 800, letterSpacing: "0.02em", textTransform: "uppercase" }}>Scan with your phone</p>
    </div>
  );
}

/* ── Hooks ──────────────────────────────────────────────────────────────── */

function useCountUp(target: number, decimals: number, ms: number, delayMs: number): string {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now() + delayMs;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / ms));
      setV(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, delayMs]);
  return v.toFixed(decimals);
}

/* ── Paid adverts (street screen only) ───────────────────────────────────── */

type Advert = { id: number; url: string; seconds: number; plays_per_hour: number };

/** What the server says may run now. Only approved, paid adverts in their booked days and times. */
function useAdverts(mode: Mode): Advert[] {
  const [ads, setAds] = useState<Advert[]>([]);
  useEffect(() => {
    if (mode !== "street") return;
    const load = () => fetch(`${API_BASE_URL}/display/adverts`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()).then((j) => setAds(j?.data ?? [])).catch(() => {});
    void load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [mode]);
  return ads;
}

/** The advert most overdue against its plays an hour, if any. */
function dueAdvert(ads: Advert[], played: Record<number, number>, now: number): Advert | null {
  let best: Advert | null = null, late = 0;
  for (const a of ads) {
    const by = now - (played[a.id] ?? 0) - 3_600_000 / a.plays_per_hour;
    if (by >= 0 && (!best || by > late)) { best = a; late = by; }
  }
  return best;
}

function AdvertFilm({ ad, onEnd }: { ad: Advert; onEnd: () => void }) {
  // If a film stalls on an unattended screen, the loop still moves on.
  useEffect(() => { const t = setTimeout(onEnd, (ad.seconds + 3) * 1000); return () => clearTimeout(t); }, [ad, onEnd]);
  return (
    <div className="absolute inset-0 z-[5] bg-black">
      <video src={ad.url} autoPlay muted playsInline onEnded={onEnd} onError={onEnd} className="h-full w-full object-contain" />
      <span className="absolute font-sans" style={{ right: "5cqmin", bottom: "6.4cqmin", fontSize: "1.5cqmin", fontWeight: 600, letterSpacing: "0.04em", color: "rgba(255,255,255,0.7)" }}>Advertisement</span>
    </div>
  );
}

/** Which of the film's four moments is on screen. Changes only at the turn of a
 *  moment, so the stage does not redraw while it plays. `hold` pins one moment
 *  (?moment=1) for checking a screen. */
function useMoment(key: string, seconds: number, hold?: number | null): number {
  const [at, setAt] = useState({ key, n: 0 });
  useEffect(() => {
    const timers = MOMENT_STARTS.slice(1).map((share, i) => setTimeout(() => setAt({ key, n: i + 1 }), share * seconds * 1000));
    return () => timers.forEach(clearTimeout);
  }, [key, seconds]);
  if (hold !== null && hold !== undefined) return hold;
  return at.key === key ? at.n : 0;
}

/** Kampala time of day, checked every minute. `forced` (?at=rush) previews one. */
function useDaypart(forced?: Daypart | null): Daypart {
  const [part, setPart] = useState<Daypart>("day");
  useEffect(() => {
    const set = () => setPart(daypartAt(new Date()));
    const first = setTimeout(set, 0);
    const t = setInterval(set, 60_000);
    return () => { clearTimeout(first); clearInterval(t); };
  }, []);
  return forced ?? part;
}

/** The welcome set by reception (Operations → Reception screen). Indoors only — never fetched for the street screen. */
function useWelcome(mode: Mode): Welcome {
  const [w, setW] = useState<Welcome>(null);
  useEffect(() => {
    if (mode === "street") return;
    let live = true;
    const load = () => fetch(`${API_BASE_URL}/display`, { headers: { Accept: "application/json" } })
      .then((r) => r.json()).then((j) => { if (live) setW(j?.data?.welcome ?? null); }).catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => { live = false; clearInterval(t); };
  }, [mode]);
  return w;
}

/* ── Screen care: full screen and never asleep ─────────────────────────────
   Browsers only allow full screen after a person touches the page, so:
   - installed as an app (the /display manifest) it opens with no browser
     frame at all, and nothing here is needed;
   - otherwise the first click, tap or key press takes it full screen
     (F toggles it), with a quiet hint for the first seconds;
   - a screen wake lock stops the TV or player dimming or sleeping.     */
function ScreenCare() {
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone = () =>
      !!document.fullscreenElement ||
      window.matchMedia("(display-mode: fullscreen), (display-mode: standalone)").matches;

    const goFull = () => {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        void document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
        else goFull();
      } else goFull();
    };
    const showHint = () => {
      if (standalone()) { setHint(false); return; }
      setHint(true);
      window.setTimeout(() => setHint(false), 15_000);
    };

    // Wake lock — re-taken whenever the page becomes visible again.
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const keepAwake = () => {
      if (document.visibilityState === "visible" && nav.wakeLock) nav.wakeLock.request("screen").then((l) => { lock = l; }).catch(() => {});
    };

    showHint();
    keepAwake();
    window.addEventListener("pointerdown", goFull);
    window.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", showHint);
    document.addEventListener("visibilitychange", keepAwake);
    return () => {
      window.removeEventListener("pointerdown", goFull);
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", showHint);
      document.removeEventListener("visibilitychange", keepAwake);
      void lock?.release().catch(() => {});
    };
  }, []);

  return (
    <div aria-live="polite" className="absolute z-20 left-1/2 -translate-x-1/2 transition-opacity duration-700 pointer-events-none"
      style={{ top: "3.8cqmin", opacity: hint ? 1 : 0 }}>
      <p className="rounded-full" style={{ fontSize: "1.15cqmin", letterSpacing: "0.04em", padding: "0.6cqmin 1.4cqmin", background: "rgba(0,0,0,0.4)", color: "rgba(255,255,255,0.6)" }}>
        Click or tap anywhere for full screen · press F to toggle
      </p>
    </div>
  );
}

/* ── Projector check (/display?scene=check) ─────────────────────────────
   For setting up a projector against the wall: the outer frame should sit
   just inside the wall edge (adjust keystone/zoom), the fine lines in the
   centre should be sharp (focus), all ten grey steps should be distinct
   (brightness/contrast), and the smallest text line should be readable from
   the back of reception. */
function ProjectorCheck() {
  const steps = Array.from({ length: 10 }, (_, n) => Math.round((n / 9) * 255));
  return (
    <div className="absolute inset-0 bg-black text-white select-none cursor-none" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="absolute border-[3px] border-white" style={{ inset: "2cqmin" }} />
      <div className="absolute border border-dashed" style={{ inset: "6.5cqmin 7.5cqmin 5cqmin", borderColor: "#F5D57C" }} />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ gap: "3cqmin" }}>
        <div className="grid" style={{ gridTemplateColumns: "repeat(24, 1px)", gap: "3px", height: "12cqmin" }}>
          {Array.from({ length: 24 }, (_, n) => <span key={n} className="bg-white h-full" />)}
        </div>
        <div className="flex">
          {steps.map((v) => <span key={v} style={{ width: "7cqmin", height: "7cqmin", background: `rgb(${v},${v},${v})` }} />)}
        </div>
        <div className="text-center space-y-1">
          <p style={{ fontSize: "6cqmin", fontWeight: 600 }}>Vitorra projector check</p>
          <p style={{ fontSize: "2.6cqmin" }}>The dashed gold frame is the safe area. Everything on the loop stays inside it.</p>
          <p style={{ fontSize: "1.9cqmin" }}>Smallest text on the loop: read this from the back of reception.</p>
          <p style={{ fontSize: "1.9cqmin", color: "#F5D57C" }}>Focus until the white lines above are sharp. All ten grey squares should look different.</p>
        </div>
      </div>
    </div>
  );
}
