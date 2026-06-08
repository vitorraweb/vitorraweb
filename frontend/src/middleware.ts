import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  /* Only run locale negotiation on public, localizable routes. Excludes:
       - /api            (backend proxy / API routes)
       - /admin          (internal staff panel — English-only, never prefixed)
       - /_next /_vercel (framework internals)
       - any path with a "." (static assets: images, sitemap.xml, robots.txt …)
     NOTE: /account is intentionally NOT excluded — the customer portal is
     localized along with the rest of the public site.                         */
  matcher: ["/((?!api|admin|_next|_vercel|.*\\..*).*)"],
};
