/* ─── When an item of the running order may show ─────────────────────────────
   Set in Screen editor → Running order, for built-in scenes and for Vitorra's
   own videos and designs alike: an optional first and last day, and optional
   daily hours, all by Kampala's clock (the screens may be set to any time zone).

   - Days are whole calendar days in Kampala: "until 15 December" plays to the
     end of the 15th.
   - Daily hours run from `daily_from` up to (not including) `daily_until`. A
     window that ends earlier than it starts runs past midnight (20:00 to 02:00).
     Only a start: from then to midnight. Only an end: from midnight until then.

   House content only. Paid adverts on the street screen keep their own clock
   (programme.ts): a scheduled item leaving or joining changes which of our
   scenes fill the unsold time, never how many paid plays a cycle has.
   ─────────────────────────────────────────────────────────────────────────── */

export type Schedule = {
  starts_on?: string | null;
  ends_on?: string | null;
  daily_from?: string | null;
  daily_until?: string | null;
};

export type ScheduleState =
  | "always"     // nothing set
  | "showing"    // set, and on now
  | "later"      // in its dates, outside its hours right now
  | "scheduled"  // its first day is still to come
  | "ended";     // its last day has passed

const FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Kampala", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

/** Kampala's date (YYYY-MM-DD) and minute of the day. */
export function kampala(date: Date): { day: string; mins: number } {
  const p = Object.fromEntries(FMT.formatToParts(date).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, mins: (Number(p.hour) % 24) * 60 + Number(p.minute) };
}

/** "06:30" → 390; null for anything else. */
export function minutesOf(t?: string | null): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec((t ?? "").trim());
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

const dayOf = (d?: string | null) => (d ? d.slice(0, 10) : "");

export function hasSchedule(s?: Schedule | null): boolean {
  return !!s && !!(dayOf(s.starts_on) || dayOf(s.ends_on) || minutesOf(s.daily_from) !== null || minutesOf(s.daily_until) !== null);
}

/** Whether a minute of the day falls inside the daily hours. */
export function inHours(s: Schedule, mins: number): boolean {
  const from = minutesOf(s.daily_from);
  const until = minutesOf(s.daily_until);
  if (from === null && until === null) return true;
  const a = from ?? 0;
  const b = until ?? 24 * 60;
  if (a === b) return true; // refused when saving; never blank the item over it
  return a < b ? mins >= a && mins < b : mins >= a || mins < b;
}

export function scheduleState(s: Schedule | null | undefined, date: Date): ScheduleState {
  if (!s || !hasSchedule(s)) return "always";
  const { day, mins } = kampala(date);
  if (dayOf(s.starts_on) && day < dayOf(s.starts_on)) return "scheduled";
  if (dayOf(s.ends_on) && day > dayOf(s.ends_on)) return "ended";
  return inHours(s, mins) ? "showing" : "later";
}

/** Whether the item may play at this moment. */
export function isShowing(s: Schedule | null | undefined, date: Date): boolean {
  const st = scheduleState(s, date);
  return st === "always" || st === "showing";
}

const shortDay = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** The schedule in a few words, for the console: "1 Dec to 15 Dec · 06:30 to 10:00". */
export function describeSchedule(s?: Schedule | null): string {
  if (!s || !hasSchedule(s)) return "";
  const a = dayOf(s.starts_on), b = dayOf(s.ends_on);
  const days = a && b ? (a === b ? shortDay(a) : `${shortDay(a)} to ${shortDay(b)}`) : a ? `from ${shortDay(a)}` : b ? `until ${shortDay(b)}` : "";
  const from = minutesOf(s.daily_from) !== null ? s.daily_from!.trim() : null;
  const until = minutesOf(s.daily_until) !== null ? s.daily_until!.trim() : null;
  const hours = from && until ? `${from} to ${until}` : from ? `from ${from} daily` : until ? `until ${until} daily` : "";
  return [days, hours].filter(Boolean).join(" · ");
}

/** What the console says about an item right now. */
export const STATE_LABEL: Record<ScheduleState, string> = {
  always: "",
  showing: "Showing now",
  later: "Not in its hours now",
  scheduled: "Scheduled",
  ended: "Ended",
};
