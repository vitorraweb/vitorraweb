/* ─── The screen's story ───────────────────────────────────────────────────────
   One loop, about three minutes, built like international outdoor advertising
   rather than a dashboard: dark saturated worlds, one idea at a time, type you
   can read from across the road in two or three seconds.

   Each business keeps its long film slot. Inside that slot the film runs through
   four moments (picture, headline, proof, call to action), and any single frame
   still makes sense to someone who only glances up once.

   Copy rules (same as the website): no claim beyond what the product's own
   testing and clearance say. FET's 13.9% is one test on one vehicle, never a
   promise. SEAL says US FDA only. Coffee is export only: the retail shop is
   closed, so nothing here may read as an offer to buy a cup or a bag in Kampala.
   ─────────────────────────────────────────────────────────────────────────── */

/** reception: a TV in the lobby · street: the screen facing the road
 *  · projector: the reception story projected onto a wall (projectors cannot show
 *  black, so it is bright, heavy and high-contrast). */
export type Mode = "reception" | "street" | "projector";

/** Kampala time of day. The copy and the darkness of the picture follow it. */
export type Daypart = "morning" | "day" | "rush" | "night";

export const DAYPARTS: Daypart[] = ["morning", "day", "rush", "night"];

function kampalaMinutes(date: Date): number {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kampala", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(date).split(":").map(Number);
  return (h % 24) * 60 + m;
}

/** The street screen's picture against the light outside. Kampala sits on the equator, so
 *  sunrise and sunset barely move through the year and a clock is a fair light meter. */
export type Light = "sun" | "soft" | "night";

export function lightAt(date: Date): Light {
  const mins = kampalaMinutes(date);
  if (mins >= 510 && mins < 990) return "sun";     // 08:30 to 16:30
  if (mins >= 405 && mins < 1140) return "soft";   // 06:45 to 08:30, 16:30 to 19:00
  return "night";
}

/** The light for a previewed time of day (?at=day), matching what that part of the day looks like. */
export const LIGHT_FOR: Record<Daypart, Light> = { morning: "soft", day: "sun", rush: "soft", night: "night" };

/** Morning runs 05:00–10:00, rush 16:30–20:00, night 20:00–05:00. */
export function daypartAt(date: Date): Daypart {
  const mins = kampalaMinutes(date);
  if (mins >= 300 && mins < 600) return "morning";
  if (mins >= 990 && mins < 1200) return "rush";
  if (mins >= 1200 || mins < 300) return "night";
  return "day";
}

/** A photograph that takes over from the film for one moment. Every message
 *  gets its own picture, composed around the words. */
export type Still = {
  src: string;
  /** Which part of the picture to keep in frame. */
  position?: string;
  filter?: string;
  /** Slides the picture sideways to clear room for the words, as on black. */
  shift?: string;
  /** How the business's colour falls across it: from the left, from below, or as a solid field. */
  wash?: Wash;
};

export type Wash = "left" | "bottom" | "full" | "none";

/** One idea on screen: a huge number or a huge line, and at most one small line. */
export type Moment = {
  number?: { value: number; decimals?: number; unit: string; size: number; beside?: boolean };
  lines: string[];
  /** Which of `lines` carry the business's accent colour. */
  accent?: number[];
  small?: string;
  still?: Still;
  /** The width the words may take, in cqmin (the frame is 178 wide). */
  room?: number;
  /** The largest the headline may be, in cqmin. */
  max?: number;
};

/** Where each moment begins, as a share of the film's slot (24s: 0, 3, 13, 19). */
export const MOMENT_STARTS = [0, 0.125, 0.54, 0.79];

