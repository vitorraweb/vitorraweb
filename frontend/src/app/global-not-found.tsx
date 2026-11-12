import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { AbstractIntlMessages } from "next-intl";
import { RootDocument } from "@/components/layout/RootDocument";
import { loadMessages } from "@/i18n/messages";
import { routing } from "@/i18n/routing";
import NotFound from "./[locale]/not-found";

/* A 404 for an address no route matches at all. The site has two root
   layouts (public and internal), so there is no single layout to build it
   from; Next renders this file on its own. Same page as the site's 404,
   in English. */

export const metadata: Metadata = {
  title: "Page not found | Vitorra Holdings Limited",
  robots: { index: false, follow: true },
};

export default async function GlobalNotFound() {
  setRequestLocale(routing.defaultLocale);
  const messages = (await loadMessages(routing.defaultLocale)) as AbstractIntlMessages;
  return (
    <RootDocument locale={routing.defaultLocale} messages={messages}>
      <NotFound />
    </RootDocument>
  );
}
