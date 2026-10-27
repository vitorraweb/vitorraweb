---
name: blog-post
description: Write the next Vitorra blog article from this week's news (FET/fuel, coffee, logistics, SEAL/first aid), with charts, and upload it to Admin → Blog as a draft for John to review and send to Marketing. Use when John types /blog-post or asks for a blog post / blog day.
---

# Vitorra blog day

The team writes blog posts with Claude in a session (no paid AI API — decided 27 October 2026). You research, write, draw the charts and upload the article as a **draft** (`scripts/push_blog_draft.py`). John reviews it in **Admin → Blog** and presses **Send for review**; Marketing (support@vitorra.org) publishes from the email. Nothing here can publish — the upload key only creates drafts.

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

Shape it so Google's answer boxes and AI assistants (ChatGPT, Copilot, Perplexity, Google AI Overviews) can quote it — people want the answer, not paragraphs before it:
- **Title as the question people search**, or the plain answer to it (e.g. "Why diesel is near Shs7,000 a litre in Uganda").
- **Open with the answer**: the first paragraph is 2–3 sentences that answer the title on their own, with the key number and its date. No scene-setting before it.
- **`##` headings as questions** where it reads naturally ("How much more does a 40-vehicle fleet pay?"), each followed by a direct one- or two-sentence answer, then the detail.
- **One fact per sentence** where a number is involved, with its date and source named in the sentence ("UBOS put inflation at 3.4% in September 2026").
- Before `## Sources`, add `## Questions` with 3–4 `###` questions a reader would ask next, each answered in 1–2 sentences. The site turns this section into FAQ data for search engines automatically (it looks for an `##` heading containing "Questions"), so keep each answer a single paragraph.
- Name places and things fully once (Uganda Revenue Authority, Mount Elgon, Northern Corridor): assistants match on names.

Hard rules:
- Every fact and figure comes from a source you opened. No invented numbers, quotes, names or dates. Say when something is uncertain.
- Mention Vitorra at most once, near the end, only where it genuinely helps, with one internal link. Only these claims:
  - **FET**: fitted to the fuel line between pump and filter, no engine modification. Independent CTI GmbH field test (Germany, Nov 2025): VW T5 from 11.52 to 9.92 L/100 km, 13.9%. One vehicle isn't every fleet, so it's sold via a free fuel assessment measuring the customer's own vehicles. From UGX 1,891,000 incl. installation. Links: `/products/fuel-eco-tech`, `/products/fuel-eco-tech#fet-calculator`, `/enquire?sector=FET`. Do not use the UBK 844L field results unless John says they're cleared for publication.
  - **SEAL**: chitosan hemostatic spray, US FDA 510(k) cleared. **Never** say or imply Uganda NDA approval. Not a tourniquet replacement. No medical advice beyond general first-aid awareness. Link: `/products/seal-wound-spray`.
  - **Coffee**: Ugandan Arabica for export buyers and local wholesale; retail bags not on sale yet. Links: `/products/coffee`, `/enquire?sector=COFFEE`.
  - **Logistics**: freight and supply-chain services quoted per shipment; no promises on border times or tracking. Links: `/products/logistics`, `/enquire?sector=LOGISTICS`.
- Never promise savings or outcomes.
- End the content with `## Questions` (above) and then `## Sources` — a bullet list of `[Publisher: page title](url)` for the pages you relied on.

## 4. Visuals

Every article gets a cover photo (below) and **1–2 charts** drawn from figures in the article — never a figure that isn't in the text. Good subjects: a price or volume before/after, a comparison across places or years, or a worked example (label it "Illustration by Vitorra").

Write a spec next to the draft as `planning/blog/drafts/images/YYYY-MM-DD-<name>.json` (format in the docstring of `scripts/blog_chart.py`: title as the takeaway, subtitle with the unit, 2–6 bars, one `highlight` at most, a `source` line naming the sources) and draw it:

```
[ -x scripts/.venv/bin/python ] || (python3 -m venv scripts/.venv && scripts/.venv/bin/pip -q install matplotlib)
scripts/.venv/bin/python scripts/blog_chart.py planning/blog/drafts/images/<spec>.json
```

**Photos (1–2, plus optionally the cover):** use freely licensed photos that fit the story — Wikimedia Commons is the default (search with the API, `generator=search&gsrnamespace=6&prop=imageinfo&iiextmetadatafilter=LicenseShortName|Artist`, with a User-Agent naming support@vitorra.org). Only CC0, CC BY or CC BY-SA. Download a 1600–1920px copy (`iiurlwidth`), look at it, resize to ≤1600px JPEG into `planning/blog/drafts/images/`, and never hotlink. Avoid identifiable faces where you can. Under each in-article photo put a credit line: `*Photo: <Artist>, [<licence>](<licence url>), via [Wikimedia Commons](<file page>)*`; for a local cover (`COVER IMAGE: images/<file>.jpg`, uploaded with the draft) add `*Cover photo: …*` as the last line of the content. Note the cover's source in the log.

Look at the PNG (Read it) for clipped or colliding labels before using it. Use millions ("Shs 18m", subtitle "million shillings") for large amounts. Put each chart in the content where it supports the text: `![Bar chart: <what it shows, with the numbers>](images/<name>.png)` — the alt text describes the chart for screen readers and Google.

## 5. Hand over

Save to `planning/blog/drafts/YYYY-MM-DD-<slug>.md` with this layout so each field maps to the editor:

```
TITLE: …
SLUG: …            (lowercase-hyphens, ≤ 80 chars)
EXCERPT: …         (1–2 sentences, ≤ 300 chars)
COVER IMAGE: …     (pick from the list below)
SEO TITLE: …       (≤ 60 chars)
SEO DESCRIPTION: … (≤ 155 chars)
TOPIC: fet | coffee | logistics | seal
---
<markdown content, ending with ## Sources>
```

Cover images (already on the site): fet → `/products/fet/field-truck.jpg`, `/images/stock/highway-sunset.jpg`, `/images/stock/road-mountains.jpg`, `/images/stock/engine-hands.jpg`, `/images/stock/hills-road.jpg`; coffee → `/images/stock/coffee-valley.jpg`, `/images/stock/coffee-cherries.jpg`, `/images/stock/coffee-hands.jpg`, `/images/stock/coffee-roaster.jpg`; logistics → `/images/stock/port-aerial.jpg`, `/images/stock/ship-wake.jpg`, `/images/stock/ship-aerial.jpg`, `/images/stock/warehouse-dark.jpg`; seal → `/images/stock/ambulance-motion.jpg`, `/images/stock/trauma-kit-open.jpg`. Don't reuse the cover of the previous post on the same topic (check the log).

Append a line to `planning/blog/LOG.md`: `| date | topic | title | cover |`.

Upload it as a draft (charts go with it):

```
python3 scripts/push_blog_draft.py planning/blog/drafts/YYYY-MM-DD-<slug>.md
```

It prints the draft's console link. If it says no key is found, ask John to run `/opt/alt/php83/usr/bin/php artisan blog:drafts-token` on the server and save the key it prints to `~/.config/vitorra/blog-drafts-token` (`chmod 600`) — never paste the key into the chat or a committed file. If the upload is refused or fails, give John the file path and the manual route (Admin → Blog → New post, paste each field) instead. Running it again with the same slug refreshes the same draft.

Then tell John, briefly: the title and one-line angle, the console link, and what to check before pressing **Send for review** (e.g. a figure from a single source).