export type SectorScene = {
  kind: "sector";
  id: string;
  tag: string;
  film: string;
  poster: string;
  /** CSS filter to bring a film into the same dark world as the others (reception). */
  grade?: string;
  /** The same for the street screen, where everything is brighter for daylight. */
  streetGrade?: string;
  /** The business's one vivid colour, and the deep colour its words sit on. */
  accent: string;
  tint: string;
  /** A cut-out shown alone on the deep colour during the headline. */
  product?: { src: string; alt: string };
  hero: Moment;
  proof: Moment;
  /** Other headlines, one each time the loop comes round, so the screen does not repeat itself. */
  more?: Moment[];
  /** Replaces the headline and proof at certain times of day. */
  timed?: Partial<Record<Daypart, { hero: Moment; proof: Moment }>>;
  /** QR for people who can stop; a short address for the road, where nobody should scan. */
  qr: { src: string; label: string };
  url: string;
  ctaStill?: Still;
  /** A line with some personality above the plain instruction. */
  cta?: { lines: string[]; sub: string };
};

/** A feature film played once, start to finish, with captions timed to it. */
export type ReelScene = {
  kind: "reel";
  id: string;
  tag: string;
  film: string;
  poster: string;
  accent: string;
  /** CSS filter for footage straight from a phone; finished films have none. */
  grade?: string;
  /** Seconds the scene holds: the film's own length. */
  length: number;
  /** Captions shown between `from` and `to` seconds; none while the film shows its own titles. */
  /** `sub` shows as smaller accent lines under a large title, in place of line2. */
  captions: { from: number; to: number; line1: string; line2?: string; sub?: string[] }[];
};

/** A video or 1080 design of Vitorra's own, added in the console's Screen editor. */
export type MediaScene = {
  kind: "media";
  id: string;
  media: "video" | "image";
  url: string;
  seconds: number;
  line1?: string | null;
  line2?: string | null;
  screens: string[];
};

/** The running order from the Screen editor: scene ids in order, and those switched off. */
export type Programme = { order: string[]; hidden: string[] };

export type Scene =
  | { kind: "ident"; id: "ident" }
  | MediaScene
  | ReelScene
  | { kind: "welcome"; id: "welcome" }
  | SectorScene
  | { kind: "proof"; id: "proof" }
  | { kind: "visit"; id: "visit" };

/* Every FET headline carries the test beside it: a saving is only ever stated
   as what one test measured, never as a promise. */
const FET_SMALL = "13.9% measured on one working VW T5 · CTI GmbH, Germany";
const FET_RESULT: Moment = {
  number: { value: 13.9, decimals: 1, unit: "%", size: 47 },
  lines: ["FUEL SAVED"],
  accent: [0],
  small: "Measured on one working VW T5 · CTI GmbH, Germany",
  max: 9.5,
  still: { src: "/display/fet-device.jpg", shift: "44%", filter: "brightness(0.82) contrast(1.12) saturate(1.2)", wash: "none" },
};
const FET_LEAD: Moment = {
  lines: ["LESS FUEL", "MORE BUSINESS"],
  accent: [1],
  small: FET_SMALL,
  room: 122,
  max: 16,
  still: { src: "/images/stock/road-mountains.jpg", position: "50% 60%", filter: "brightness(0.7) contrast(1.2) saturate(1.05)", wash: "left" },
};
const FET_LITRE: Moment = {
  lines: ["GO FURTHER", "ON EVERY LITRE"],
  accent: [1],
  small: FET_SMALL,
  room: 122,
  max: 16,
  still: { src: "/images/stock/hills-road.jpg", position: "60% 60%", filter: "brightness(0.68) contrast(1.2) saturate(1)", wash: "left" },
};
const FET_FITTED: Moment = {
  lines: ["FITTED TO THE FUEL LINE", "NOT YOUR ENGINE"],
  accent: [1],
  small: "No engine modification",
  room: 122,
  max: 10.5,
  still: { src: "/display/fet-engine.jpg", position: "60% 50%", filter: "brightness(0.9) contrast(1.1)", wash: "left" },
};
const FET_TRAFFIC: { hero: Moment; proof: Moment } = {
  hero: {
    lines: ["TRAFFIC BURNS FUEL", "WE HELP YOU BURN LESS"],
    accent: [0],
    small: FET_SMALL,
    room: 134,
    max: 13,
    still: { src: "/images/stock/highway-sunset.jpg", position: "50% 70%", filter: "brightness(0.66) contrast(1.24) saturate(0.86)", wash: "bottom" },
  },
  proof: FET_RESULT,
};

