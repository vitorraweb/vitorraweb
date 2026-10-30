"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { API_BASE_URL, CONTACT_EMAIL, CONTACT_PHONE } from "@/lib/constants";
import { useKioskClock, useKioskWeather, weatherEntry } from "@/lib/kiosk";
import { CREDENTIALS, SECTORS, durationOf, storyFor, type Mode, type Scene, type SectorScene } from "./scenes";

/* ─── The stage ───────────────────────────────────────────────────────────────
   A full-screen loop for the reception TV and the street-facing screen.

   - Everything is sized in vmin, so a 1080p TV, a 4K panel and a portrait
     totem all show the same composition.
   - Films are all mounted once and cross-faded; only the visible one plays,
     so the loop never shows a black frame and modest hardware keeps up.
   - Each scene's text is re-keyed on entry, so its rise-in plays every loop.
   - Burn-in care for a screen that never sleeps: the overlay drifts a few
     pixels every three minutes, invisibly.
   ─────────────────────────────────────────────────────────────────────────── */

type Welcome = { name: string; line: string } | null;

const DRIFT = [[0, 0], [3, -2], [-2, 3], [2, 2], [-3, -1]];

/* Colour tokens. Reception is a dim lobby; the street screen competes with
   daylight, so it gets brighter type and gold, and ivory brand scenes. */
const THEMES = {
  reception: { "--vx-bg": "#09090A", "--vx-fg": "#F4EFE6", "--vx-gold": "#C5B27A", "--vx-muted": "rgba(244,239,230,0.72)", "--vx-track": "rgba(244,239,230,0.16)", "--vx-line": "rgba(197,178,122,0.35)" },
  street:    { "--vx-bg": "#0E0E10", "--vx-fg": "#FFFFFF", "--vx-gold": "#EED596", "--vx-muted": "rgba(255,255,255,0.9)", "--vx-track": "rgba(255,255,255,0.3)", "--vx-line": "rgba(238,213,150,0.6)" },
  daylight:  { "--vx-bg": "#F5F0E6", "--vx-fg": "#17140F", "--vx-gold": "#8A6A1F", "--vx-muted": "rgba(23,20,15,0.74)", "--vx-track": "rgba(23,20,15,0.15)", "--vx-line": "rgba(138,106,31,0.45)" },
} as const;

export function Stage({ mode, pin }: { mode: Mode; pin?: string | null }) {
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

  const street = mode === "street";
  const activeSector = scene.kind === "sector" ? scene.id : null;
  // Daylight: outdoors the brand scenes go ivory (a dark screen in sun reads as
  // a black hole), and over film everything is brighter and heavier.
  const light = street && (scene.kind === "ident" || scene.kind === "proof");
  const theme = light ? THEMES.daylight : street ? THEMES.street : THEMES.reception;

  return (
    <div className="vx fixed inset-0 overflow-hidden select-none cursor-none" data-mode={mode}
      style={{ ...theme, background: "var(--vx-bg)", color: "var(--vx-fg)", transition: "background-color 1.2s ease, color 1.2s ease" } as React.CSSProperties}>
      <Backdrops activeSector={activeSector} kind={scene.kind} seconds={seconds} street={street} light={light} />
      <div className="hero-grain absolute inset-0 pointer-events-none" style={{ opacity: light ? 0 : street ? 0.025 : 0.035 }} />
      <ScreenCare />

      <div className="relative z-10 h-full flex flex-col" style={{ padding: "4.2vmin 5vmin 3.4vmin", translate: `${dx}px ${dy}px`, transition: "translate 4s ease", textShadow: street && !light ? "0 0.25vmin 1.6vmin rgba(0,0,0,0.55)" : undefined }}>
        <TopBar mode={mode} hidden={scene.kind === "ident"} />
        <div key={`${scene.id}-${loop}`} className="flex-1 min-h-0 flex">
          {scene.kind === "ident" && <Ident street={street} />}
          {scene.kind === "welcome" && welcome && <WelcomeScene welcome={welcome} />}
          {scene.kind === "sector" && <SectorView s={scene} street={street} seconds={seconds} />}
          {scene.kind === "proof" && <Proof street={street} />}
          {scene.kind === "visit" && <Visit street={street} />}
        </div>
        <Progress story={story} index={index} seconds={seconds} loop={loop} />
      </div>
    </div>
  );
}

