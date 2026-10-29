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

  return (
    <div className="vx fixed inset-0 overflow-hidden select-none cursor-none" data-mode={mode} style={{ background: "#09090A", color: "#F4EFE6" }}>
      <Backdrops activeSector={activeSector} kind={scene.kind} seconds={seconds} />
      <div className="hero-grain absolute inset-0 pointer-events-none opacity-60" />

      <div className="relative z-10 h-full flex flex-col" style={{ padding: "4.2vmin 5vmin 3.4vmin", translate: `${dx}px ${dy}px`, transition: "translate 4s ease" }}>
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

function Backdrops({ activeSector, kind, seconds }: { activeSector: string | null; kind: Scene["kind"]; seconds: number }) {
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
      {/* Brand field: ident, welcome, proof */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "ident" || kind === "welcome" || kind === "proof" ? 1 : 0 }}>
        <div className="vx-aurora absolute -inset-[20%]" />
      </div>

      {/* Visit: the building itself */}
      <div className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: kind === "visit" ? 1 : 0 }}>
        <Image src="/photos/company-A-head-office.jpg" alt="" fill sizes="100vw" priority={false}
          className={kind === "visit" ? "object-cover vx-kenburns" : "object-cover"} style={{ filter: "brightness(0.38) saturate(0.9)", ["--dur" as string]: `${seconds}s` }} />
      </div>

      {SECTORS.map((s) => (
        <div key={s.id} className="absolute inset-0 transition-opacity duration-[1400ms]" style={{ opacity: activeSector === s.id ? 1 : 0 }}>
          <video
            ref={(el) => { videos.current[s.id] = el; }}
            src={s.film} poster={s.poster} muted loop playsInline preload="auto"
            className={`absolute inset-0 h-full w-full object-cover ${activeSector === s.id ? "vx-kenburns" : ""}`}
            style={{ filter: s.grade ?? "brightness(0.68) contrast(1.06)", ["--dur" as string]: `${seconds}s` }}
          />
        </div>
      ))}

      {/* Scrims: the type always sits on dark, whatever the footage does. */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(90deg, rgba(9,9,10,0.88) 0%, rgba(9,9,10,0.45) 48%, rgba(9,9,10,0.15) 100%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(0deg, rgba(9,9,10,0.92) 0%, rgba(9,9,10,0) 55%), linear-gradient(180deg, rgba(9,9,10,0.75) 0%, rgba(9,9,10,0) 22%)" }} />
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
          <p className="uppercase" style={{ fontSize: "1.15vmin", letterSpacing: "0.32em", color: "#C5B27A", marginTop: "0.7vmin" }}>Holdings Limited</p>
        </div>
      </div>
      {mode === "reception" ? (
        <div className="text-right leading-none">
          <p className="font-display tabular-nums" style={{ fontSize: "5vmin", fontWeight: 300 }}>{time}</p>
          <p className="uppercase flex items-center justify-end" style={{ fontSize: "1.2vmin", letterSpacing: "0.24em", color: "rgba(244,239,230,0.6)", marginTop: "1vmin", gap: "1vmin" }}>
            <span>{date}</span>
            {weather.tempNow !== null && <><span style={{ color: "#C5B27A" }}>·</span><W style={{ width: "1.6vmin", height: "1.6vmin" }} /><span>{weather.tempNow}° Kampala</span></>}
          </p>
        </div>
      ) : (
        <p className="font-display" style={{ fontSize: "3.4vmin", color: "#C5B27A" }}>vitorra.org</p>
      )}
    </header>
  );
}

