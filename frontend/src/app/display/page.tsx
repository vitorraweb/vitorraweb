"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Stage } from "@/components/display/Stage";

/* ─── /display — the reception TV and the street-facing screen ────────────────
   /display                → reception: clock, Kampala weather, and a personal
                              welcome for the visiting client when reception sets
                              one (Operations → Reception screen).
   /display/street         → the screen facing the road (also ?mode=street):
                              bigger, brighter for daylight, fewer words, no
                              clock and never a visitor's name.
   /display/projector      → the reception story for a wall projector
                              (also ?mode=projector).
   /display?scene=fet      → hold one scene (for checking a screen's set-up).

   Full-screen and fixed — a TV, not a page. No header, footer or cookie banner
   (excluded in CookieBanner, robots.ts and the i18n middleware). English only.
   ─────────────────────────────────────────────────────────────────────────── */
function Screen() {
  const q = useSearchParams();
  const m = q.get("mode");
  return <Stage mode={m === "street" || m === "projector" ? m : "reception"} pin={q.get("scene")} />;
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0" style={{ background: "#09090A" }} />}>
      <Screen />
    </Suspense>
  );
}
