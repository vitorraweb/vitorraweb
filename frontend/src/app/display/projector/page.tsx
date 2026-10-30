import type { Metadata } from "next";
import { Stage } from "@/components/display/Stage";

/* /display/projector — the reception story projected onto a wall. Same
   content as /display (clock, weather, visitor welcome), drawn for a
   projector: bright scenes, solid panels behind words, heavier type, wider
   safe margins. Same as /display?mode=projector. */
export const metadata: Metadata = {
  title: "Vitorra · Projector",
  manifest: "/display-projector.webmanifest",
};

export default function ProjectorScreen() {
  return <Stage mode="projector" />;
}