const COFFEE_SMALL = "Single-origin Arabica · Mount Elgon";
const COFFEE_EXPORT: Moment = {
  lines: ["BORN ON MOUNT ELGON", "MADE FOR THE WORLD"],
  accent: [1],
  small: "Export orders from 1 tonne · Samples on request",
  room: 118,
  max: 12,
  still: { src: "/images/stock/ship-aerial.jpg", position: "62% 50%", filter: "brightness(0.74) contrast(1.16) saturate(0.82) sepia(0.32)", wash: "left" },
};

export const SECTORS: SectorScene[] = [
  {
    kind: "sector",
    id: "fet",
    tag: "Fuel Eco Tech",
    film: "/videos/fet-hero.mp4",
    poster: "/videos/fet-hero-poster.jpg",
    accent: "#3DF0A0",
    tint: "2,34,26",
    hero: FET_LEAD,
    more: [FET_LITRE, FET_FITTED],
    proof: FET_RESULT,
    timed: { morning: FET_TRAFFIC, rush: FET_TRAFFIC },
    qr: { src: "/display/qr/fet.svg", label: "Book a free fuel assessment" },
    url: "vitorra.org/fet",
  },
  {
    kind: "sector",
    id: "seal",
    tag: "SEAL Wound Spray",
    film: "/videos/seal-hero.mp4",
    poster: "/videos/seal-hero-poster.jpg",
    accent: "#FF2B3A",
    tint: "30,3,8",
    product: { src: "/display/seal-pro.png", alt: "SEAL PRO wound spray" },
    hero: { lines: ["WHEN", "SECONDS", "MATTER"], accent: [2], small: "Hemostatic wound spray", room: 104, max: 21 },
    more: [{ lines: ["SECONDS", "MATTER", "BE READY"], accent: [2], small: "Hemostatic wound spray", room: 104, max: 21 }],
    proof: {
      number: { value: 36, unit: "MONTHS", size: 62, beside: true },
      lines: ["READY WHEN NEEDED"],
      small: "Room temperature · US FDA 510(k) cleared",
      max: 10,
      still: { src: "", wash: "full" },
    },
    qr: { src: "/display/qr/seal.svg", label: "See the three formats" },
    url: "vitorra.org/seal",
    ctaStill: { src: "/images/stock/ambulance-motion.jpg", position: "50% 50%", filter: "brightness(0.8) contrast(1.15) saturate(1.1) hue-rotate(-14deg)", wash: "left" },
  },
  {
    kind: "sector",
    id: "coffee",
    tag: "Vitorra Coffee",
    film: "/videos/coffee-hero.mp4",
    poster: "/videos/coffee-hero-poster.jpg",
    grade: "brightness(0.5) contrast(1.18) saturate(1.25) sepia(0.2)",
    streetGrade: "brightness(0.56) contrast(1.18) saturate(1.28) sepia(0.16)",
    accent: "#FF9D2E",
    tint: "34,15,4",
    hero: {
      lines: ["UGANDA", "IN EVERY CUP"],
      accent: [1],
      small: COFFEE_SMALL,
      room: 112,
      max: 16,
      still: { src: "/photos/process-coffee-hands.jpg", position: "100% 62%", filter: "brightness(0.8) contrast(1.2) saturate(1.2) sepia(0.12)", wash: "left" },
    },
    proof: COFFEE_EXPORT,
    timed: {
      morning: {
        hero: {
          lines: ["WAKE UP", "TO UGANDA"],
          accent: [1],
          small: "Single-origin Mount Elgon Arabica",
          room: 102,
          max: 14,
          still: { src: "/images/stock/coffee-cherries.jpg", position: "100% 44%", filter: "brightness(0.84) contrast(1.12) saturate(1.1)", wash: "left" },
        },
        proof: COFFEE_EXPORT,
      },
    },
    qr: { src: "/display/qr/coffee.svg", label: "Export terms and grades" },
    url: "vitorra.org/coffee",
    ctaStill: { src: "/images/stock/coffee-roaster.jpg", position: "50% 60%", filter: "brightness(0.7) contrast(1.16) saturate(1.1)", wash: "left" },
  },
  {
    kind: "sector",
    id: "logistics",
    tag: "Logistics",
    film: "/videos/logistics-hero.mp4",
    poster: "/videos/logistics-hero-poster.jpg",
    accent: "#38BDFF",
    tint: "3,24,48",
    hero: { lines: ["FROM KAMPALA", "TO WHERE", "BUSINESS MOVES"], accent: [1, 2], small: "Freight · Warehousing · Customs", room: 112, max: 13.5 },
    more: [
      { lines: ["MOVE GOODS", "MOVE BUSINESS"], accent: [1], small: "Freight · Warehousing · Customs", room: 122, max: 17 },
      { lines: ["YOUR CARGO", "OUR ROUTE"], accent: [1], small: "Freight · Warehousing · Customs", room: 122, max: 17 },
    ],
    proof: {
      lines: ["ONE CONTACT", "ALL THE WAY"],
      accent: [1],
      small: "From quote to delivery",
      room: 106,
      max: 15,
      still: { src: "/images/stock/warehouse-dark.jpg", position: "80% 40%", filter: "brightness(0.84) contrast(1.14) saturate(0.9)", wash: "left" },
    },
    qr: { src: "/display/qr/logistics.svg", label: "Request a freight quote" },
    url: "vitorra.org/freight",
    ctaStill: { src: "", wash: "full" },
    cta: { lines: ["READY TO MOVE?"], sub: "GET A FREIGHT QUOTE" },
  },
];

