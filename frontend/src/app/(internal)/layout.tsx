import { getLocale, getMessages } from "next-intl/server";
import { RootDocument } from "@/components/layout/RootDocument";
import { siteMetadata, siteViewport } from "@/lib/site-metadata";

/* Root layout for everything outside the public site: the console (/admin),
   the staff portal, careers, supplier sign-up, screen adverts, the reception
   and street screens, client trial and contract links, the receipt scanner
   and the Teams tab. These read the session or a token on every request, so
   reading the language from the request here costs nothing. The public site
   has its own root layout (app/[locale]/layout.tsx) so it can be cached. */

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default async function InternalRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // English on these routes, except careers, which picks its own language.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <RootDocument locale={locale} messages={messages}>
      {children}
    </RootDocument>
  );
}
