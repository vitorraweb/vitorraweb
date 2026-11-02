"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { API_BASE_URL, CONTACT_PHONE } from "@/lib/constants";
import { useKioskClock, useKioskFx, useKioskHeadlines, useKioskWeather, weatherEntry } from "@/lib/kiosk";
import { CREDENTIALS, FILMS, MOMENT_STARTS, SECTORS, TICKER_LINES, daypartAt, durationOf, storyFor, type Daypart, type Mode, type Moment, type ReelScene, type Scene, type SectorScene } from "./scenes";

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
  projectorLight: { "--vx-bg": "#FFFFFF", "--vx-fg": "#000000", "--vx-gold": "#4E3600", "--vx-muted": "#000000", "--vx-track": "rgba(0,0,0,0.3)", "--vx-line": "#4E3600" },
} as const;

export function Stage({ mode, pin, at, hold }: { mode: Mode; pin?: string | null; at?: Daypart | null; hold?: number | null }) {
  return (
    <div className="fixed inset-0 grid place-items-center" style={{ background: "#000" }}>
      {/* The 1920×1080 frame: everything inside measures itself against this box. */}
      <div className="relative overflow-hidden" style={{ width: "min(100vw, 177.778vh)", height: "min(100vh, 56.25vw)", containerType: "size" }}>
        {pin === "check" ? <ProjectorCheck /> : <Loop mode={mode} pin={pin} at={at} hold={hold} />}
      </div>
    </div>
  );
}

function Loop({ mode, pin, at, hold }: { mode: Mode; pin?: string | null; at?: Daypart | null; hold?: number | null }) {
  const welcome = useWelcome(mode);
  const story = useMemo(() => storyFor(mode, !!welcome), [mode, welcome]);
  const [i, setI] = useState(0);
  const [loop, setLoop] = useState(0);
  const pinned = pin ? story.findIndex((s) => s.id === pin) : -1;
  const index = pinned >= 0 ? pinned : i % story.length;
  const scene = story[index];
  const seconds = durationOf(scene, mode);

  useEffect(() => {
    if (pinned >= 0) return;
    const t = setTimeout(() => {
      setI((n) => (n + 1) % story.length);
      if (index === story.length - 1) setLoop((l) => l + 1);
    }, seconds * 1000);
    return () => clearTimeout(t);
  }, [index, seconds, story.length, pinned]);

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
  // Projectors cannot show black, so their brand scenes go bright. Every other
  // screen stays dark, by day and by night.
  const light = projector && (scene.kind === "ident" || scene.kind === "proof" || scene.kind === "welcome");
  const theme = light ? THEMES.projectorLight : projector ? THEMES.projector : street ? THEMES.street : THEMES.reception;
  const accent = scene.kind === "sector" || scene.kind === "reel" ? scene.accent : theme["--vx-gold"];

  return (
    <div className="vx absolute inset-0 overflow-hidden select-none cursor-none" data-mode={mode} data-daypart={daypart}
      style={{ ...theme, "--vx-accent": accent, background: "var(--vx-bg)", color: "var(--vx-fg)", transition: "background-color 1.2s ease, color 1.2s ease" } as unknown as React.CSSProperties}>
      <Backdrops activeSector={activeSector} kind={scene.kind} seconds={seconds} street={big} light={light} projector={projector} moment={moment} night={daypart === "night" && !projector} />
      <div className="hero-grain absolute inset-0 pointer-events-none" style={{ opacity: light || projector ? 0 : street ? 0.025 : 0.035 }} />
      <ScreenCare />

      {/* The whole overlay — story and information band — drifts together
          against burn-in. Projectors usually crop the edges (overscan), so
          their safe area is wider. */}
      <div className="relative z-10 h-full flex flex-col" style={{ translate: `${dx}px ${dy}px`, transition: "translate 4s ease" }}>
      <div className="flex-1 min-h-0 flex flex-col" style={{ padding: projector ? "6.5cqmin 7.5cqmin 2.4cqmin" : "4.2cqmin 5cqmin 2.2cqmin", textShadow: street && !light && !projector ? "0 0.25cqmin 1.6cqmin rgba(0,0,0,0.55)" : undefined }}>
        <TopBar hidden={scene.kind === "ident"} />
        <div key={`${scene.id}-${loop}`} className="relative flex-1 min-h-0 flex">
          {scene.kind === "ident" && <Ident />}
          {scene.kind === "welcome" && welcome && <WelcomeScene welcome={welcome} />}
          {scene.kind === "reel" && <ReelView r={scene} street={big} panel={projector} />}
          {scene.kind === "sector" && <SectorView s={scene} moment={moment} daypart={daypart} street={big} />}
          {scene.kind === "proof" && <Proof seconds={seconds} />}
          {scene.kind === "visit" && <Visit street={big} panel={projector} here={street} />}
        </div>
        <Progress story={story} index={index} seconds={seconds} loop={loop} />
      </div>
      <BroadcastBar big={big} inset={projector ? "7.5cqmin" : "5cqmin"} />
      </div>
    </div>
  );
}

