import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isScreenStaff } from "@/lib/screen-staff";
import { screenAdsOpen } from "@/lib/screen-ads-gate";

/* Hands the browser a short-lived, single-file permission to send one file
   straight to storage. Videos are too large to pass through the website, which
   is why the file itself never comes here.

   screen-ads/   a customer's advert (MP4 video, or a PNG / JPG / WebP design),
                 only while the booking page is open to this visitor.
   screen-media/ Vitorra's own content from the console's Screen editor, only for
                 a signed-in member of staff with the screen permission.

   Presigned uploads work with Vercel's current way of connecting a store
   (BLOB_STORE_ID with the project's own OIDC identity) as well as with an older
   BLOB_READ_WRITE_TOKEN. */
const TYPES: Record<string, string> = { mp4: "video/mp4", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp" };
const MAX_BYTES = { video: 200 * 1024 * 1024, image: 20 * 1024 * 1024 };

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadPresignedBody;
  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname, clientPayload) => {
        const m = /^(screen-ads|screen-media)\/[a-z0-9-]+\.(mp4|png|jpe?g|webp)$/.exec(pathname);
        if (!m) throw new Error("Unexpected file name.");
        // A customer uploads while booking; staff may also upload a corrected advert file.
        if (m[1] === "screen-ads" && !screenAdsOpen(clientPayload) && !(await isScreenStaff(request))) throw new Error("Not available.");
        if (m[1] === "screen-media" && !(await isScreenStaff(request))) throw new Error("Sign in to the console to add screen content.");
        const type = TYPES[m[2]];
        const max = type.startsWith("video") ? MAX_BYTES.video : MAX_BYTES.image;
        const token = await issueSignedToken({ pathname, operations: ["put"], allowedContentTypes: [type], maximumSizeInBytes: max, validUntil: Date.now() + 30 * 60 * 1000 });
        return { token, urlOptions: { allowedContentTypes: [type], maximumSizeInBytes: max, addRandomSuffix: true } };
      },
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
