import type { Design } from "./EmailDesigner";

/* Shared shapes and labels for the Marketing app. */

export const PRODUCTS: [string, string][] = [["FET", "Fuel Eco Tech"], ["SEAL", "SEAL Wound Spray"], ["COFFEE", "Coffee"]];

export type Market = {
  id: number; name: string; description: string | null; product: string | null; color: string | null;
  members: number; emailable: number; tiers: Record<string, number>;
};

export type Starter = { key: string; name: string; description: string; design: Design };
export type SavedDesign = { id: number; name: string; product: string | null; design: Design; updated_at: string };

export type CampaignStats = {
  delivered: number; failed: number; opened: number; clicked: number; unsubscribed: number;
  delivery_rate: number | null; open_rate: number | null; click_rate: number | null; click_to_open: number | null; unsubscribe_rate: number | null;
  score: number | null; grade: string | null;
};

export type CampaignSummary = {
  id: number; name: string | null; subject: string; preheader: string | null; product: string | null;
  market_ids: number[] | null; skip_avoid: boolean; status: string; total: number; sent_count: number; failed_count: number;
  created_at: string; started_at: string | null; completed_at: string | null; tested_at: string | null;
  test_current: boolean; stats: CampaignStats | null; markets: string[];
};

/** Decision-engine tiers: label, chip tone, and what they mean. */
export const TIERS: { key: string; label: string; tone: string; hint: string }[] = [
  { key: "hot", label: "Hot", tone: "alert", hint: "Act now — call or write personally" },
  { key: "warm", label: "Warm", tone: "gold", hint: "Keep in campaigns and follow up" },
  { key: "cold", label: "Cold", tone: "blue", hint: "Email only, low effort" },
  { key: "avoid", label: "Avoid", tone: "muted", hint: "Not worth the team's time now" },
  { key: "do_not_contact", label: "Do not contact", tone: "muted", hint: "Unsubscribed — never email" },
  { key: "customer", label: "Customer", tone: "ok", hint: "Already bought — not a lead" },
];
export const tierOf = (k: string | null | undefined) => TIERS.find((t) => t.key === k);

export const pretty = (k: string | null | undefined) =>
  (k ?? "").replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export const pct = (v: number | null | undefined) => (v == null ? "—" : `${v}%`);
