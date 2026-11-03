import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { screenAdsOpen } from "@/lib/screen-ads-gate";

/* Hands the browser a short-lived, single-file permission to send one video
   straight to storage. Videos are too large to pass through the website, which
   is why the file itself never comes here. Only MP4, under the size limit, and
   only while the booking page is open to this visitor.

   Presigned uploads work with Vercel's current way of connecting a store
   (BLOB_STORE_ID with the project's own OIDC identity) as well as with an older
   BLOB_READ_WRITE_TOKEN, so the route does not care which one Vercel set up. */
const MAX_BYTES = 200 * 1024 * 1024;

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        if (!screenAdsOpen(clientPayload)) throw new Error("Not available.");
        if (!/^screen-ads\/[a-z0-9-]+\.mp4$/.test(pathname)) throw new Error("Unexpected file name.");
        const token = await issueSignedToken({
          pathname, operations: ["put"], allowedContentTypes: ["video/mp4"], maximumSizeInBytes: MAX_BYTES,
          validUntil: Date.now() + 30 * 60 * 1000,
        });
        return { token, urlOptions: { allowedContentTypes: ["video/mp4"], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true } };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
