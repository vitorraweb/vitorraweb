import type { Metadata } from "next";
import ClientTrialView from "@/components/trial/ClientTrialView";

/**
 * A client's own read-only view of their fuel trial. Token-gated, no login.
 *
 * Never indexed: the link is private to one client and carries their operating
 * data. Also excluded from locale negotiation in middleware.ts.
 */
export const metadata: Metadata = {
  title: "Fuel trial — Vitorra Holdings",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ClientTrialPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return <ClientTrialView token={token} />;
}