/* The FET film: the device in 3D, a cut-away of fuel passing through it, and
   where it sits in an engine, ending on the Fuel Eco Tech logo (from 21s, so
   the captions step aside). Captions say only what vitorra.org already says. */
export const FET_REEL: ReelScene = {
  kind: "reel",
  id: "fet-reel",
  tag: "Fuel Eco Tech",
  film: "/videos/fet-reel.mp4",
  poster: "/videos/fet-reel-poster.jpg",
  accent: "#3DF0A0",
  length: 27.5,
  captions: [
    // "German-tested", and 13.9% from one test: the evidence does not support
    // "German-engineered" or "up to 15%" (the top of one vehicle's range, with new
    // injectors and EGR fitted first). See PROGRESS.md.
    { from: 2.6, to: 9.2, line1: "GERMAN-TESTED TECHNOLOGY", sub: ["13.9% LESS FUEL IN ONE VEHICLE TEST"] },
    { from: 9.8, to: 14.2, line1: "EASY INSTALLATION", sub: ["FITTED DIRECTLY INTO THE FUEL LINE", "NO ENGINE MODIFICATION OR ECU REMAPPING REQUIRED"] },
    { from: 14.8, to: 20.4, line1: "ENGINEERED FOR PETROL AND DIESEL", sub: ["PERSONAL VEHICLES, PUBLIC TRANSPORT, CONSTRUCTION", "& HEAVY EQUIPMENT, MARINE, FLEETS & LOGISTICS"] },
  ],
};

/* A real fitting in Kampala, November 2026: the car, the device in hand, the
   engine bay, the fitting, the device in the fuel line. The first second of the
   original is trimmed because the customer's number plate is readable in it.
   No caption for the first five seconds: the device and its label are the shot. */
export const FET_INSTALL: ReelScene = {
  kind: "reel",
  id: "fet-install",
  tag: "Fuel Eco Tech",
  film: "/videos/fet-install.mp4",
  poster: "/videos/fet-install-poster.jpg",
  accent: "#3DF0A0",
  grade: "brightness(0.96) contrast(1.12) saturate(1.14)",
  length: 18.8,
  captions: [
    { from: 4.9, to: 8.4, line1: "A real installation.", line2: "Kampala, Uganda." },
    { from: 8.9, to: 13.6, line1: "Fitted to the fuel line,", line2: "not your engine." },
    { from: 14.1, to: 18.1, line1: "Fuel Eco Tech, fitted.", line2: "Ask for a free fuel assessment." },
  ],
};

