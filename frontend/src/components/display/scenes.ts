/* ─── The screen's story ───────────────────────────────────────────────────────
   One loop, about three minutes, built like a luxury window display
   rather than a dashboard: one idea per scene, one number you can read from
   the street, and a QR code for the person who stops.

   Copy rules (same as the website): no claim beyond what the product's own
   testing and clearance say. Numbers are the ones published on vitorra.org.
   ─────────────────────────────────────────────────────────────────────────── */

/** reception: a TV in the lobby · street: the screen facing the road (daylight)
 *  · projector: the reception story projected onto a wall (projectors cannot show
 *  black, so it is bright, heavy and high-contrast). */
export type Mode = "reception" | "street" | "projector";

export type SectorScene = {
  kind: "sector";
  id: string;
  index: string;
  tag: string;
  film: string;
  poster: string;
  /** CSS filter to bring a film into the same dark world as the others (reception). */
  grade?: string;
  /** The same for the street screen, where everything is brighter for daylight. */
  streetGrade?: string;
  /** The card's headline, as a few true statements shown in turn (about six seconds each). */
  beats: { line1: string; line2: string }[];
  stat: { value: number; decimals?: number; prefix?: string; unit: string; caption: string };
  qr: { src: string; label: string };
};

/** A feature film played once, start to finish, with captions timed to it. */
export type ReelScene = {
  kind: "reel";
  id: string;
  tag: string;
  film: string;
  poster: string;
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

export const SECTORS: SectorScene[] = [
  {
    kind: "sector",
    id: "fet",
    index: "01",
    tag: "Fuel Eco Tech",
    film: "/videos/fet-hero.mp4",
    poster: "/videos/fet-hero-poster.jpg",
    beats: [
      { line1: "Lower fuel bills,", line2: "measured on your own vehicles." },
      { line1: "Fitted by our technicians,", line2: "with no engine modification." },
      { line1: "From UGX 1,891,000,", line2: "installation included." },
      { line1: "It starts with a free", line2: "on-site fuel assessment." },
    ],
    stat: { value: 13.9, decimals: 1, unit: "%", caption: "less fuel · VW T5 field test · CTI GmbH, Germany" },
    qr: { src: "/display/qr/fet.svg", label: "Book a free fuel assessment" },
  },
  {
    kind: "sector",
    id: "seal",
    index: "02",
    tag: "SEAL Wound Spray",
    film: "/videos/seal-hero.mp4",
    poster: "/videos/seal-hero-poster.jpg",
    beats: [
      { line1: "Fast bleeding control,", line2: "for the people first on the scene." },
      { line1: "One formula, three formats:", line2: "OTC, PRO and HemoSEAL Pet." },
      { line1: "Single use, kept at room temperature,", line2: "tested to MIL-STD-810H." },
      { line1: "Supplied to organisations,", line2: "with full documentation on request." },
    ],
    stat: { value: 36, unit: "months", caption: "shelf life at room temperature · US FDA 510(k) cleared" },
    qr: { src: "/display/qr/seal.svg", label: "See the three formats" },
  },
  {
    kind: "sector",
    id: "coffee",
    index: "03",
    tag: "Vitorra Coffee",
    film: "/videos/coffee-hero.mp4",
    poster: "/videos/coffee-hero-poster.jpg",
    grade: "brightness(0.62) contrast(1.14) saturate(1.2) sepia(0.18)",
    streetGrade: "brightness(0.78) contrast(1.12) saturate(1.2) sepia(0.12)",
    beats: [
      { line1: "Ugandan Arabica,", line2: "graded and exported at origin." },
      { line1: "Export orders", line2: "from one tonne." },
      { line1: "Grades, terms and samples", line2: "on request." },
    ],
    stat: { value: 1, unit: "tonne", caption: "minimum export order · samples on request" },
    qr: { src: "/display/qr/coffee.svg", label: "Export terms and grades" },
  },
  {
    kind: "sector",
    id: "logistics",
    index: "04",
    tag: "Logistics",
    film: "/videos/logistics-hero.mp4",
    poster: "/videos/logistics-hero-poster.jpg",
    beats: [
      { line1: "Freight across East Africa,", line2: "port to door." },
      { line1: "One named contact,", line2: "from quote to delivery." },
      { line1: "Tell us the route,", line2: "we'll quote the move." },
    ],
    stat: { value: 1, unit: "contact", caption: "one named person from quote to delivery" },
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
  length: 27.5,
  captions: [
    { from: 2.6, to: 9.2, line1: "Meet Fuel Eco Tech.", line2: "Precision-built for your fuel line." },
    { from: 9.8, to: 14.2, line1: "Fitted between the fuel pump", line2: "and the filter." },
    { from: 14.8, to: 20.4, line1: "No engine modification.", line2: "From a 1.0L car to a 16L truck." },
  ],
};

/** Every film the screen plays, for the backdrop layer. */
export const FILMS: { id: string; film: string; poster: string; grade?: string; streetGrade?: string; reel?: boolean }[] = [
  { id: FET_REEL.id, film: FET_REEL.film, poster: FET_REEL.poster, reel: true },
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
 *  every card, the pace of a lobby film rather than a slideshow. */
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
    // FET leads: the film of the device, then the installation and the result.
    FET_REEL,
    ...SECTORS,
    { kind: "proof", id: "proof" },
    { kind: "visit", id: "visit" },
  ];
}
