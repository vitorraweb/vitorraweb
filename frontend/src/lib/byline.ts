/** The author name to print on a blog post, or null to print none.
 *  Posts drafted by the blog assistant or posted from a shared console
 *  account carry names like "Claude (blog drafts)" or "Vitorra Admin";
 *  visitors should see a person's name or nothing (the post's structured
 *  data already credits Vitorra Holdings). */
export function publicAuthor(name?: string | null): string | null {
  const n = name?.trim();
  if (!n) return null;
  if (/claude|draft|admin|\bops\b|operations team|^vitorra\b/i.test(n)) return null;
  return n;
}
