import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { COFFEE_SHOP_ENABLED } from "@/lib/config";
import { getBlogPosts } from "@/lib/api";

export const revalidate = 3600;

/* Static public pages — path, priority, change frequency. */
const PAGES: { path: string; priority: number; cf: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "", priority: 1.0, cf: "weekly" },
  { path: "/about", priority: 0.8, cf: "monthly" },
  { path: "/products/fuel-eco-tech", priority: 0.9, cf: "monthly" },
  { path: "/products/seal-wound-spray", priority: 0.9, cf: "monthly" },
  { path: "/products/coffee", priority: 0.8, cf: "monthly" },
  { path: "/products/logistics", priority: 0.8, cf: "monthly" },
  { path: "/enquire", priority: 0.7, cf: "monthly" },
  { path: "/contact", priority: 0.6, cf: "monthly" },
  { path: "/blog", priority: 0.7, cf: "weekly" },
  { path: "/trust/certifications", priority: 0.6, cf: "monthly" },
  { path: "/legal/privacy-policy", priority: 0.3, cf: "yearly" },
  { path: "/legal/terms-and-conditions", priority: 0.3, cf: "yearly" },
  { path: "/legal/returns-and-warranty", priority: 0.3, cf: "yearly" },
  { path: "/legal/cookie-policy", priority: 0.3, cf: "yearly" },
  // Coffee shop only listed when the store is live (it's noindex while gated).
  ...(COFFEE_SHOP_ENABLED ? [{ path: "/shop", priority: 0.7 as const, cf: "weekly" as const }] : []),
];

/* English keeps clean URLs (/about); Swahili is prefixed (/sw/about). Each
   sitemap entry advertises both languages via hreflang alternates so Google
   can pair and rank them. `x-default` points at the English (default) URL. */
function urls(path: string) {
  const en = `${SITE_URL}${path}`;
  const sw = `${SITE_URL}/sw${path}`;
  return { en, sw, alternates: { languages: { en, sw, "x-default": en } } };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PAGES.flatMap((p) => {
    const { en, sw, alternates } = urls(p.path);
    return [
      { url: en, lastModified: now, changeFrequency: p.cf, priority: p.priority, alternates },
      { url: sw, lastModified: now, changeFrequency: p.cf, priority: p.priority, alternates },
    ];
  });

  // Blog posts from the API — skipped gracefully if the backend is unreachable.
  const blogEntries: MetadataRoute.Sitemap = [];
  try {
    let page = 1;
    let lastPage = 1;
    do {
      const res = await getBlogPosts(page);
      for (const post of res.data) {
        const { en, sw, alternates } = urls(`/blog/${post.slug}`);
        const lastModified = post.published_at ? new Date(post.published_at) : now;
        blogEntries.push(
          { url: en, lastModified, changeFrequency: "monthly", priority: 0.6, alternates },
          { url: sw, lastModified, changeFrequency: "monthly", priority: 0.6, alternates },
        );
      }
      lastPage = res.meta?.last_page ?? 1;
      page += 1;
    } while (page <= lastPage && page <= 20);
  } catch {
    /* backend offline at build — static pages only */
  }

  return [...staticEntries, ...blogEntries];
}
