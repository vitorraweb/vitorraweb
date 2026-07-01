"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  type LucideIcon,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

/* ─── Reception display data hooks ────────────────────────────────────────────
   The `/display` kiosk page is a self-refreshing, unattended screen — every
   hook here polls quietly in the background and always degrades to a sane
   fallback, since nobody is present to dismiss an error state.
   ─────────────────────────────────────────────────────────────────────────── */

/* ── Live clock ───────────────────────────────────────────────────────────── */
export function useKioskClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";
  const date = now
    ? now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return { time, date };
}

/* ── Weather (Open-Meteo — keyless, CORS-open; HQ: Kampala, Uganda) ────────── */
const KAMPALA = { latitude: 0.3476, longitude: 32.5825 };

export type WeatherDay = { label: string; code: number; hi: number; lo: number };
type WeatherState = { tempNow: number | null; code: number | null; days: WeatherDay[] };

const WEATHER_CODE_TABLE: Record<number, { label: string; icon: LucideIcon }> = {
  0: { label: "Clear sky", icon: Sun },
  1: { label: "Mostly clear", icon: CloudSun },
  2: { label: "Partly cloudy", icon: CloudSun },
  3: { label: "Overcast", icon: Cloud },
  45: { label: "Fog", icon: CloudFog },
  48: { label: "Fog", icon: CloudFog },
  51: { label: "Light drizzle", icon: CloudDrizzle },
  53: { label: "Drizzle", icon: CloudDrizzle },
  55: { label: "Dense drizzle", icon: CloudDrizzle },
  56: { label: "Freezing drizzle", icon: CloudDrizzle },
  57: { label: "Freezing drizzle", icon: CloudDrizzle },
  61: { label: "Light rain", icon: CloudRain },
  63: { label: "Rain", icon: CloudRain },
  65: { label: "Heavy rain", icon: CloudRain },
  66: { label: "Freezing rain", icon: CloudRain },
  67: { label: "Freezing rain", icon: CloudRain },
  71: { label: "Light snow", icon: CloudSnow },
  73: { label: "Snow", icon: CloudSnow },
  75: { label: "Heavy snow", icon: CloudSnow },
  77: { label: "Snow grains", icon: CloudSnow },
  80: { label: "Rain showers", icon: CloudRain },
  81: { label: "Rain showers", icon: CloudRain },
  82: { label: "Violent showers", icon: CloudRain },
  95: { label: "Thunderstorm", icon: CloudLightning },
  96: { label: "Thunderstorm, hail", icon: CloudLightning },
  99: { label: "Thunderstorm, hail", icon: CloudLightning },
};

const DEFAULT_WEATHER_ENTRY = { label: "Kampala skies", icon: CloudSun };

/* Returns the {label, icon} entry as a plain object so callers read `.icon`
   via member access rather than a component-returning function call — the
   latter trips the "components created during render" lint rule, since it
   can't tell the returned reference is one of a fixed, stable set. */
export function weatherEntry(code: number | null): { label: string; icon: LucideIcon } {
  return (code !== null && WEATHER_CODE_TABLE[code]) || DEFAULT_WEATHER_ENTRY;
}

export function useKioskWeather(): WeatherState {
  const [state, setState] = useState<WeatherState>({ tempNow: null, code: null, days: [] });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${KAMPALA.latitude}&longitude=${KAMPALA.longitude}` +
          `&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min` +
          `&timezone=Africa%2FKampala&forecast_days=5`;
        const res = await fetch(url);
        const json = await res.json();
        if (cancelled || !json?.daily?.time) return;

        const days: WeatherDay[] = json.daily.time.map((t: string, i: number) => ({
          label: new Date(t).toLocaleDateString("en-GB", { weekday: "short" }),
          code: json.daily.weather_code[i],
          hi: Math.round(json.daily.temperature_2m_max[i]),
          lo: Math.round(json.daily.temperature_2m_min[i]),
        }));

        setState({
          tempNow: json.current ? Math.round(json.current.temperature_2m) : null,
          code: json.current?.weather_code ?? null,
          days,
        });
      } catch {
        /* keep the last known reading — never show an error on an unattended screen */
      }
    };

    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return state;
}

/* ── Live indicative FX (reuses the public /exchange-rate endpoint) ────────── */
export type KioskFx = { ugxPerUsd: number | null; ugxPerEur: number | null };

export function useKioskFx(): KioskFx {
  const [fx, setFx] = useState<KioskFx>({ ugxPerUsd: null, ugxPerEur: null });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/exchange-rate`);
        const json = await res.json();
        const d = json?.data;
        if (!cancelled && d?.ugx_per_usd) {
          setFx({
            ugxPerUsd: d.ugx_per_usd,
            ugxPerEur: d.eur_per_usd ? d.ugx_per_usd / d.eur_per_usd : null,
          });
        }
      } catch {
        /* keep last known rate */
      }
    };

    load();
    const id = setInterval(load, 30 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return fx;
}

/* ── Latest blog headlines for the news ticker ─────────────────────────────── */
export type Headline = { title: string; slug: string };

const FALLBACK_HEADLINES: Headline[] = [
  { title: "Vitorra Holdings — proven fuel savings, healthcare innovation, and premium Ugandan coffee, under one holding company.", slug: "" },
  { title: "Fuel Eco Tech: an independently verified 13.9% fuel reduction, tested by CTI GmbH, Germany, November 2025.", slug: "" },
  { title: "SEAL Hemostatic Wound Spray — FDA-cleared and field-deployed with Maryland EMS.", slug: "" },
  { title: "Vitorra Coffee — Ugandan-grown, farm-direct, graded and exported at origin.", slug: "" },
];

export function useKioskHeadlines(): Headline[] {
  const [items, setItems] = useState<Headline[]>(FALLBACK_HEADLINES);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/blog/posts?per_page=6`);
        const json = await res.json();
        const posts = (json?.data ?? []) as { title: string; slug: string }[];
        if (!cancelled && posts.length) {
          setItems(posts.map((p) => ({ title: p.title, slug: p.slug })));
        }
      } catch {
        /* keep fallback headlines */
      }
    };

    load();
    const id = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return items;
}

/* ── Rotation index — cycles 0..count-1 on a fixed interval. Powers the
   spotlight caption, sector pills, and certification highlight together. ──── */
export function useRotation(count: number, intervalMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), intervalMs);
    return () => clearInterval(id);
  }, [count, intervalMs]);

  return index;
}

/* ── Digit-scramble on value change — same "resolving from chaos" effect as
   the homepage StatsBand, but re-triggered whenever `numeric` changes rather
   than on scroll-into-view (there's no scroll on an unattended kiosk). ────── */
const SCRAMBLE_GLYPHS = "0123456789";

export function useKioskScramble(numeric: string) {
  const [output, setOutput] = useState(numeric);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setOutput(numeric);
      return;
    }

    const TOTAL_FRAMES = 14;
    const FRAME_MS = 55;
    let frame = 0;

    const id = setInterval(() => {
      frame++;
      const lockCount = Math.floor((frame / TOTAL_FRAMES) * numeric.length);
      const chars = numeric.split("").map((ch, i) =>
        /[0-9]/.test(ch) && i >= lockCount
          ? SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
          : ch
      );
      setOutput(chars.join(""));

      if (frame >= TOTAL_FRAMES) {
        clearInterval(id);
        setOutput(numeric);
      }
    }, FRAME_MS);

    return () => clearInterval(id);
  }, [numeric]);

  return output;
}