/* ── Backgrounds: films for the businesses, a living gold field for the rest ── */

function Backdrops({ activeSector, kind, seconds, street, light, projector = false, moment, night }: { activeSector: string | null; kind: Scene["kind"]; seconds: number; street: boolean; light: boolean; projector?: boolean; moment: number; night: boolean }) {
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

  return (
    <div className="absolute inset-0">
      {/* Brand field: welcome and credentials — a gold glow on black */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: !light && (kind === "welcome" || kind === "proof") ? 1 : 0 }}>
        <div className="vx-aurora absolute -inset-[20%]" />
      </div>

      {/* Ident: the city going dark, with the name rising out of it */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: !light && kind === "ident" ? 1 : 0 }}>
        <Image src="/images/stock/kampala-skyline.jpg" alt="" fill sizes="100vw" priority
          className={kind === "ident" ? "object-cover vx-kenburns" : "object-cover"} style={{ objectPosition: "50% 78%", filter: "brightness(0.42) contrast(1.28) saturate(1.45)", ["--dur" as string]: `${seconds}s` }} />
      </div>
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: light ? 1 : 0, background: projector
        ? "linear-gradient(90deg, #4E3600 0, #4E3600 1.2cqmin, transparent 1.2cqmin), #FFFFFF"
        : undefined }} />

      {/* Visit: the building itself */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "visit" ? 1 : 0 }}>
        <Image src="/photos/company-A-head-office.jpg" alt="" fill sizes="100vw" priority={false}
          className={kind === "visit" ? "object-cover vx-kenburns" : "object-cover"} style={{ filter: "brightness(0.6) contrast(1.1) saturate(1.1)", ["--dur" as string]: `${seconds}s` }} />
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

      {/* The business's world: its deep colour rolls in behind the words once
          the opening picture has had its moment. On a projector, plain black:
          a projected dark colour goes muddy, while black stays crisp. */}
      {SECTORS.map((s) => {
        const t = projector ? "0,0,0" : s.tint;
        return (
          <div key={s.id} className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: activeSector === s.id && moment > 0 ? 1 : 0, background: `linear-gradient(90deg, rgba(${t},0.97) 0%, rgba(${t},0.92) 50%, rgba(${t},0.66) 78%, rgba(${t},0.32) 100%)` }} />
        );
      })}

      {/* A product alone on its colour, for the headline and the proof */}
      {sector?.product && (
        <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: moment === 1 || moment === 2 ? 1 : 0, background: projector ? "#000" : `radial-gradient(40% 74% at 68% 46%, ${sector.accent}66 0%, ${sector.accent}1F 45%, rgba(0,0,0,0) 72%), rgb(${sector.tint})` }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- a fixed cut-out on an unattended screen */}
          <img src={sector.product.src} alt={sector.product.alt} className="vx-float absolute" style={{ right: "22cqw", top: "6cqh", height: "76cqh", width: "auto", filter: "drop-shadow(0 2cqmin 6cqmin rgba(0,0,0,0.7))" }} />
        </div>
      )}

      {/* Scrims: the type always sits on dark, whatever the footage does.
          Outdoors they are lighter and confined to where the words are, so the
          film itself stays bright in daylight. */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: light || kind === "reel" ? 0 : 1, background: kind === "ident"
        ? "linear-gradient(90deg, rgba(4,5,9,0.72) 0%, rgba(4,5,9,0.22) 62%, rgba(4,5,9,0) 100%)"
        : kind === "visit"
        ? "linear-gradient(90deg, rgba(4,5,9,0.92) 0%, rgba(4,5,9,0.72) 46%, rgba(4,5,9,0.1) 78%)"
        : street
        ? "linear-gradient(90deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0) 40%)"
        : kind === "sector" ? "linear-gradient(90deg, rgba(9,9,10,0.4) 0%, rgba(9,9,10,0) 45%)"
        : "linear-gradient(90deg, rgba(9,9,10,0.88) 0%, rgba(9,9,10,0.45) 48%, rgba(9,9,10,0.15) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: light ? 0 : 1, background: kind === "reel"
        ? "linear-gradient(0deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 46%), linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 14%)"
        : kind === "ident"
        ? "linear-gradient(0deg, rgba(4,5,9,0.9) 0%, rgba(4,5,9,0) 70%), linear-gradient(180deg, rgba(4,5,9,0.86) 0%, rgba(4,5,9,0) 46%)"
        : street
        ? "linear-gradient(0deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0) 38%), linear-gradient(180deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 20%)"
        : kind === "sector" || kind === "visit" ? "linear-gradient(0deg, rgba(9,9,10,0.78) 0%, rgba(9,9,10,0) 38%), linear-gradient(180deg, rgba(9,9,10,0.72) 0%, rgba(9,9,10,0) 20%)"
        : "linear-gradient(0deg, rgba(9,9,10,0.92) 0%, rgba(9,9,10,0) 55%), linear-gradient(180deg, rgba(9,9,10,0.75) 0%, rgba(9,9,10,0) 22%)" }} />

      {/* After dark the whole picture settles lower, so a big screen never glares. */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[4000ms]" style={{ background: "#000", opacity: night ? 0.3 : 0 }} />
    </div>
  );
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

