import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/* Called by the Laravel backend right after a blog post is published, edited,
   or deleted (see App\Support\FrontendRevalidator), so the change shows up on
   the live site within seconds instead of waiting up to 30 minutes for the
   blog pages' normal ISR cache (revalidate: 1800 in lib/api.ts) to expire.

   Protected by a shared secret — this endpoint can force cache work, so it
   must not be callable by anyone who merely knows the URL. Set REVALIDATE_SECRET
   on Vercel to the same value as the backend's FRONTEND_REVALIDATE_SECRET. */
export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  const provided = request.headers.get("x-revalidate-secret");

  if (!expected || provided !== expected) {
    return NextResponse.json({ message: "Invalid or missing secret" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const slugs: string[] = Array.isArray(body?.slugs)
    ? body.slugs.filter((s: unknown): s is string => typeof s === "string" && s.length > 0)
    : [];

  // English is unprefixed (localePrefix: "as-needed"); Swahili is under /sw.
  const paths = new Set<string>(["/blog", "/sw/blog", "/", "/sw"]);
  for (const slug of slugs) {
    paths.add(`/blog/${slug}`);
    paths.add(`/sw/blog/${slug}`);
  }
  paths.forEach((p) => revalidatePath(p));

  return NextResponse.json({ revalidated: true, paths: [...paths] });
}
