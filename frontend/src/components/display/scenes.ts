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

/** Morning runs 05:00–10:00, rush 16:30–20:00, night 20:00–05:00. */
export function daypartAt(date: Date): Daypart {
  const [h, m] = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Kampala", hour: "2-digit", minute: "2-digit", hour12: false })
    .format(date).split(":").map(Number);
  const mins = (h % 24) * 60 + m;
  if (mins >= 300 && mins < 600) return "morning";
  if (mins >= 990 && mins < 1200) return "rush";
  if (mins >= 1200 || mins < 300) return "night";
  return "day";
}

/** One idea on screen: a huge number or a huge line, and at most one small line. */
export type Moment = {
  number?: { value: number; decimals?: number; unit: string };
  lines: string[];
  /** Which of `lines` carry the business's accent colour. */
  accent?: number[];
  small?: string;
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
  /** A cut-out shown alone on the deep colour during the headline and proof. */
  product?: { src: string; alt: string };
  hero: Moment;
  proof: Moment;
  /** Replaces the headline and proof at certain times of day. */
  timed?: Partial<Record<Daypart, { hero: Moment; proof: Moment }>>;
  qr: { src: string; label: string };
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
  captions: { from: number; to: number; line1: string; line2: string }[];
};

export type Scene =
  | { kind: "ident"; id: "ident" }
  | ReelScene
  | { kind: "welcome"; id: "welcome" }
  | SectorScene
  | { kind: "proof"; id: "proof" }
  | { kind: "visit"; id: "visit" };

const FET_RESULT: Moment = {
  number: { value: 13.9, decimals: 1, unit: "%" },
  lines: ["LESS FUEL USED."],
  small: "Measured on one working VW T5 · CTI GmbH, Germany",
};
const FET_PRICE: Moment = {
  lines: ["FROM UGX 1,891,000.", "INSTALLATION INCLUDED."],
  accent: [1],
  small: "No engine modification.",
};
const FET_TRAFFIC = {
  hero: { lines: ["TRAFFIC BURNS FUEL.", "YOUR FLEET SHOULDN'T", "BURN MORE THAN IT NEEDS."], accent: [0] },
  proof: FET_RESULT,
};

const COFFEE_SMALL = "Single-origin Arabica · Mount Elgon";

export const SECTORS: SectorScene[] = [
  {
    kind: "sector",
    id: "fet",
    tag: "Fuel Eco Tech",
    film: "/videos/fet-hero.mp4",
    poster: "/videos/fet-hero-poster.jpg",
    accent: "#3DF0A0",
    tint: "2,34,26",
    hero: FET_RESULT,
    proof: FET_PRICE,
    timed: { morning: FET_TRAFFIC, rush: FET_TRAFFIC },
    qr: { src: "/display/qr/fet.svg", label: "Book a free fuel assessment" },
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
    hero: { lines: ["WHEN", "SECONDS", "MATTER."], accent: [2], small: "Hemostatic wound spray" },
    proof: {
      number: { value: 36, unit: "months" },
      lines: ["SHELF LIFE."],
      small: "Room temperature · US FDA 510(k) cleared",
    },
    qr: { src: "/display/qr/seal.svg", label: "See the three formats" },
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
    hero: { lines: ["UGANDA.", "IN EVERY CUP."], accent: [1], small: COFFEE_SMALL },
    proof: {
      number: { value: 1, unit: "tonne" },
      lines: ["EXPORT MINIMUM."],
      small: "Grades, terms and samples on request",
    },
    timed: {
      morning: {
        hero: { lines: ["START STRONG.", "UGANDAN ARABICA."], accent: [1], small: COFFEE_SMALL },
        proof: {
          number: { value: 1, unit: "tonne" },
          lines: ["EXPORT MINIMUM."],
          small: "Grades, terms and samples on request",
        },
      },
    },
    qr: { src: "/display/qr/coffee.svg", label: "Export terms and grades" },
  },
  {
    kind: "sector",
    id: "logistics",
    tag: "Logistics",
    film: "/videos/logistics-hero.mp4",
    poster: "/videos/logistics-hero-poster.jpg",
    accent: "#38BDFF",
    tint: "3,24,48",
    hero: { lines: ["FROM KAMPALA", "TO WHERE BUSINESS MOVES."], accent: [1], small: "Freight · Warehousing · Customs" },
    proof: { lines: ["ONE NAMED CONTACT.", "QUOTE TO DELIVERY."], accent: [1] },
    qr: { src: "/display/qr/logistics.svg", label: "Request a freight quote" },
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
    { from: 2.6, to: 9.2, line1: "Meet Fuel Eco Tech.", line2: "Precision-built for your fuel line." },
    { from: 9.8, to: 14.2, line1: "Fitted between the fuel pump", line2: "and the filter." },
    { from: 14.8, to: 20.4, line1: "No engine modification.", line2: "From a 1.0L car to a 16L truck." },
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
    { from: 8.9, to: 13.6, line1: "Fitted on the fuel line.", line2: "No engine modification." },
    { from: 14.1, to: 18.1, line1: "Fuel Eco Tech, fitted.", line2: "Ask for a free fuel assessment." },
  ],
};

/** Every film the screen plays, for the backdrop layer. */
export const FILMS: { id: string; film: string; poster: string; grade?: string; streetGrade?: string; reel?: boolean }[] = [
  { id: FET_REEL.id, film: FET_REEL.film, poster: FET_REEL.poster, reel: true },
  { id: FET_INSTALL.id, film: FET_INSTALL.film, poster: FET_INSTALL.poster, grade: FET_INSTALL.grade, reel: true },
  ...SECTORS,
];

/** Standing lines for the information band, woven between the latest articles. */
export const TICKER_LINES = [
  "Free on-site fuel assessment for fleets: scan the code on screen or visit vitorra.org",
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
  }
}

/** The loop for a mode. The welcome is indoor-only: a visitor's name never goes on the street. */
export function storyFor(mode: Mode, hasWelcome: boolean): Scene[] {
  return [
    { kind: "ident", id: "ident" },
    ...(mode !== "street" && hasWelcome ? [{ kind: "welcome", id: "welcome" } as const] : []),
    // FET leads: the film of the device, a real fitting in Kampala, then the result.
    FET_REEL,
    FET_INSTALL,
    ...SECTORS,
    { kind: "proof", id: "proof" },
    { kind: "visit", id: "visit" },
  ];
}
