"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Stage } from "@/components/display/Stage";
import { DAYPARTS, type Daypart } from "@/components/display/scenes";

/* ─── /display — the reception TV and the street-facing screen ────────────────
   /display                → reception, drawn for the wall projector: clock,
                              Kampala weather, and a personal welcome for the
                              visiting client when reception sets one
                              (Operations → Reception screen).
   /display?mode=tv        → the same story with the dark look for a TV.
   /display/street         → the screen facing the road (also ?mode=street):
                              bigger, graded for daylight, always on dark
                              backgrounds, and never a visitor's name.
   /display/projector      → same as /display.
   /display?scene=fet      → hold one scene (for checking a screen's set-up).
   &moment=0…3             → hold one moment of a film: picture, headline,
                              proof, call to action.
   &at=morning|day|rush|night → preview a time of day; otherwise Kampala's clock.
   &turn=1                 → preview a business's next headline in rotation.
   &draft=1                → preview unsaved wording from Operations → Screen wording.

   Composed for 1920×1080: any other shape of screen shows it centred in 16:9.

   Full-screen and fixed — a TV, not a page. No header, footer or cookie banner
   (excluded in CookieBanner, robots.ts and the i18n middleware). English only.
   ─────────────────────────────────────────────────────────────────────────── */
function Screen() {
  const q = useSearchParams();
  const m = q.get("mode");
  // Reception runs on a wall projector, so the plain link is the projector
  // version; the dark TV look is ?mode=tv (or ?mode=reception).
  const mode = m === "street" ? "street" : m === "tv" || m === "reception" ? "reception" : "projector";
  const at = DAYPARTS.find((d) => d === q.get("at")) ?? null;
  const moment = Number(q.get("moment"));
  const hold = q.has("moment") && [0, 1, 2, 3].includes(moment) ? moment : null;
  return <Stage mode={mode} pin={q.get("scene")} at={at as Daypart | null} hold={hold} turn={Number(q.get("turn")) || 0} draft={q.has("draft")} />;
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0" style={{ background: "#09090A" }} />}>
      <Screen />
    </Suspense>
  );
}
