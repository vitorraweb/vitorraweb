/* ─── The street screen's programme ──────────────────────────────────────────
   Finance's model: a 4-minute cycle of 12 paid 15-second units and at least
   60 seconds of Vitorra's own content. Each sold unit plays once a cycle (a
   Standard booking is one unit, so 15 plays an hour). Unsold units are given
   back to our own content, so the screen is never empty.

   Our content runs as one continuous story across cycles, so every cycle shows
   the next slice of it rather than the same opening. Adverts are spread between
   our scenes as the cycle goes, never over one; when a cycle's own-content time
   runs out, the scene on screen is cut short so the cycle keeps its 4 minutes.
   ─────────────────────────────────────────────────────────────────────────── */

export const CYCLE_SECONDS = 240;
export const UNIT_SECONDS = 15;
export const MIN_HOUSE_SECONDS = 60;
/** A scene shorter than this is not worth starting. */
const MIN_SLICE = 5;

export type Advert = { id: number; url: string; seconds: number; plays_per_hour: number; units: number; kind?: "video" | "image" };

export type Cycle = {
  queue: Advert[];   // still to play this cycle
  total: number;     // paid plays in this cycle
  played: number;
  start: number;     // ms; the cycle runs by the clock, so small delays never add up
};

const CYCLE_MS = CYCLE_SECONDS * 1000;

/** One play per sold unit, interleaved so a 4-unit booking is spread out, not played four in a row.
 *  A new cycle starts where the last one was due to end, so cycles stay exactly four minutes apart. */
export function newCycle(ads: Advert[], now: number, previous: Cycle | null = null): Cycle {
  const queue: Advert[] = [];
  const rounds = Math.max(0, ...ads.map((a) => a.units));
  for (let r = 0; r < rounds; r++) for (const a of ads) if (a.units > r) queue.push(a);
  const due = previous ? previous.start + CYCLE_MS : now;
  return { queue, total: queue.length, played: 0, start: now - due < 10_000 ? due : now };
}

/** Seconds of our own content still available this cycle, after the adverts still to come. */
const left = (c: Cycle, now: number) => (c.start + CYCLE_MS - now) / 1000 - c.queue.length * UNIT_SECONDS;

/** Seconds the next scene of our own content may run (its own length when nothing is sold). */
export function slice(c: Cycle | null, natural: number, now: number): number {
  if (!c || c.total === 0) return natural;
  return Math.max(MIN_SLICE, Math.min(natural, Math.floor(left(c, now))));
}

/** After a scene or an advert: play an advert now, or carry on with our content. */
export function next(c: Cycle, now: number): "advert" | "house" {
  if (c.queue.length === 0) return "house";
  if (left(c, now) < MIN_SLICE) return "advert";
  // Keep the adverts in step with the clock: a quarter of the way through the cycle, a quarter have played.
  return c.played < Math.ceil((c.total * (now - c.start)) / CYCLE_MS) ? "advert" : "house";
}

/** Whether this cycle is finished and a new one should start before the next scene. */
export function spent(c: Cycle, now: number): boolean {
  return c.queue.length === 0 && (c.total === 0 || now >= c.start + CYCLE_MS - MIN_SLICE * 1000);
}