function Progress({ story, index, seconds, loop }: { story: Scene[]; index: number; seconds: number; loop: number }) {
  return (
    <div className="flex" style={{ gap: "0.8vmin", marginTop: "2.6vmin" }}>
      {story.map((s, n) => (
        <div key={s.id} className="flex-1 overflow-hidden" style={{ height: "0.28vmin", minHeight: 2, background: "rgba(244,239,230,0.16)" }}>
          <div
            key={n === index ? `${loop}-${index}` : s.id}
            className={n === index ? "vx-progress h-full" : "h-full"}
            style={{ background: "#C5B27A", width: "100%", transformOrigin: "left", transform: n < index ? "scaleX(1)" : n > index ? "scaleX(0)" : undefined, ["--dur" as string]: `${seconds}s` }}
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
      <div className="vx-draw" style={{ width: "26vmin", height: 1, background: "#C5B27A", margin: "4vmin 0 3vmin", ["--d" as string]: "0.7s" }} />
      <p className="vx-rise uppercase" style={{ fontSize: "1.7vmin", letterSpacing: "0.5em", color: "rgba(244,239,230,0.75)", ["--d" as string]: "1s" }}>Vitorra Holdings Limited · Kampala</p>
      <h1 className="font-display vx-rise" style={{ fontSize: street ? "9.5vmin" : "8vmin", fontWeight: 300, lineHeight: 1.02, letterSpacing: "-0.025em", marginTop: "3vmin", ["--d" as string]: "1.4s" }}>
        Four businesses. <em className="not-italic" style={{ color: "#C5B27A", fontStyle: "italic" }}>One standard.</em>
      </h1>
    </div>
  );
}

function WelcomeScene({ welcome }: { welcome: NonNullable<Welcome> }) {
  const chars = Array.from(welcome.name).length;
  return (
    <div className="self-end w-full" style={{ paddingBottom: "4vmin" }}>
      <p className="vx-rise uppercase" style={{ fontSize: "1.6vmin", letterSpacing: "0.42em", color: "#C5B27A", ["--d" as string]: "0.2s" }}>Today at Vitorra</p>
      <h1 className="font-display" style={{ fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 0.98, marginTop: "2.4vmin" }}>
        <span className="vx-rise block" style={{ fontSize: "11vmin", ["--d" as string]: "0.45s" }}>Welcome,</span>
        <span className="vx-rise block italic" style={{ color: "#C5B27A", fontSize: `min(11vmin, calc(150vw / ${Math.max(chars, 9)}))`, ["--d" as string]: "0.8s" }}>{welcome.name}</span>
      </h1>
      <p className="vx-rise" style={{ fontSize: "2.6vmin", color: "rgba(244,239,230,0.78)", marginTop: "3.4vmin", maxWidth: "70vmin", ["--d" as string]: "1.2s" }}>
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
          <span style={{ color: "#C5B27A" }}>{s.index} / 04</span>
          <span className="vx-draw" style={{ width: "7vmin", height: 1, background: "rgba(197,178,122,0.7)", ["--d" as string]: "0.4s" }} />
          <span>{s.tag}</span>
        </p>
        <h2 className="font-display" style={{ fontWeight: 300, letterSpacing: "-0.028em", lineHeight: 1.0, marginTop: "3vmin", fontSize: street ? "9vmin" : "7.6vmin" }}>
          <span className="vx-rise block" style={{ ["--d" as string]: "0.45s" }}>{s.line1}</span>
          <span className="vx-rise block italic" style={{ color: "#C5B27A", ["--d" as string]: "0.75s" }}>{s.line2}</span>
        </h2>
      </div>

      {/* Number + QR */}
      <div className="flex flex-col items-end portrait:items-start portrait:order-1 portrait:mb-auto" style={{ gap: "4vmin" }}>
        <div className="text-right portrait:text-left vx-rise" style={{ ["--d" as string]: "0.6s" }}>
          <p className="font-display tabular-nums leading-none" style={{ fontWeight: 200, fontSize: street ? "30vmin" : "24vmin", letterSpacing: "-0.05em" }}>
            {s.stat.prefix}{n}
            <span style={{ fontSize: "0.32em", color: "#C5B27A", letterSpacing: "-0.01em", marginLeft: "0.08em" }}>{s.stat.unit}</span>
          </p>
          <p className="landscape:ml-auto" style={{ fontSize: street ? "2.1vmin" : "1.9vmin", color: "rgba(244,239,230,0.74)", marginTop: "1.4vmin", maxWidth: "52vmin" }}>{s.stat.caption}</p>
        </div>
        <QrCard src={s.qr.src} label={s.qr.label} size={qr} delay={`${Math.min(2.2, seconds / 5)}s`} />
      </div>
    </div>
  );
}

function Proof({ street }: { street: boolean }) {
  return (
    <div className="self-end w-full" style={{ paddingBottom: "1vmin" }}>
      <p className="vx-rise uppercase" style={{ fontSize: "1.6vmin", letterSpacing: "0.42em", color: "#C5B27A", ["--d" as string]: "0.15s" }}>Behind our products</p>
      <h2 className="font-display vx-rise" style={{ fontWeight: 300, letterSpacing: "-0.028em", lineHeight: 1, marginTop: "2.6vmin", fontSize: street ? "9vmin" : "7.6vmin", ["--d" as string]: "0.4s" }}>
        Independently <em style={{ color: "#C5B27A" }}>certified.</em>
      </h2>
      <ul className="grid landscape:grid-cols-3 portrait:grid-cols-2" style={{ marginTop: "5vmin", columnGap: "4vmin", rowGap: "3.6vmin" }}>
        {CREDENTIALS.map((c, n) => (
          <li key={c.name} className="vx-rise" style={{ borderTop: "1px solid rgba(197,178,122,0.35)", paddingTop: "2vmin", ["--d" as string]: `${0.8 + n * 0.18}s` }}>
            <p className="font-display" style={{ fontSize: street ? "4.4vmin" : "3.8vmin", fontWeight: 400, letterSpacing: "-0.01em" }}>{c.name}</p>
            {!street && <p style={{ fontSize: "1.7vmin", color: "rgba(244,239,230,0.6)", marginTop: "0.8vmin" }}>{c.what}</p>}
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
        <p className="vx-rise uppercase" style={{ fontSize: "1.6vmin", letterSpacing: "0.42em", color: "#C5B27A", ["--d" as string]: "0.15s" }}>{street ? "You are here" : "Visit us"}</p>
        <h2 className="font-display" style={{ fontWeight: 300, letterSpacing: "-0.028em", lineHeight: 1, marginTop: "2.6vmin", fontSize: street ? "9vmin" : "7.6vmin" }}>
          <span className="vx-rise block" style={{ ["--d" as string]: "0.4s" }}>Padre Pio House,</span>
          <span className="vx-rise block italic" style={{ color: "#C5B27A", ["--d" as string]: "0.7s" }}>Lumumba Avenue, Kampala.</span>
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
      <span className="uppercase block" style={{ fontSize: "1.3vmin", letterSpacing: "0.32em", color: "rgba(244,239,230,0.55)" }}>{label}</span>
      <span className="font-display block" style={{ fontSize: "3.6vmin", marginTop: "0.6vmin" }}>{value}</span>
    </p>
  );
}

function QrCard({ src, label, size, delay, whatsapp = false }: { src: string; label: string; size: string; delay: string; whatsapp?: boolean }) {
  return (
    <div className="vx-rise flex items-center" style={{ gap: "2.2vmin", ["--d" as string]: delay }}>
      <div className="text-right portrait:order-2 portrait:text-left" style={{ maxWidth: "26vmin" }}>
        <p className="uppercase" style={{ fontSize: "1.25vmin", letterSpacing: "0.32em", color: "#C5B27A" }}>Scan with your phone</p>
        <p className="font-display" style={{ fontSize: "2.6vmin", lineHeight: 1.15, marginTop: "1vmin" }}>{label}</p>
      </div>
      <div className="relative shrink-0 bg-white" style={{ width: size, height: size, padding: "1.2vmin", borderRadius: "1.4vmin", boxShadow: "0 2vmin 6vmin rgba(0,0,0,0.45)" }}>
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
