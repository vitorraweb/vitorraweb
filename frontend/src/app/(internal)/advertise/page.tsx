import { notFound } from "next/navigation";
import { BookingFlow } from "@/components/advertise/BookingFlow";
import { screenAdsOpen } from "@/lib/screen-ads-gate";

export default async function AdvertisePage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  if (!screenAdsOpen(preview)) notFound();
  return <BookingFlow preview={preview ?? ""} draft={process.env.SCREEN_ADS_ENABLED !== "true"} />;
}
