import type { Metadata } from "next";
import { Stage } from "@/components/display/Stage";

/* /display/street — the screen facing the road. Its own address (and its own
   app manifest) so it installs as a separate full-screen app from reception.
   Same as /display?mode=street. */
export const metadata: Metadata = {
  title: "Vitorra · Street screen",
  manifest: "/display-street.webmanifest",
};

export default function StreetScreen() {
  return <Stage mode="street" />;
}