function TopBar({ hidden }: { hidden: boolean }) {
  return (
    <header className="flex items-start justify-between transition-opacity duration-700" style={{ opacity: hidden ? 0 : 1 }}>
      <div className="flex items-center" style={{ gap: "1.6cqmin" }}>
        <Image src="/logo.png" alt="Vitorra Holdings" width={120} height={120} style={{ width: "6.4cqmin", height: "auto" }} priority />
        <div className="leading-none">
          <p className="font-sans" style={{ fontSize: "3cqmin", fontWeight: 700, letterSpacing: "-0.01em" }}>Vitorra</p>
          <p className="uppercase" style={{ fontSize: "1.15cqmin", letterSpacing: "0.32em", color: "var(--vx-gold)", marginTop: "0.7cqmin" }}>Holdings Limited</p>
        </div>
      </div>
      <p className="font-sans" style={{ fontSize: "3cqmin", fontWeight: 600, color: "var(--vx-gold)" }}>vitorra.org</p>
    </header>
  );
}

/* ── The information band ────────────────────────────────────────────────
   Like a news channel's lower bar: always on, always the same place, solid
   black so it reads over any film, in daylight and on a projector. Time and
   date, Kampala weather with the next three days, today's shilling rates,
   then a ticker of company news and the latest articles. Each feed refreshes
   itself and falls back quietly if it is offline. */
const BAND = { bg: "#000000", fg: "#FFFFFF", gold: "#F0C85A", dim: "rgba(255,255,255,0.72)", rule: "rgba(240,200,90,0.45)" };

function Cell({ pad, gap, children }: { pad: string; gap: string; children: React.ReactNode }) {
  return <div className="flex items-center shrink-0" style={{ padding: `0 ${pad}`, borderRight: `1px solid ${BAND.rule}`, gap }}>{children}</div>;
}

