"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Stage } from "@/components/display/Stage";

/* ─── /display — the reception TV and the street-facing screen ────────────────
   /display                → reception: clock, Kampala weather, and a personal
                              welcome for the visiting client when reception sets
                              one (Operations → Reception screen).
   /display?mode=street    → the screen facing the road: bigger type, fewer
                              words, no clock and never a visitor's name.
   /display?scene=fet      → hold one scene (for checking a screen's set-up).

   Full-screen and fixed — a TV, not a page. No header, footer or cookie banner
   (excluded in CookieBanner, robots.ts and the i18n middleware). English only.
   ─────────────────────────────────────────────────────────────────────────── */
function Screen() {
  const q = useSearchParams();
  return <Stage mode={q.get("mode") === "street" ? "street" : "reception"} pin={q.get("scene")} />;
}

export default function DisplayPage() {
  return (
    <Suspense fallback={<div className="fixed inset-0" style={{ background: "#09090A" }} />}>
      <Screen />
    </Suspense>
  );
}
