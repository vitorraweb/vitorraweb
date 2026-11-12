import type { Metadata } from "next";
import ReviewTrialView from "@/components/trial/ReviewTrialView";

/**
 * The INTERNAL review view of a fuel trial — the full staff result screen,
 * token-gated, no login. Issued for leadership review (the CEO holds no staff
 * account); revocable from the trial's Setup tab, separately from the
 * client's own link.
 *
 * Never indexed: it carries internal findings, decisions and notes.
 */
export const metadata: Metadata = {
  title: "Trial review — Vitorra Holdings",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ReviewTrialPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return <ReviewTrialView token={token} />;
}