function BroadcastBar({ big, inset }: { big: boolean; inset: string }) {
  const { time } = useKioskClock();
  const [today, setToday] = useState("");
  useEffect(() => {
    const set = () => setToday(new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }).toUpperCase());
    set(); const t = setInterval(set, 60_000); return () => clearInterval(t);
  }, []);
  const weather = useKioskWeather();
  const fx = useKioskFx();
  const headlines = useKioskHeadlines();
  const Now = weatherEntry(weather.code).icon;

  const fs = big ? 2.3 : 1.75;                       // base text size, cqmin
  const v = (n: number) => `${(fs * n).toFixed(2)}cqmin`;
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
    <div className="relative shrink-0 flex items-stretch overflow-hidden" style={{ background: BAND.bg, color: BAND.fg, height: big ? "9.5cqmin" : "7.4cqmin", borderTop: `0.35cqmin solid ${BAND.gold}`, paddingLeft: inset, textShadow: "none" }}>
      {/* Time */}
      <div className="flex flex-col justify-center shrink-0 leading-none" style={{ background: BAND.gold, color: "#000", padding: `0 ${v(1.1)}`, marginLeft: `calc(-1 * ${inset})`, paddingLeft: inset }}>
        <span className="tabular-nums" style={{ fontSize: v(1.75), fontWeight: 800, letterSpacing: "-0.02em" }}>{time}</span>
        <span style={{ fontSize: v(0.62), fontWeight: 700, letterSpacing: "0.14em", marginTop: v(0.25) }}>{today}</span>
      </div>

      {/* Weather */}
      <Cell pad={v(1.2)} gap={v(0.6)}>
        <Now style={{ width: v(1.4), height: v(1.4), color: BAND.gold }} />
        <span className="leading-none">
          <span className="block tabular-nums" style={{ fontSize: v(1.3), fontWeight: 700 }}>{weather.tempNow !== null ? `${weather.tempNow}°` : "—"}</span>
          <span className="block" style={{ fontSize: v(0.6), fontWeight: 700, letterSpacing: "0.12em", color: BAND.dim, marginTop: v(0.2) }}>KAMPALA</span>
        </span>
        <span className="flex" style={{ gap: v(0.9), marginLeft: v(0.6) }}>
          {weather.days.slice(1, 4).map((d) => {
            const I = weatherEntry(d.code).icon;
            return (
              <span key={d.label} className="flex flex-col items-center leading-none" style={{ gap: v(0.2) }}>
                <span style={{ fontSize: v(0.58), fontWeight: 700, letterSpacing: "0.1em", color: BAND.dim }}>{d.label.toUpperCase()}</span>
                <I style={{ width: v(0.9), height: v(0.9) }} />
                <span className="tabular-nums" style={{ fontSize: v(0.72), fontWeight: 600 }}>{d.hi}°</span>
              </span>
            );
          })}
        </span>
      </Cell>

      {/* Shilling rates */}
      <Cell pad={v(1.2)} gap={v(0.6)}>
        <span className="leading-none">
          <span className="block" style={{ fontSize: v(0.58), fontWeight: 700, letterSpacing: "0.12em", color: BAND.gold }}>UGX TODAY</span>
          <span className="flex tabular-nums" style={{ gap: v(0.9), marginTop: v(0.3), fontSize: v(0.95), fontWeight: 700 }}>
            <span><span style={{ color: BAND.dim, fontWeight: 600 }}>USD </span>{fx.ugxPerUsd ? Math.round(fx.ugxPerUsd).toLocaleString("en-US") : "—"}</span>
            <span><span style={{ color: BAND.dim, fontWeight: 600 }}>EUR </span>{fx.ugxPerEur ? Math.round(fx.ugxPerEur).toLocaleString("en-US") : "—"}</span>
          </span>
        </span>
      </Cell>

      {/* Ticker */}
      <div className="flex items-center shrink-0" style={{ padding: `0 ${v(0.8)}` }}>
        <span style={{ background: BAND.gold, color: "#000", fontSize: v(0.62), fontWeight: 800, letterSpacing: "0.14em", padding: `${v(0.35)} ${v(0.6)}`, borderRadius: v(0.2) }}>VITORRA NEWS</span>
      </div>
      <div className="relative flex-1 min-w-0 overflow-hidden flex items-center" style={{ maskImage: "linear-gradient(90deg, transparent 0, #000 3%, #000 96%, transparent 100%)" }}>
        <div className="vx-ticker flex items-center w-max" style={{ ["--dur" as string]: `${seconds}s` }}>
          {[0, 1].map((copy) => (
            <div key={copy} className="flex items-center shrink-0" aria-hidden={copy === 1}>
              {items.map((t, i) => (
                <span key={`${copy}-${i}`} className="flex items-center shrink-0" style={{ fontSize: v(0.98), fontWeight: 600, paddingRight: v(2) }}>
                  {t}
                  <span aria-hidden="true" style={{ display: "inline-block", width: v(0.35), height: v(0.35), background: BAND.gold, transform: "rotate(45deg)", marginLeft: v(2) }} />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Progress({ story, index, seconds, loop }: { story: Scene[]; index: number; seconds: number; loop: number }) {
  return (
    <div className="flex" style={{ gap: "0.8cqmin", marginTop: "2.6cqmin" }}>
      {story.map((s, n) => (
        <div key={s.id} className="flex-1 overflow-hidden" style={{ height: "0.28cqmin", minHeight: 2, background: "var(--vx-track)" }}>
          <div
            key={n === index ? `${loop}-${index}` : s.id}
            className={n === index ? "vx-progress h-full" : "h-full"}
            style={{ background: "var(--vx-gold)", width: "100%", transformOrigin: "left", transform: n < index ? "scaleX(1)" : n > index ? "scaleX(0)" : undefined, ["--dur" as string]: `${seconds}s` }}
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
        <Image src="/logo.png" alt="" width={160} height={160} style={{ width: "8cqmin", height: "auto" }} priority />
      </div>
      <h1 className="vx-mega font-sans vx-rise" style={{ fontSize: "31cqmin", fontWeight: 800, lineHeight: 0.92, letterSpacing: "-0.045em", marginTop: "2cqmin", ["--d" as string]: "0.5s" }}>VITORRA</h1>
      <div className="vx-draw" style={{ width: "26cqmin", height: "0.6cqmin", background: "var(--vx-accent)", margin: "2.4cqmin 0", ["--d" as string]: "1.2s" }} />
      <h2 className="vx-mega font-sans vx-rise" style={{ fontSize: "7cqmin", fontWeight: 800, lineHeight: 1.04, letterSpacing: "-0.02em", color: "var(--vx-accent)", ["--d" as string]: "1.5s" }}>
        BUILT FOR WHAT MOVES EAST AFRICA.
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
    <div className="font-sans flex items-center" style={{ gap: "1.8cqmin", fontSize: large ? "6.4cqmin" : "2.8cqmin", fontWeight: 800, letterSpacing: large ? "-0.02em" : "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
      <span style={{ width: large ? "1.4cqmin" : "0.9cqmin", height: large ? "6.4cqmin" : "2.8cqmin", background: "var(--vx-accent)" }} />
      {children}
    </div>
  );
}

/** Headline type scaled so the longest line fills the space it has, and no more. */
function fitSize(lines: string[], room: number, max: number): number {
  const longest = Math.max(...lines.map((l) => l.length));
  return Math.min(max, room / (longest * 0.66));
}

/* One idea at a time, in four moments across the film's slot: the picture on
   its own, the headline, the proof, the call to action. */
function SectorView({ s, moment, daypart, street }: { s: SectorScene; moment: number; daypart: Daypart; street: boolean }) {
  const copy = s.timed?.[daypart] ?? { hero: s.hero, proof: s.proof };
  // With a product beside the words, they keep to the left of it.
  const room = s.product ? 94 : 152;
  return (
    <div className="w-full self-end" style={{ paddingBottom: "1cqmin" }}>
      {moment === 0 && <div key="picture" className="vx-rise"><SectorTag large>{s.tag}</SectorTag></div>}
      {moment === 1 && <MomentView key="hero" tag={s.tag} m={copy.hero} room={room} street={street} />}
      {moment === 2 && <MomentView key="proof" tag={s.tag} m={copy.proof} room={room} street={street} />}
      {moment === 3 && (
        <div key="cta" className="flex items-end justify-between" style={{ gap: "6cqmin" }}>
          <div className="min-w-0">
            <div className="vx-rise" style={{ ["--d" as string]: "0.1s" }}><SectorTag>{s.tag}</SectorTag></div>
            <h2 className="vx-mega font-sans vx-rise" style={{ fontSize: `${fitSize(wrapLines(s.qr.label), 112, 11)}cqmin`, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", marginTop: "2.2cqmin", textTransform: "uppercase", ["--d" as string]: "0.3s" }}>
              {wrapLines(s.qr.label).map((l, i, all) => <span key={l} className="block" style={{ color: i === all.length - 1 ? "var(--vx-accent)" : undefined }}>{l}</span>)}
            </h2>
          </div>
          <QrCard src={s.qr.src} label={s.qr.label} size="27cqmin" delay="0.6s" />
        </div>
      )}
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

function MomentView({ tag, m, room, street }: { tag: string; m: Moment; room: number; street: boolean }) {
  const size = fitSize(m.lines, room, m.number ? 9.5 : m.lines.length > 2 ? 14.5 : 17);
  return (
    <div>
      <div className="vx-rise" style={{ ["--d" as string]: "0.1s" }}><SectorTag>{tag}</SectorTag></div>
      {m.number && <BigNumber n={m.number} room={room} />}
      <h2 className="vx-mega font-sans" style={{ fontSize: `${size}cqmin`, fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", marginTop: m.number ? "0.4cqmin" : "2.2cqmin" }}>
        {m.lines.map((l, i) => (
          <span key={l} className="vx-rise block" style={{ color: m.accent?.includes(i) ? "var(--vx-accent)" : undefined, ["--d" as string]: `${0.3 + i * 0.3}s` }}>{l}</span>
        ))}
      </h2>
      {m.small && (
        <div className="font-sans vx-rise" style={{ fontSize: street ? "3.4cqmin" : "3.1cqmin", fontWeight: 600, marginTop: "2.2cqmin", color: "var(--vx-fg)", ["--d" as string]: "1.2s" }}>{m.small}</div>
      )}
    </div>
  );
}

function BigNumber({ n, room }: { n: NonNullable<Moment["number"]>; room: number }) {
  const shown = useCountUp(n.value, n.decimals ?? 0, 1500, 300);
  return (
    <div className="vx-stat vx-mega font-sans tabular-nums vx-rise" style={{ fontSize: room < 100 ? "27cqmin" : "33cqmin", fontWeight: 800, lineHeight: 0.98, letterSpacing: "-0.05em", marginTop: "1.2cqmin", color: "var(--vx-accent)" }}>
      {shown}
      <span style={{ fontSize: n.unit.length > 1 ? "0.3em" : "0.62em", letterSpacing: "-0.02em", marginLeft: "0.14em" }}>{n.unit}</span>
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
      <h2 className="vx-mega font-sans vx-rise" style={{ fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, fontSize: "4.6cqmin", textTransform: "uppercase", color: "var(--vx-gold)", ["--d" as string]: "0.1s" }}>Independently certified.</h2>
      <div key={n}>
        <div className="vx-mega font-sans vx-rise" style={{ fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.02, marginTop: "3cqmin", fontSize: "15cqmin" }}>{c.name}</div>
        <div className="font-sans vx-rise" style={{ fontSize: "4cqmin", fontWeight: 600, marginTop: "2cqmin", ["--d" as string]: "0.25s" }}>{c.what}</div>
      </div>
    </div>
  );
}

function Visit({ street, panel = false, here = false }: { street: boolean; panel?: boolean; here?: boolean }) {
  return (
    <div className="w-full flex items-end justify-between" style={{ gap: "5cqmin" }}>
      <div className="vx-rise min-w-0" style={{ ["--d" as string]: "0.15s", ...(panel ? PANEL : {}) }}>
        <SectorTag>{here ? "You are here" : "Visit us"}</SectorTag>
        <h2 className="vx-mega font-sans" style={{ fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.03, marginTop: "2cqmin", fontSize: street ? "9.4cqmin" : "8.6cqmin" }}>
          <span className="vx-rise block" style={{ ["--d" as string]: "0.4s" }}>PADRE PIO HOUSE,</span>
          <span className="vx-rise block" style={{ color: "var(--vx-accent)", ["--d" as string]: "0.7s" }}>LUMUMBA AVENUE.</span>
        </h2>
        <div className="vx-rise flex flex-wrap items-baseline" style={{ marginTop: "2.6cqmin", columnGap: "5cqmin", rowGap: "1.2cqmin", ["--d" as string]: "1.1s" }}>
          <Contact label="Call" value={CONTACT_PHONE} />
          <Contact label="Online" value="vitorra.org" />
        </div>
      </div>
      <QrCard src="/display/qr/whatsapp.svg" label="Chat with us on WhatsApp" size="24cqmin" delay="1.4s" whatsapp card={panel ? PANEL : undefined} />
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
      style={{ top: "4.6cqmin", opacity: hint ? 1 : 0 }}>
      <p className="rounded-full" style={{ fontSize: "1.5cqmin", letterSpacing: "0.12em", padding: "1cqmin 2.2cqmin", background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}>
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