/** Every photograph the moments use, loaded up front so none ever fades in half-drawn. */
export const STILLS: string[] = Array.from(new Set(SECTORS.flatMap((s) => [
  s.hero.still, s.proof.still, s.ctaStill, ...(s.more ?? []).map((m) => m.still),
  ...Object.values(s.timed ?? {}).flatMap((t) => [t.hero.still, t.proof.still]),
]).map((v) => v?.src).filter((v): v is string => !!v)));

/** Words that are not part of a business's story. */
const UI = {
  ident: "CONNECTING INNOVATION WITH BUSINESS OPPORTUNITIES",
  welcomeLabel: "Today at Vitorra",
  welcomeLine: "Please make yourself comfortable. Someone will be with you shortly.",
  proofHeading: "Proof, not promises",
  visitTag: "Visit us",
  visit1: "FIND VITORRA",
  visit2: "ON LUMUMBA AVENUE",
  roadTag: "Vitorra",
  road1: "YOU'LL FIND US HERE",
  road2: "PADRE PIO HOUSE",
  scan: "Scan with your phone",
  news: "Vitorra News",
  advert: "Advertisement",
};

/* ─── Editable wording ────────────────────────────────────────────────────────
   Console → Operations → Screen wording changes the words without a release.
   One walk over the story both lists every editable line (for the console) and
   applies the saved changes (for the screens), so the two can never disagree.
   Numbers, prices, links and pictures are deliberately not fields: a proof
   figure should only change through the evidence behind it.                  */

export type CopyField = { key: string; group: string; label: string; value: string; preview: string; optional?: boolean };
type Say = (f: CopyField) => string;

export type ScreenCopy = {
  sectors: SectorScene[];
  reels: ReelScene[];
  ticker: string[];
  credentials: { name: string; what: string }[];
  ui: typeof UI;
};

const EXTRA_TICKER_LINES = 3;

