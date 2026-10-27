import { permanentRedirect } from "next/navigation";

/* The careers portal lives at /careers (its own language switch, outside the
   locale prefix). /sw/careers used to carry an older copy of the page; it now
   sends visitors and search engines to the one real page. */
export default function LocalizedCareers() {
  permanentRedirect("/careers");
}
