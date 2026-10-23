import { NextRequest, NextResponse } from "next/server";
import { API_ORIGIN } from "@/lib/constants";

/* Contract signing goes through here rather than the blanket /api rewrite,
   for one reason: the signature record needs the client's own IP address,
   and the rewrite reaches the API from Vercel's addresses without passing
   it on. Vercel sets x-forwarded-for to the visitor's address; it is handed
   to the API with the shared secret (the same one /api/revalidate uses), so
   the API can trust it, and nobody can plant an address by calling the API
   directly. Everything else is passed through unchanged. */

export const dynamic = "force-dynamic";

async function relay(request: NextRequest, path: string[]) {
  const headers: Record<string, string> = { Accept: request.headers.get("accept") ?? "application/json" };
  const type = request.headers.get("content-type");
  if (type) headers["Content-Type"] = type;
  const ua = request.headers.get("user-agent");
  if (ua) headers["User-Agent"] = ua;

  const ip = (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  const key = process.env.REVALIDATE_SECRET;
  if (ip && key) {
    headers["X-Vitorra-Client-IP"] = ip;
    headers["X-Vitorra-Relay-Key"] = key;
  }

  const upstream = await fetch(`${API_ORIGIN}/contracts/sign/${path.map(encodeURIComponent).join("/")}`, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : await request.text(),
    cache: "no-store",
  });

  const out = new Headers();
  for (const h of ["content-type", "content-disposition", "cache-control"]) {
    const v = upstream.headers.get(h);
    if (v) out.set(h, v);
  }
  return new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: out });
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, { params }: Ctx) {
  return relay(request, (await params).path);
}

export async function POST(request: NextRequest, { params }: Ctx) {
  return relay(request, (await params).path);
}
