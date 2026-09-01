"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Records how this visit reached the site, once, as early as possible.
 *
 * Mounted in the root layout because the campaign tags and the external
 * referrer only exist on the first page view — see lib/attribution.ts. Renders
 * nothing and never blocks paint.
 */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