function walk(say: Say): ScreenCopy {
  const seen = new Map<Moment, Moment>(); // Shared moments are one set of fields, not two.

  const moment = (path: string, group: string, name: string, m: Moment, preview: string): Moment => {
    const done = seen.get(m);
    if (done) return done;
    const said = m.lines.map((value, i) => ({ i, text: say({ key: `${path}.line${i}`, group, label: `${name}: line ${i + 1}`, value, preview, optional: m.lines.length > 1 }) }));
    const kept = said.filter((l) => l.text.trim());
    const lines = kept.length ? kept : m.lines.map((text, i) => ({ i, text }));
    const out: Moment = {
      ...m,
      lines: lines.map((l) => l.text),
      accent: m.accent ? lines.flatMap((l, n) => (m.accent?.includes(l.i) ? [n] : [])) : undefined,
    };
    if (m.number && /[a-z]/i.test(m.number.unit)) {
      out.number = { ...m.number, unit: say({ key: `${path}.unit`, group, label: `${name}: word beside the number`, value: m.number.unit, preview }) };
    }
    if (m.small !== undefined) {
      out.small = say({ key: `${path}.small`, group, label: `${name}: small line`, value: m.small, preview, optional: true }) || undefined;
    }
    seen.set(m, out);
    return out;
  };

  const sectors = SECTORS.map((s) => {
    const group = s.tag;
    const at = (q: string) => `scene=${s.id}&${q}`;
    const next: SectorScene = { ...s, tag: say({ key: `${s.id}.tag`, group, label: "Business name", value: s.tag, preview: at("moment=0") }) };
    next.hero = moment(`${s.id}.hero`, group, "Main headline", s.hero, at("moment=1"));
    next.more = s.more?.map((m, i) => moment(`${s.id}.more${i}`, group, `Next loop headline ${i + 1}`, m, at(`moment=1&turn=${i + 1}`)));
    next.proof = moment(`${s.id}.proof`, group, "Proof", s.proof, at("moment=2"));
    if (s.timed) {
      next.timed = Object.fromEntries((Object.entries(s.timed) as [Daypart, { hero: Moment; proof: Moment }][]).map(([part, t]) => {
        const words = part === "morning" && s.id === "coffee" ? "Morning headline" : "Rush-hour headline";
        return [part, {
          hero: moment(`${s.id}.${part}`, group, words, t.hero, at(`moment=1&at=${part}`)),
          proof: moment(`${s.id}.proof`, group, "Proof", t.proof, at(`moment=2&at=${part}`)),
        }];
      }));
    }
    next.qr = { ...s.qr, label: say({ key: `${s.id}.cta`, group, label: s.cta ? "Call to action: plain instruction (used on QR codes)" : "Call to action", value: s.qr.label, preview: at("moment=3") }) };
    if (s.cta) {
      next.cta = {
        lines: s.cta.lines.map((value, i) => say({ key: `${s.id}.cta.line${i}`, group, label: "Call to action: headline", value, preview: at("moment=3") })),
        sub: say({ key: `${s.id}.cta.sub`, group, label: "Call to action: line under it", value: s.cta.sub, preview: at("moment=3") }),
      };
    }
    return next;
  });

  const reels = [FET_REEL, FET_INSTALL].map((r) => {
    const group = r === FET_REEL ? "Fuel Eco Tech: 3D film captions" : "Fuel Eco Tech: installation film captions";
    const preview = `scene=${r.id}`;
    return {
      ...r,
      captions: r.captions.map((c, i) => ({
        ...c,
        line1: say({ key: `${r.id}.c${i}.title`, group, label: `Caption ${i + 1}: title`, value: c.line1, preview }),
        line2: c.line2 === undefined ? undefined : say({ key: `${r.id}.c${i}.line`, group, label: `Caption ${i + 1}: second line`, value: c.line2, preview, optional: true }),
        sub: c.sub?.map((value, n) => say({ key: `${r.id}.c${i}.sub${n}`, group, label: `Caption ${i + 1}: line ${n + 2}`, value, preview, optional: true })).filter((l) => l.trim()),
      })),
    };
  });

  const group = "Ticker";
  const ticker = [
    ...TICKER_LINES.map((value, i) => say({ key: `ticker.${i}`, group, label: `Line ${i + 1}`, value, preview: "scene=ident", optional: true })),
    ...Array.from({ length: EXTRA_TICKER_LINES }, (_, i) => say({ key: `ticker.extra${i}`, group, label: `Extra line ${i + 1}`, value: "", preview: "scene=ident", optional: true })),
  ].filter((l) => l.trim());

  const credentials = CREDENTIALS.map((c, i) => ({
    name: say({ key: `cred.${i}.name`, group: "Credentials", label: `Credential ${i + 1}: name`, value: c.name, preview: "scene=proof" }),
    what: say({ key: `cred.${i}.what`, group: "Credentials", label: `Credential ${i + 1}: what it covers`, value: c.what, preview: "scene=proof", optional: true }),
  }));

  const uiField = (key: keyof typeof UI, group: string, label: string, preview: string, optional = false) =>
    say({ key: `ui.${key}`, group, label, value: UI[key], preview, optional });
  const ui: typeof UI = {
    ident: uiField("ident", "Opening", "Line under VITORRA", "scene=ident"),
    welcomeLabel: uiField("welcomeLabel", "Reception welcome", "Small label", "scene=ident&mode=tv"),
    welcomeLine: uiField("welcomeLine", "Reception welcome", "Line when reception leaves it blank", "scene=ident&mode=tv"),
    proofHeading: uiField("proofHeading", "Credentials", "Heading", "scene=proof"),
    visitTag: uiField("visitTag", "Visit (TV and projector)", "Small label", "scene=visit&mode=tv"),
    visit1: uiField("visit1", "Visit (TV and projector)", "Headline: line 1", "scene=visit&mode=tv"),
    visit2: uiField("visit2", "Visit (TV and projector)", "Headline: line 2", "scene=visit&mode=tv"),
    roadTag: uiField("roadTag", "Visit (street screen)", "Small label", "scene=visit"),
    road1: uiField("road1", "Visit (street screen)", "Headline: line 1", "scene=visit"),
    road2: uiField("road2", "Visit (street screen)", "Headline: line 2", "scene=visit"),
    scan: uiField("scan", "Small labels", "Under QR codes", "scene=visit&mode=tv"),
    news: uiField("news", "Small labels", "Ticker label", "scene=ident"),
    advert: uiField("advert", "Small labels", "On paid adverts", "scene=ident"),
  };

  return { sectors, reels, ticker, credentials, ui };
}

