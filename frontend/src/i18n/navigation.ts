import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/* Locale-aware navigation primitives. Use these (instead of `next/link` /
   `next/navigation`) inside PUBLIC, localized routes so links automatically
   carry the active locale prefix (/about ↔ /sw/about). Do NOT use these in
   the admin panel — admin stays on plain next/link (English-only).            */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
