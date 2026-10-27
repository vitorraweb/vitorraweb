---
name: blog-post
description: Write the next Vitorra blog article from this week's news (FET/fuel, coffee, logistics, SEAL/first aid), ready to paste into Admin → Blog and send for review. Use when John types /blog-post or asks for a blog post / blog day.
---

# Vitorra blog day

The team writes blog posts by hand with Claude in a session (no paid AI API — decided 27 October 2026). Output is a draft John pastes into **Admin → Blog → New post**, then presses **Send for review**; Marketing publishes from the email. Nothing here publishes anything.

Optional argument: a topic (`fet`, `coffee`, `logistics`, `seal`) or a specific story/angle. Otherwise pick by rotation.

## 1. Pick the topic

Rotation: **fet, coffee, fet, logistics, fet, seal** (FET is the priority revenue product). Read `planning/blog/LOG.md` and take the next one after the last entry. Also avoid angles already on the live blog: `curl -s https://api.vitorra.org/api/blog/posts | python3 -c "import json,sys;[print(p['published_at'][:10],p['title']) for p in json.load(sys.stdin)['data']]"` (published only; drafts are in the log).

Topic briefs:
- **fet** — diesel/petrol pump prices in Uganda and East Africa, fuel import and tax changes, fleet and transport operating costs, fuel efficiency, emissions rules.
- **coffee** — Uganda coffee exports and earnings, Arabica/Robusta world prices, harvest and weather, buyer rules (e.g. EU deforestation regulation), what international buyers of Ugandan coffee should know.
- **logistics** — Northern and Central corridors, Mombasa and Dar es Salaam ports, border/customs changes, freight rates, regional trade rules for Ugandan importers/exporters.
- **seal** — road safety and trauma in Uganda/East Africa, emergency medical services, first-aid training, workplace safety, bleeding control for first responders.

## 2. Research (WebSearch / WebFetch)

Find news from roughly the last three weeks. Pick the ONE development that matters most to Ugandan/East African business owners and isn't already covered. Prefer primary and reputable sources: government/regulator notices, Bank of Uganda, UBOS, URA, Ministry of Energy, UCDA/MAAIF (coffee), ICO, KPA/TPA ports, Reuters, Daily Monitor, New Vision, The EastAfrican, Business Daily. Open the actual pages (WebFetch) for every figure you will use. Note each fact with its URL and date.

If nothing recent and solid turns up, say so and offer an evergreen practical guide on the topic instead — never pad with invented news.

## 3. Write

Match the voice of the existing posts (e.g. `how-to-reduce-fleet-fuel-costs-uganda`): plain British English, calm and practical, short paragraphs, `##` headings (never `#` — the page supplies the title), bold rarely, 650–1,000 words. Money in UGX where sources allow; say when a figure is an estimate. End with a short "what to do / what to watch" section.

Hard rules:
- Every fact and figure comes from a source you opened. No invented numbers, quotes, names or dates. Say when something is uncertain.
- Mention Vitorra at most once, near the end, only where it genuinely helps, with one internal link. Only these claims:
  - **FET**: fitted to the fuel line between pump and filter, no engine modification. Independent CTI GmbH field test (Germany, Nov 2025): VW T5 from 11.52 to 9.92 L/100 km, 13.9%. One vehicle isn't every fleet, so it's sold via a free fuel assessment measuring the customer's own vehicles. From UGX 1,891,000 incl. installation. Links: `/products/fuel-eco-tech`, `/products/fuel-eco-tech#fet-calculator`, `/enquire?sector=FET`. Do not use the UBK 844L field results unless John says they're cleared for publication.
  - **SEAL**: chitosan hemostatic spray, US FDA 510(k) cleared. **Never** say or imply Uganda NDA approval. Not a tourniquet replacement. No medical advice beyond general first-aid awareness. Link: `/products/seal-wound-spray`.
  - **Coffee**: Ugandan Arabica for export buyers and local wholesale; retail bags not on sale yet. Links: `/products/coffee`, `/enquire?sector=COFFEE`.
  - **Logistics**: freight and supply-chain services quoted per shipment; no promises on border times or tracking. Links: `/products/logistics`, `/enquire?sector=LOGISTICS`.
- Never promise savings or outcomes.
- End the content with `## Sources` — a bullet list of `[Publisher: page title](url)` for the pages you relied on.

## 4. Hand over

Save to `planning/blog/drafts/YYYY-MM-DD-<slug>.md` with this layout so each field maps to the editor:

```
TITLE: …
SLUG: …            (lowercase-hyphens, ≤ 80 chars)
EXCERPT: …         (1–2 sentences, ≤ 300 chars)
COVER IMAGE: …     (pick from the list below)
SEO TITLE: …       (≤ 60 chars)
SEO DESCRIPTION: … (≤ 155 chars)
---
<markdown content, ending with ## Sources>
```

Cover images (already on the site): fet → `/products/fet/field-truck.jpg`, `/images/stock/highway-sunset.jpg`, `/images/stock/road-mountains.jpg`, `/images/stock/engine-hands.jpg`, `/images/stock/hills-road.jpg`; coffee → `/images/stock/coffee-valley.jpg`, `/images/stock/coffee-cherries.jpg`, `/images/stock/coffee-hands.jpg`, `/images/stock/coffee-roaster.jpg`; logistics → `/images/stock/port-aerial.jpg`, `/images/stock/ship-wake.jpg`, `/images/stock/ship-aerial.jpg`, `/images/stock/warehouse-dark.jpg`; seal → `/images/stock/ambulance-motion.jpg`, `/images/stock/trauma-kit-open.jpg`. Don't reuse the cover of the previous post on the same topic (check the log).

Append a line to `planning/blog/LOG.md`: `| date | topic | title | cover |`.

Then tell John, briefly: the title and one-line angle, the file path, and the steps — Admin → Blog → New post, paste each field, press **Send for review**. Flag anything the reviewer should double-check (e.g. a figure from a single source).