/* ── Backgrounds: films for the businesses, a living gold field for the rest ── */

function Backdrops({ activeSector, kind, seconds, street, light }: { activeSector: string | null; kind: Scene["kind"]; seconds: number; street: boolean; light: boolean }) {
  const videos = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    for (const s of SECTORS) {
      const v = videos.current[s.id];
      if (!v) continue;
      if (s.id === activeSector) { v.currentTime = 0; void v.play().catch(() => {}); }
      else v.pause();
    }
  }, [activeSector]);

  return (
    <div className="absolute inset-0">
      {/* Brand field: ident, welcome, proof — gold glow on black indoors, warm ivory outdoors */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: !light && (kind === "ident" || kind === "welcome" || kind === "proof") ? 1 : 0 }}>
        <div className="vx-aurora absolute -inset-[20%]" />
      </div>
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: light ? 1 : 0, background: "radial-gradient(60% 70% at 75% 25%, #FFFFFF 0%, rgba(255,255,255,0) 70%), radial-gradient(50% 60% at 15% 85%, rgba(197,178,122,0.28) 0%, rgba(197,178,122,0) 70%), #F5F0E6" }} />

      {/* Visit: the building itself */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "visit" ? 1 : 0 }}>
        <Image src="/photos/company-A-head-office.jpg" alt="" fill sizes="100vw" priority={false}
          className={kind === "visit" ? "object-cover vx-kenburns" : "object-cover"} style={{ filter: street ? "brightness(0.72) saturate(1.05)" : "brightness(0.38) saturate(0.9)", ["--dur" as string]: `${seconds}s` }} />
      </div>

      {SECTORS.map((s) => (
        <div key={s.id} className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: activeSector === s.id ? 1 : 0 }}>
          <video
            ref={(el) => { videos.current[s.id] = el; }}
            src={s.film} poster={s.poster} muted loop playsInline preload="auto"
            className={`absolute inset-0 h-full w-full object-cover ${activeSector === s.id ? "vx-kenburns" : ""}`}
            style={{ filter: street ? s.streetGrade ?? "brightness(0.95) contrast(1.08) saturate(1.12)" : s.grade ?? "brightness(0.68) contrast(1.06)", ["--dur" as string]: `${seconds}s` }}
          />
        </div>
      ))}

      {/* Scrims: the type always sits on dark, whatever the footage does.
          Outdoors they are lighter and confined to where the words are, so the
          film itself stays bright in daylight. */}
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: light ? 0 : 1, background: street
        ? "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, rgba(0,0,0,0) 70%)"
        : "linear-gradient(90deg, rgba(9,9,10,0.88) 0%, rgba(9,9,10,0.45) 48%, rgba(9,9,10,0.15) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none transition-opacity duration-[1400ms]" style={{ opacity: light ? 0 : 1, background: street
        ? "linear-gradient(0deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 46%), linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 16%)"
        : "linear-gradient(0deg, rgba(9,9,10,0.92) 0%, rgba(9,9,10,0) 55%), linear-gradient(180deg, rgba(9,9,10,0.75) 0%, rgba(9,9,10,0) 22%)" }} />
    </div>
  );
}

/* ── Chrome ─────────────────────────────────────────────────────────────── */

