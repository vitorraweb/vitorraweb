import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /* Only run locale negotiation on public, localizable routes. Excludes:
       - /api            (backend proxy / API routes)
       - /admin          (internal staff panel — English-only, never prefixed)
       - /staff          (employee self-service portal — English-only)
       - /careers        (public recruitment portal — English-only)
       - /suppliers      (public supplier onboarding — English-only)
       - /display        (reception lobby kiosk screen — English-only, unattended)
       - /trial          (a client's own read-only trial link — token-gated,
                          English-only, and never indexed)
       - /_next /_vercel (framework internals)
       - any path with a "." (static assets: images, sitemap.xml, robots.txt …)
     NOTE: /account is intentionally NOT excluded — the customer portal is
     localized along with the rest of the public site.                         */
  matcher: ["/((?!api|admin|staff|careers|suppliers|display|trial|_next|_vercel|.*\\..*).*)"],
};
