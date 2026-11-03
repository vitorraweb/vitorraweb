import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { screenAdsOpen } from "@/lib/screen-ads-gate";

export const metadata: Metadata = { title: "Street screen advertising terms", robots: { index: false, follow: false } };

/* The booking terms for the street screen. Plain English, as Finance agreed them
   (payment, cancellation, reporting, missed airtime) on 3 November 2026. Prices
   and numbers come from the same settings as the booking. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="mt-10"><h2 className="t-h4 mb-3">{title}</h2><div className="t-body text-ink-soft space-y-3">{children}</div></section>;
}

export default async function ScreenAdTermsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const { preview } = await searchParams;
  if (!screenAdsOpen(preview)) notFound();
  return (
    <article className="max-w-[44rem]">
      <p className="t-label text-gold-ink">Vitorra street screen</p>
      <h1 className="t-h2 mt-3">Advertising terms</h1>
      <p className="t-lead text-ink-soft mt-4">These terms apply to every advert booked on the Vitorra street screen at Padre Pio House, Lumumba Avenue, Kampala.</p>

      <Section title="1. What you are buying">
        <p>The screen runs a four-minute programme: twelve paid 15-second units and at least one minute of Vitorra&apos;s own content. One unit plays your advert once in every four minutes, which is 15 times an hour, every day of your campaign, from 6am to 10pm Kampala time.</p>
        <p>Trial: 1 unit for 7 days. Standard: 1 unit for 30 days. Growth: 2 units for 30 days. High Visibility: 4 units for 30 days. The price shown when you book is the full amount you pay.</p>
        <p>The screen sells no more than twelve units at a time. Your units are reserved when you book and released if we have not received payment within 72 hours.</p>
      </Section>

      <Section title="2. Payment">
        <p>You pay the full price by bank transfer before your campaign starts, using your booking reference, and upload proof of payment on your booking page. We confirm when the money arrives.</p>
      </Section>

      <Section title="3. Your advert and our review">
        <p>You supply one 15-second video (MP4, H.264, 1920 × 1080, landscape), which plays without sound, or one 1920 × 1080 design (PNG, JPG or WebP), which is shown for 15 seconds. You confirm that you own it or have the rights to it.</p>
        <p>We review every advert after payment. We do not run adverts that are illegal, false or misleading, or that show sexual, violent or hateful content; political or religious campaigning; adverts for betting, alcohol or tobacco; or anything that could distract drivers, including flashing images.</p>
        <p>If we refuse your advert before it starts, we refund you in full within 10 working days, to the account you paid from. If we have to take it off air after it starts, we refund the unused days on the same terms.</p>
      </Section>

      <Section title="4. Cancelling">
        <p>You can cancel at no cost before you pay, and for a full refund at any time before your campaign starts. Once your campaign has started it cannot be cancelled, and the days already shown are not refunded.</p>
        <p>To cancel, reply to your booking email or contact us with your booking reference.</p>
      </Section>

      <Section title="5. Reporting">
        <p>The screen records every play of your advert. At the end of your campaign, and at any time on request, we send you a delivery report showing, day by day, the plays booked and the plays delivered.</p>
      </Section>

      <Section title="6. Missed airtime">
        <p>Screens occasionally go off: power cuts, internet outages or maintenance. We log every outage.</p>
        <p>If your campaign receives less than 95% of its booked plays, we make up the missed plays by extending your campaign. If we cannot extend it, we refund the share of the price the missed plays represent, within 10 working days.</p>
      </Section>

      <Section title="7. Keeping your advert">
        <p>We keep your approved advert and your booking instructions for the length of your campaign and twelve months after it, as a record of what was shown. Ask us if you would like them deleted sooner.</p>
      </Section>
    </article>
  );
}