function TopBar({ mode, hidden }: { mode: Mode; hidden: boolean }) {
  const { time, date } = useKioskClock();
  const weather = useKioskWeather();
  const W = weatherEntry(weather.code).icon;

  return (
    <header className="flex items-start justify-between transition-opacity duration-700" style={{ opacity: hidden ? 0 : 1 }}>
      <div className="flex items-center" style={{ gap: "1.6vmin" }}>
        <Image src="/logo.png" alt="Vitorra Holdings" width={120} height={120} style={{ width: "6.4vmin", height: "auto" }} priority />
        <div className="leading-none">
          <p className="font-display" style={{ fontSize: "3vmin", letterSpacing: "-0.01em" }}>Vitorra</p>
          <p className="uppercase" style={{ fontSize: "1.15vmin", letterSpacing: "0.32em", color: "var(--vx-gold)", marginTop: "0.7vmin" }}>Holdings Limited</p>
        </div>
      </div>
      {mode === "reception" ? (
        <div className="text-right leading-none">
          <p className="font-display tabular-nums" style={{ fontSize: "5vmin", fontWeight: 300 }}>{time}</p>
          <p className="uppercase flex items-center justify-end" style={{ fontSize: "1.2vmin", letterSpacing: "0.24em", color: "var(--vx-muted)", marginTop: "1vmin", gap: "1vmin" }}>
            <span>{date}</span>
            {weather.tempNow !== null && <><span style={{ color: "var(--vx-gold)" }}>·</span><W style={{ width: "1.6vmin", height: "1.6vmin" }} /><span>{weather.tempNow}° Kampala</span></>}
          </p>
        </div>
      ) : (
        <p className="font-display" style={{ fontSize: "3.4vmin", color: "var(--vx-gold)" }}>vitorra.org</p>
      )}
    </header>
  );
}