/** Where the console keeps unsaved wording for its live preview. */
export const COPY_DRAFT_KEY = "vitorra-screen-copy-draft";
/** Unsaved logo changes from the Screen editor, for its preview. */
export const LOGO_DRAFT_KEY = "vitorra-screen-logo-draft";

/** The logo on the screens: an uploaded replacement (null = /logo.png) and its sizes in % of standard. */
export type ScreenLogo = { url: string | null; corner: number; opening: number };
export const DEFAULT_LOGO: ScreenLogo = { url: null, corner: 100, opening: 100 };

/** Every editable line, for the console. */
export function copyFields(): CopyField[] {
  const fields: CopyField[] = [];
  walk((f) => { fields.push(f); return f.value; });
  return fields;
}

/** The story's words with the saved changes applied. An empty value hides a line that can be hidden. */
export function applyCopy(changes: Record<string, string>): ScreenCopy {
  return walk((f) => (f.key in changes && (changes[f.key].trim() || f.optional) ? changes[f.key] : f.value));
}

/** The brand frame's montage, faint behind the name. */
/* Daylight copies for the street screen (public/day/…, made by
   scripts/grade_street_daylight.sh): films and photos with the shadows and
   mid-tones lifted, the highlights held and the colour richer, so the picture
   holds up against the sun. Baked into the files, because a live CSS filter
   on moving film is more than the street screen's TV box can draw smoothly. */
const DAY_MEDIA = new Set([
  "/videos/fet-hero.mp4", "/videos/seal-hero.mp4", "/videos/coffee-hero.mp4", "/videos/logistics-hero.mp4", "/videos/fet-reel.mp4", "/videos/fet-install.mp4",
  "/videos/fet-hero-poster.jpg", "/videos/seal-hero-poster.jpg", "/videos/coffee-hero-poster.jpg", "/videos/logistics-hero-poster.jpg", "/videos/fet-reel-poster.jpg", "/videos/fet-install-poster.jpg",
  "/images/stock/ambulance-motion.jpg", "/images/stock/coffee-cherries.jpg", "/images/stock/coffee-roaster.jpg", "/images/stock/highway-sunset.jpg",
  "/images/stock/hills-road.jpg", "/images/stock/kampala-skyline.jpg", "/images/stock/port-aerial.jpg", "/images/stock/road-mountains.jpg",
  "/images/stock/ship-aerial.jpg", "/images/stock/warehouse-dark.jpg", "/photos/process-coffee-hands.jpg", "/photos/company-A-head-office.jpg",
  "/display/fet-device.jpg", "/display/fet-engine.jpg",
]);

/** The daylight copy of a film or photo when there is one (and `day` is on). */
export function dayVersion(src: string, day: boolean): string {
  return day && DAY_MEDIA.has(src) ? `/day${src}` : src;
}

/** Every daylight film, for downloading to the street screen ahead of time. */
export const DAY_FILMS = [...DAY_MEDIA].filter((s) => s.endsWith(".mp4")).map((s) => `/day${s}`);

export const MONTAGE = ["/images/stock/kampala-skyline.jpg", "/images/stock/port-aerial.jpg", "/images/stock/coffee-roaster.jpg"];

