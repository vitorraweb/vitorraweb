import type { Metadata } from "next";
import ContractSigning from "@/components/contract/ContractSigning";

/**
 * A client's private contract signing page, from the one-time link in their
 * email. Token-gated, no login. Never indexed, and excluded from locale
 * negotiation in middleware.ts.
 */
export const metadata: Metadata = {
  title: "Review and sign your contract",
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

export default async function ContractSigningPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ContractSigning token={token} />;
}
