import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { screenAdsOpen } from "@/lib/screen-ads-gate";

/* Hands the browser a short-lived permission to send one video straight to
   storage. Videos are too large to pass through the website, which is why the
   file itself never comes here. Only MP4, under the size limit, and only while
   the booking page is open to this visitor. */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!screenAdsOpen(clientPayload)) throw new Error("Not available.");
        if (!/^screen-ads\/[a-z0-9-]+\.mp4$/.test(pathname)) throw new Error("Unexpected file name.");
        return { allowedContentTypes: ["video/mp4"], maximumSizeInBytes: 200 * 1024 * 1024, addRandomSuffix: true };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