/** Every film the screen plays, for the backdrop layer. */
export const FILMS: { id: string; film: string; poster: string; grade?: string; streetGrade?: string; reel?: boolean }[] = [
  { id: FET_REEL.id, film: FET_REEL.film, poster: FET_REEL.poster, reel: true },
  { id: FET_INSTALL.id, film: FET_INSTALL.film, poster: FET_INSTALL.poster, grade: FET_INSTALL.grade, reel: true },
  ...SECTORS,
];

/** Standing lines for the information band, woven between the latest articles. */
export const TICKER_LINES = [
  "Free on-site fuel assessment for fleets: visit vitorra.org/fet",
  "Fuel Eco Tech: 13.9% less fuel in an independent field test by CTI GmbH, Germany",
  "SEAL Wound Spray: US FDA 510(k) cleared, 36-month shelf life",
  "Ugandan Arabica for export: grades, terms and samples on request",
  "Talk to us on WhatsApp: +256 740 026 294",
  "Visit us: Padre Pio House, Plot 32, Lumumba Avenue, Kampala",
];

export const CREDENTIALS = [
  { name: "CTI GmbH", what: "Fuel use measured on a working vehicle" },
  { name: "AVL Technologies", what: "Laboratory validation" },
  { name: "qm-solutions GmbH", what: "German product certification" },
  { name: "ISO 9001:2015", what: "Quality management" },
  { name: "ISO 14001:2015", what: "Environmental management" },
  { name: "Zurich Insurance", what: "Product liability" },
];

/** The default wording, before any changes load. Kept below everything it reads. */
export const DEFAULT_COPY = applyCopy({});

/** Seconds each kind of scene holds — long enough to watch the film and read
 *  every moment, the pace of a lobby film rather than a slideshow. */
export function durationOf(scene: Scene, mode: Mode): number {
  const street = mode === "street";
  switch (scene.kind) {
    case "ident": return 9;
    case "welcome": return 14;
    case "reel": return scene.length;
    case "sector": return street ? 26 : 24;
    case "proof": return 16;
    case "visit": return 18;
    case "media": return scene.seconds;
  }
}

/** The loop for a mode. The welcome is indoor-only: a visitor's name never goes on the street. */
/** The built-in scenes in their original order, with names for the Screen editor. */
export const BUILT_IN_SCENES: { id: string; label: string }[] = [
  { id: "ident", label: "Opening: VITORRA" },
  { id: FET_REEL.id, label: "Fuel Eco Tech: 3D film" },
  { id: FET_INSTALL.id, label: "Fuel Eco Tech: installation film" },
  ...SECTORS.map((s) => ({ id: s.id, label: `${s.tag}: film and messages` })),
  { id: "proof", label: "Credentials" },
  { id: "visit", label: "Visit us" },
];

/** Built-in scenes and the console's own media, put in the editor's running order with
 *  anything switched off left out. The reception welcome always follows the opening. */
export function storyFor(mode: Mode, hasWelcome: boolean, copy: ScreenCopy = DEFAULT_COPY, media: MediaScene[] = [], programme: Programme = { order: [], hidden: [] }): Scene[] {
  const all: Scene[] = [
    { kind: "ident", id: "ident" },
    // FET leads: the film of the device, a real fitting in Kampala, then the result.
    ...copy.reels,
    ...copy.sectors,
    { kind: "proof", id: "proof" },
    { kind: "visit", id: "visit" },
    ...media.filter((m) => m.screens.includes(mode)),
  ];
  const rank = (id: string) => { const n = programme.order.indexOf(id); return n < 0 ? Number.MAX_SAFE_INTEGER : n; };
  const ordered = programme.order.length ? [...all].sort((a, b) => rank(a.id) - rank(b.id)) : all;
  const shown = ordered.filter((s) => !programme.hidden.includes(s.id));
  const story = shown.length ? shown : [all[0]];
  const welcome = mode !== "street" && hasWelcome ? [{ kind: "welcome", id: "welcome" } as const] : [];
  const at = story.findIndex((s) => s.id === "ident");
  return at < 0 ? [...welcome, ...story] : [...story.slice(0, at + 1), ...welcome, ...story.slice(at + 1)];
}
