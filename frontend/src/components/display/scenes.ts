/* ─── The screen's story ───────────────────────────────────────────────────────
   One loop, about a minute and a half, built like a luxury window display
   rather than a dashboard: one idea per scene, one number you can read from
   the street, and a QR code for the person who stops.

   Copy rules (same as the website): no claim beyond what the product's own
   testing and clearance say. Numbers are the ones published on vitorra.org.
   ─────────────────────────────────────────────────────────────────────────── */

export type Mode = "reception" | "street";

export type SectorScene = {
  kind: "sector";
  id: string;
  index: string;
  tag: string;
  film: string;
  poster: string;
  /** CSS filter to bring a film into the same dark world as the others. */
  grade?: string;
  line1: string;
  line2: string;
  stat: { value: number; decimals?: number; prefix?: string; unit: string; caption: string };
  qr: { src: string; label: string };
};

export type Scene =
  | { kind: "ident"; id: "ident" }
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
    line1: "Lower fuel bills,",
    line2: "measured on your own vehicles.",
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
    line1: "Fast bleeding control,",
    line2: "for the people first on the scene.",
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
    grade: "brightness(0.42) contrast(1.18) saturate(1.25) sepia(0.22)",
    line1: "Ugandan Arabica,",
    line2: "graded and exported at origin.",
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
    line1: "Freight across East Africa,",
    line2: "port to door.",
    stat: { value: 1, unit: "contact", caption: "one named person from quote to delivery" },
    qr: { src: "/display/qr/logistics.svg", label: "Request a freight quote" },
  },
];

export const CREDENTIALS = [
  { name: "CTI GmbH", what: "Fuel use measured on a working vehicle" },
  { name: "AVL Technologies", what: "Laboratory validation" },
  { name: "qm-solutions GmbH", what: "German product certification" },
  { name: "ISO 9001:2015", what: "Quality management" },
  { name: "ISO 14001:2015", what: "Environmental management" },
  { name: "Zurich Insurance", what: "Product liability" },
];

/** Seconds each kind of scene holds. The street screen holds a little longer — people are walking. */
export function durationOf(scene: Scene, mode: Mode): number {
  const street = mode === "street";
  switch (scene.kind) {
    case "ident": return 7;
    case "welcome": return 12;
    case "sector": return street ? 13 : 12;
    case "proof": return street ? 10 : 11;
    case "visit": return 10;
  }
}

/** The loop for a mode. The welcome is reception-only: a visitor's name never goes on the street. */
export function storyFor(mode: Mode, hasWelcome: boolean): Scene[] {
  return [
    { kind: "ident", id: "ident" },
    ...(mode === "reception" && hasWelcome ? [{ kind: "welcome", id: "welcome" } as const] : []),
    ...SECTORS,
    { kind: "proof", id: "proof" },
    { kind: "visit", id: "visit" },
  ];
}