function Progress({ story, index, seconds, loop }: { story: Scene[]; index: number; seconds: number; loop: number }) {
  return (
    <div className="flex" style={{ gap: "0.8vmin", marginTop: "2.6vmin" }}>
      {story.map((s, n) => (
        <div key={s.id} className="flex-1 overflow-hidden" style={{ height: "0.28vmin", minHeight: 2, background: "var(--vx-track)" }}>
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

function Ident({ street }: { street: boolean }) {
  return (
    <div className="m-auto flex flex-col items-center text-center">
      <Image src="/logo.png" alt="" width={360} height={360} className="vx-rise" style={{ width: street ? "20vmin" : "17vmin", height: "auto", ["--d" as string]: "0.1s" }} priority />
      <div className="vx-draw" style={{ width: "26vmin", height: 1, background: "var(--vx-gold)", margin: "4vmin 0 3vmin", ["--d" as string]: "0.7s" }} />
      <p className="vx-rise uppercase" style={{ fontSize: "1.7vmin", letterSpacing: "0.5em", color: "var(--vx-muted)", ["--d" as string]: "1s" }}>Vitorra Holdings Limited · Kampala</p>
      <h1 className="font-display vx-rise" style={{ fontSize: street ? "9.5vmin" : "8vmin", fontWeight: street ? 400 : 300, lineHeight: 1.02, letterSpacing: "-0.025em", marginTop: "3vmin", ["--d" as string]: "1.4s" }}>
        Four businesses. <em className="not-italic" style={{ color: "var(--vx-gold)", fontStyle: "italic" }}>One standard.</em>
      </h1>
    </div>
  );
}

function WelcomeScene({ welcome }: { welcome: NonNullable<Welcome> }) {
  const chars = Array.from(welcome.name).length;
  return (
    <div className="self-end w-full" style={{ paddingBottom: "4vmin" }}>
      <p className="vx-rise uppercase" style={{ fontSize: "1.6vmin", letterSpacing: "0.42em", color: "var(--vx-gold)", ["--d" as string]: "0.2s" }}>Today at Vitorra</p>
      <h1 className="font-display" style={{ fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 0.98, marginTop: "2.4vmin" }}>
        <span className="vx-rise block" style={{ fontSize: "11vmin", ["--d" as string]: "0.45s" }}>Welcome,</span>
        <span className="vx-rise block italic" style={{ color: "var(--vx-gold)", fontSize: `min(11vmin, calc(150vw / ${Math.max(chars, 9)}))`, ["--d" as string]: "0.8s" }}>{welcome.name}</span>
      </h1>
      <p className="vx-rise" style={{ fontSize: "2.6vmin", color: "var(--vx-muted)", marginTop: "3.4vmin", maxWidth: "70vmin", ["--d" as string]: "1.2s" }}>
        {welcome.line || "Please make yourself comfortable. Someone will be with you shortly."}
      </p>
    </div>
  );
}

function SectorView({ s, street, seconds }: { s: SectorScene; street: boolean; seconds: number }) {
  const n = useCountUp(s.stat.value, s.stat.decimals ?? 0, 1800, 900);
  const qr = street ? "22vmin" : "16vmin";
  return (
    <div className="w-full grid portrait:grid-cols-1 landscape:grid-cols-[minmax(0,1fr)_auto] items-end" style={{ gap: "5vmin" }}>
      {/* Words */}
      <div className="min-w-0 portrait:order-2" style={{ paddingBottom: "1vmin" }}>
        <p className="vx-rise flex items-center uppercase" style={{ gap: "2vmin", fontSize: "1.6vmin", letterSpacing: "0.36em", ["--d" as string]: "0.15s" }}>
          <span style={{ color: "var(--vx-gold)" }}>{s.index} / 04</span>
          <span className="vx-draw" style={{ width: "7vmin", height: 1, background: "var(--vx-gold)", ["--d" as string]: "0.4s" }} />
          <span>{s.tag}</span>
        </p>
        <h2 className="font-display" style={{ fontWeight: street ? 400 : 300, letterSpacing: "-0.028em", lineHeight: 1.0, marginTop: "3vmin", fontSize: street ? "9vmin" : "7.6vmin" }}>
          <span className="vx-rise block" style={{ ["--d" as string]: "0.45s" }}>{s.line1}</span>
          <span className="vx-rise block italic" style={{ color: "var(--vx-gold)", ["--d" as string]: "0.75s" }}>{s.line2}</span>
        </h2>
      </div>

      {/* Number + QR */}
      <div className="flex flex-col items-end portrait:items-start portrait:order-1 portrait:mb-auto" style={{ gap: "4vmin" }}>
        <div className="text-right portrait:text-left vx-rise" style={{ ["--d" as string]: "0.6s" }}>
          <p className="font-display tabular-nums leading-none" style={{ fontWeight: street ? 300 : 200, fontSize: street ? "30vmin" : "24vmin", letterSpacing: "-0.05em" }}>
            {s.stat.prefix}{n}
            <span style={{ fontSize: "0.32em", color: "var(--vx-gold)", letterSpacing: "-0.01em", marginLeft: "0.08em" }}>{s.stat.unit}</span>
          </p>
          <p className="landscape:ml-auto" style={{ fontSize: street ? "2.1vmin" : "1.9vmin", color: "var(--vx-muted)", marginTop: "1.4vmin", maxWidth: "52vmin" }}>{s.stat.caption}</p>
        </div>
        <QrCard src={s.qr.src} label={s.qr.label} size={qr} delay={`${Math.min(2.2, seconds / 5)}s`} />
      </div>
    </div>
  );
}

function Proof({ street }: { street: boolean }) {
  return (
    <div className="self-end w-full" style={{ paddingBottom: "1vmin" }}>
      <p className="vx-rise uppercase" style={{ fontSize: "1.6vmin", letterSpacing: "0.42em", color: "var(--vx-gold)", ["--d" as string]: "0.15s" }}>Behind our products</p>
      <h2 className="font-display vx-rise" style={{ fontWeight: street ? 400 : 300, letterSpacing: "-0.028em", lineHeight: 1, marginTop: "2.6vmin", fontSize: street ? "9vmin" : "7.6vmin", ["--d" as string]: "0.4s" }}>
        Independently <em style={{ color: "var(--vx-gold)" }}>certified.</em>
      </h2>
      <ul className="grid landscape:grid-cols-3 portrait:grid-cols-2" style={{ marginTop: "5vmin", columnGap: "4vmin", rowGap: "3.6vmin" }}>
        {CREDENTIALS.map((c, n) => (
          <li key={c.name} className="vx-rise" style={{ borderTop: "1px solid var(--vx-line)", paddingTop: "2vmin", ["--d" as string]: `${0.8 + n * 0.18}s` }}>
            <p className="font-display" style={{ fontSize: street ? "4.4vmin" : "3.8vmin", fontWeight: street ? 500 : 400, letterSpacing: "-0.01em" }}>{c.name}</p>
            {!street && <p style={{ fontSize: "1.7vmin", color: "var(--vx-muted)", marginTop: "0.8vmin" }}>{c.what}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Visit({ street }: { street: boolean }) {
  return (
    <div className="w-full grid portrait:grid-cols-1 landscape:grid-cols-[minmax(0,1fr)_auto] items-end" style={{ gap: "5vmin" }}>
      <div className="min-w-0">
        <p className="vx-rise uppercase" style={{ fontSize: "1.6vmin", letterSpacing: "0.42em", color: "var(--vx-gold)", ["--d" as string]: "0.15s" }}>{street ? "You are here" : "Visit us"}</p>
        <h2 className="font-display" style={{ fontWeight: street ? 400 : 300, letterSpacing: "-0.028em", lineHeight: 1, marginTop: "2.6vmin", fontSize: street ? "9vmin" : "7.6vmin" }}>
          <span className="vx-rise block" style={{ ["--d" as string]: "0.4s" }}>Padre Pio House,</span>
          <span className="vx-rise block italic" style={{ color: "var(--vx-gold)", ["--d" as string]: "0.7s" }}>Lumumba Avenue, Kampala.</span>
        </h2>
        <div className="vx-rise flex flex-wrap items-baseline" style={{ marginTop: "4vmin", columnGap: "5vmin", rowGap: "1.6vmin", ["--d" as string]: "1.1s" }}>
          <Contact label="Call" value={CONTACT_PHONE} />
          <Contact label="Email" value={CONTACT_EMAIL} />
          <Contact label="Online" value="vitorra.org" />
        </div>
      </div>
      <QrCard src="/display/qr/whatsapp.svg" label="Chat with us on WhatsApp" size={street ? "22vmin" : "16vmin"} delay="1.4s" whatsapp />
    </div>
  );
}

function Contact({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="uppercase block" style={{ fontSize: "1.3vmin", letterSpacing: "0.32em", color: "var(--vx-muted)" }}>{label}</span>
      <span className="font-display block" style={{ fontSize: "3.6vmin", marginTop: "0.6vmin" }}>{value}</span>
    </p>
  );
}

function QrCard({ src, label, size, delay, whatsapp = false }: { src: string; label: string; size: string; delay: string; whatsapp?: boolean }) {
  return (
    <div className="vx-rise flex items-center" style={{ gap: "2.2vmin", ["--d" as string]: delay }}>
      <div className="text-right portrait:order-2 portrait:text-left" style={{ maxWidth: "26vmin" }}>
        <p className="uppercase" style={{ fontSize: "1.25vmin", letterSpacing: "0.32em", color: "var(--vx-gold)" }}>Scan with your phone</p>
        <p className="font-display" style={{ fontSize: "2.6vmin", lineHeight: 1.15, marginTop: "1vmin" }}>{label}</p>
      </div>
      <div className="relative shrink-0 bg-white" style={{ width: size, height: size, padding: "1.2vmin", borderRadius: "1.4vmin", boxShadow: "0 2vmin 6vmin rgba(0,0,0,0.45)", border: "1px solid rgba(0,0,0,0.08)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a static SVG; nothing for the image optimiser to do */}
        <img src={src} alt={label} className="w-full h-full" style={{ imageRendering: "pixelated" }} />
        {whatsapp && (
          <span className="absolute grid place-items-center rounded-full bg-white" style={{ width: "22%", height: "22%", left: "39%", top: "39%" }}>
            <svg viewBox="0 0 24 24" style={{ width: "78%", height: "78%" }} fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
          </span>
        )}
      </div>
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

/** The welcome set by reception (Operations → Reception screen). Never fetched for the street screen. */
function useWelcome(mode: Mode): Welcome {
  const [w, setW] = useState<Welcome>(null);
  useEffect(() => {
    if (mode !== "reception") return;
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
      style={{ top: "4.6vmin", opacity: hint ? 1 : 0 }}>
      <p className="rounded-full" style={{ fontSize: "1.5vmin", letterSpacing: "0.12em", padding: "1vmin 2.2vmin", background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(6px)" }}>
        Click or tap anywhere for full screen · press F to toggle
      </p>
    </div>
  );
}
