# Vitorra Digital: starter websites launch campaign

**Landing page:** vitorra.org/websites (English; Swahili at /sw/websites)
**Short address for the street screen and print:** vitorra.org/web
**Sample websites (full pages, open on a phone or a laptop):**
- vitorra.org/websites/demo/advisory: Mirembe Advisory, a professional firm
- vitorra.org/websites/demo/lodge: Ridgeline Lodge, hospitality
- vitorra.org/websites/demo/kitchen: Mama Rose Kitchen, a restaurant
- vitorra.org/websites/demo/studio: Amani Studio, beauty

All four are made-up businesses and say so. The old addresses (/salon, /restaurant, /hardware) redirect to these.

## The offer (keep every ad identical to this)

| | UGX |
|---|---|
| Starter website, first year: website, .com web address, hosting | **500,000** |
| To book, after the free preview | 250,000 |
| When the site is live | 250,000 |
| Renewal from year two: care, web address, hosting | 300,000 / year |
| Optional: ads set up for the client (the client pays Facebook/Google directly) | 70,000 |
| Optional: 7 days on the street screen, booked within 60 days of going live | 100,000 (normally 150,000), shown on the page only once screen adverts are on sale |

**The promise we make in public, so we must keep it:**
- We reply on WhatsApp the same working day.
- The preview goes out within 48 hours.
- The site is live within 5 working days of receiving the client's material.
- One round of changes, and a year of care.

If the team can't keep those times at the volume the ads bring, **pause the ads**. Don't let replies slip.

## Why it should work: the three objections, answered in this order

1. **"Will it bring me customers?"** The ad shows a phone. Someone taps a product and a WhatsApp order appears. We sell orders, not "a website".
2. **"Will these people vanish?"** See it before you pay, pay half to start, a registered company with an office on Lumumba Avenue, and a year of care in writing.
3. **"What will it really cost?"** One number, UGX 500,000, with everything included for a year.

Our angle: **"See your website before you pay."** No freelancer can afford to offer that at scale. We can, because previews come from three templates and take about an hour.

## Channels and budget (first test, 3 weeks: UGX 350,000)

| Channel | Budget | Why |
|---|---|---|
| Facebook + Instagram, **Click-to-WhatsApp** ads | UGX 250,000 | Owners live on WhatsApp. One tap opens a chat with us, with no form to fill in. |
| Google Search | UGX 100,000 | Catches owners already searching for "website design Kampala". |
| Street screen + reception screen (house content) | Free | Fills time nobody has bought. Use the address **vitorra.org/web**. |

**Targeting (Meta):**
- Kampala and Wakiso (plus Entebbe and Mukono), ages 23 to 55.
- Interests: small business, entrepreneurship, WhatsApp Business, Facebook page admins.
- Placements: Facebook and Instagram feeds, Reels and Stories.
- Run 3 creatives (below) against each other. After 7 days, keep the one with the lowest cost per conversation.

**Google Search keywords (phrase match):**
- "website design Kampala", "website for my business", "cheap website Uganda"
- "website designer Uganda", "business website Uganda", "web design company Kampala"

Negatives: "free", "jobs", "course", "template download", "wordpress tutorial".

## Ad creatives (Meta)

All three: the video or picture is a hand holding a phone with the sample site from /websites. The thumb taps a product, and the WhatsApp message appears. Record it from vitorra.org/websites/demo/kitchen or /studio on a real phone (15 seconds, vertical). For business-to-business audiences, use /advisory: it shows the offer is not only for shops.

**A: "See it first"**
> Your business online for UGX 500,000, and you see it before you pay.
> Send us your business name on WhatsApp. In 48 hours we send you a preview of your website. Like it? Pay half to start.
> ✓ Website, web address and hosting for a year
> ✓ Orders come straight to your WhatsApp
> ✓ Ready in 5 working days

Button: **Send WhatsApp message**

**B: "Customers ask 'how much?' every day"**
> Tired of sending the same prices on WhatsApp all day?
> Put your products, prices, hours and location on your own website. Customers tap, and the order lands in your WhatsApp.
> UGX 500,000 for the first year. Office on Lumumba Avenue, Kampala.

Button: **Send WhatsApp message**

**C: "They won't disappear"**
> Paid a web designer who disappeared? Ask us six questions first.
> Registered company ✓ Office you can visit ✓ Web address in YOUR name ✓ A year of support in writing ✓ See it before you pay ✓
> UGX 500,000. Website, web address and hosting for a year.

