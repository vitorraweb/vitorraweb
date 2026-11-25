/* ─── Vitorra Digital — the sample websites ───────────────────────────────────
   Four made-up businesses, each a full web page with its own look, at
   /websites/demo/<slug> (components in ./samples). They show the range: a
   service studio, a restaurant, a professional firm and a lodge. Every page
   says it is a sample, and no real phone number is attached anywhere.

   `shot` is a 1440 × 900 capture of the page's first screen, used in the
   showcase on /websites. Recapture after a design change:
   scripts/capture-sample-shots.mjs.                                         */

export type Sample = {
  slug: "studio" | "kitchen" | "advisory" | "lodge";
  name: string;
  /** What kind of business, for the showcase tab and caption. */
  kind: string;
  shot: string;
};

export const SAMPLES: Sample[] = [
  { slug: "advisory", name: "Mirembe Advisory", kind: "Professional services", shot: "/websites/shots/advisory.webp" },
  { slug: "lodge", name: "Ridgeline Lodge", kind: "Hospitality", shot: "/websites/shots/lodge.webp" },
  { slug: "kitchen", name: "Mama Rose Kitchen", kind: "Food & drink", shot: "/websites/shots/kitchen.webp" },
  { slug: "studio", name: "Amani Studio", kind: "Beauty & wellness", shot: "/websites/shots/studio.webp" },
];

export const ugx = (n: number) => `UGX ${n.toLocaleString("en-US")}`;
