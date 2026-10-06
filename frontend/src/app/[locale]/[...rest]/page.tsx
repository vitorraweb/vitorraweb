import { notFound } from "next/navigation";

/* Any address that matches no page under a locale lands here and hands over to
   [locale]/not-found.tsx, so visitors get the site's own 404 (header, footer,
   the four businesses) instead of the framework's bare black screen. This is
   next-intl's documented pattern for localised 404s. */
export default function CatchAll() {
  notFound();
}
