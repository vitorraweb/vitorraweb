import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isScreenStaff, SCREEN_MEDIA_URL } from "@/lib/screen-staff";

/* Deletes a file the Screen editor uploaded, once it is removed or replaced in
   the running order, so unwanted videos do not stay in storage. Staff with the
   screen permission only, and only files under screen-media/. */
export async function DELETE(request: Request): Promise<NextResponse> {
  const { url } = (await request.json().catch(() => ({}))) as { url?: string };
  if (!url || !SCREEN_MEDIA_URL.test(url)) return NextResponse.json({ error: "Not a screen file." }, { status: 422 });
  if (!(await isScreenStaff(request))) return NextResponse.json({ error: "Sign in to the console to remove screen content." }, { status: 403 });
  try {
    await del(url);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not delete the file." }, { status: 502 });
  }
}