Button: **Learn more** → vitorra.org/websites

**Welcome message when someone taps the ad (set in Meta):**
> Hello 👋 Thanks for contacting Vitorra Digital. What is your business called, and what do you sell? Send 3 to 5 photos and your prices, and we will send you a free preview of your website within 48 hours.

Quick replies: "What's included?", "How do I pay?", "See a sample".

**Luganda variant** (⚠ have a native speaker on the team check it before use):
> Bizinensi yo ku mutimbagano ku UGX 500,000. Laba website yo nga tonnasasula. Ba kasitoma bakuweereza order ku WhatsApp.

## Google Search ads (responsive search ad)

Headlines (30 characters or fewer):
1. Business Website UGX 500,000
2. See It Before You Pay
3. Orders Straight to WhatsApp
4. Ready in 5 Working Days
5. Web Address & Hosting Included
6. Office on Lumumba Avenue
7. A Year of Care Included
8. Pay Half to Start
9. Free Website Preview
10. Website Design Kampala

Descriptions (90 characters or fewer):
1. A mobile website for your business, with your prices and an order button for WhatsApp.
2. UGX 500,000 covers the website, a .com address and hosting for a year. See it first.
3. Registered Ugandan company. Domain in your name, a year of support in writing.

Final URL: `https://vitorra.org/websites?utm_source=google&utm_medium=cpc&utm_campaign=websites-launch`

## Tracking links (already understood by the site)

| Where | Link |
|---|---|
| Facebook / Instagram | `vitorra.org/websites?utm_source=facebook&utm_medium=paid&utm_campaign=websites-launch` |
| Google | `vitorra.org/websites?utm_source=google&utm_medium=cpc&utm_campaign=websites-launch` |
| Street screen | `vitorra.org/web` (adds the street-screen tags automatically) |
| Staff WhatsApp status / posters | `vitorra.org/websites?utm_source=whatsapp&utm_medium=status&utm_campaign=websites-launch` |

**Where the results show:**
- Every form request lands in **Enquiries** under **Websites** (team: Vitorra Digital), with the channel recorded.
- PostHog counts `website_preview_requested`. WhatsApp taps count as `call_clicked`.
- **Google Ads:** create a conversion action "Website preview request" and put its label in Vercel as `NEXT_PUBLIC_GOOGLE_ADS_LABEL_WEBSITE`. Until then it counts as a normal enquiry.
- **Click-to-WhatsApp chats don't reach the website**, so count them in Meta Ads Manager ("Messaging conversations started") and log each one as an enquiry by hand.

## When to stop, keep or scale

- **Day 7:** pause the worst creative. If UGX 120,000 has been spent with no preview requested, change the creative before spending more.
- **Day 21: compare cost per *booking* (a paid UGX 250,000 deposit), not cost per click.**
  - Each booking brings in about UGX 440,000 after the domain.
  - Under UGX 70,000 per booking: double the budget.
  - Over UGX 150,000 per booking: stop and rethink the offer or creative.
- **Capacity cap:** no more than about 10 sites in progress at once with the current team. Pause ads when the queue is full.

## Street screen adverts (1920 × 1080, ready to upload)

Three finished designs in `marketing/websites/screen/`. They are dark, as the screens require, and show the short address `vitorra.org/web` rather than a QR code:

1. `vitorra-digital-screen-1-your-business-online.png`: the headline, the price, and three sample websites in browser windows.
2. `vitorra-digital-screen-2-customers-look-you-up.png`: "Customers look you up before they come," with a business owner at a laptop (stock, dimmed for night).
3. `vitorra-digital-screen-3-four-websites.png`: "Four businesses. Four websites. One price," with all four samples.

**To put them on air:** Operations → Screen editor → Running order → add a design.
- Upload each PNG and set about 8 seconds on screen.
- Choose the street screen and the reception TV.
- Leave the caption empty, since the words are in the design.

These are Vitorra's own house content, so they fill unsold time and never take a paid slot.

## Sales script (owner conversations at Padre Pio House / Lumumba Avenue)

1. "Do your customers ask for prices on WhatsApp?" (They always do.)
2. Open vitorra.org/websites/demo/ (pick the closest business) on **their** phone. Let them tap a product and see the order.
3. "We'll make yours, free, and show you before you pay anything."
4. Collect the business name, WhatsApp number and 3 to 5 photos on the spot, and log it with the form on /websites so it is tracked.
