import { NextResponse } from "next/server";

/* Liveness probe for the ECS/ALB target group (planning/12-aws-migration-plan.md).
   The load balancer polls this every 30s and kills any container that stops
   answering, so what it checks matters more than it looks.

   Deliberately dumb: it proves this Node process is up and serving HTTP, and
   nothing else. It must NEVER call the Laravel API or any other dependency —
   if it did, a backend blip would make the ALB conclude our perfectly healthy
   frontend containers were sick and cycle them, turning a partial outage
   (API down, cached pages still serving) into a total one (nothing serving).

   `force-dynamic` keeps it out of the build-time prerender, so it always
   reflects the running process rather than a cached response.               */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { status: "ok", uptime: Math.round(process.uptime()) },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}
