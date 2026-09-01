# What the 27 August Q&A means for the platform

**Source:** `Daily Operations Q&A Vitorra Holdings ltd` — 27 August 2026, 1h 17m.
**Written:** 1 September 2026. **Owner:** John Oluwaseyi (IT).

The meeting was a financial reckoning: **UGX 8m earned against UGX 152m spent**
January–August, roughly UGX 20–26m/month operating cost. Solomon went round every
department asking what was blocking them, and closed by promising a daily Q&A all
week and a workshop to fix it.

Most of what he asked for is **already built and not being used**. That is the
single most important finding in this document, and it changes what IT should do
next: less building, more putting existing tools in front of the people who
needed them three months ago.

---

## Two deadlines were set. One has passed.

| Ask | Said | Due | Status |
|---|---|---|---|
| Prospect data segmented by industry, ready for the Monday Q&A | "I need this data ready next week, on Monday, latest" | **Mon 31 Aug** | ⚠ **Passed** — but the data exists (see §1.1) |
| Present a junior software developer to Victor, then Solomon | "Evaluate them yourself, present them to Victor… before Wednesday next week" | **Wed 2 Sept** | ⚠ **Tomorrow** |

Solomon also said he will email a **formal KPI tool** to be automated and
integrated into Microsoft Teams (transcribed as "ABS" — the name is unclear from
the recording and should be confirmed before any work starts).

---

## 1. Already built — the job is to show it, not build it

Six of the eight complaints raised in that room are answered by software that is
already deployed. Nobody in the meeting appeared to know. Each of these is a
demo, a login, or a setting — not a project.

### 1.1 "Segment the data — transport, manufacturing, hardware, private users"

> "Data for transport companies have them separately. Data for manufacturing
> companies have them separately… Private users put them separately."

**Built.** `/admin/prospects` already segments **by product and by industry
vertical** — 163 FET leads and 124 SEAL leads across 9 verticals, with a product
switcher that changes the industry list with it. One company can sit on both
lists.

**To close the ask:** open the screen in the next Q&A. If a vertical Solomon
wants is missing (private users, hardware), it is a config change in
`Prospect::CATEGORIES_BY_PRODUCT`, not a build.

⚠ Still outstanding from July: **7 SEAL rows flagged as unreadable** and one
unnamed sports-association row. Ten minutes of marketing's time. These were
flagged rather than guessed, which is the right call — but they have sat there
for six weeks.

### 1.2 "We must find a way of automating e-mail marketing"

**Built.** Select any set of prospects → one email, `{name}` personalisation, up
to 5 attachments (encrypted at rest), sent from `support@vitorra.org` so replies
reach the shared inbox rather than one person's Outlook. Save as template.
Honest reporting: delivered vs. failed vs. no-email-on-file vs. shared-inbox
duplicates. Large sends run in the background and cannot half-send.

**Not built:** a *cadence*. See §2.2 — Solomon specifically asked for "be that
annoying person that only appears once a month", and that part does not exist.

### 1.3 "Are you in a position to automate that financial snapshot?"

**Built, and switched off.** `/admin/executive` is a business-language CEO
dashboard — money received, money owed, new orders and enquiries, conversion,
response time, demand — with period-over-period arrows. It **emails itself
monthly and weekly** to the CEO, CC Ops and Finance.

**Why Solomon has never seen it:** the recipients were never set in
`/admin/settings`. It has been sending to nobody since June.

> **This is the highest-value five minutes of work in this document.** Set
> `exec_report_to` and `exec_report_cc` today.

Behind it, **Vitorra Books** (`/admin/accounting`) already does what Joseph was
sharing from a spreadsheet: multi-currency ledger, P&L, cash position, payables,
budgets, VAT, invoicing, and **profit per business line** (FET / SEAL / Coffee /
Logistics). Joseph's "maybe we can agree if we're going to have a proper
financial system" was answered in June.

⚠ Blocked: Books enforces maker–checker (junior records, senior approves).
Nobody has been granted **"Accounting — approve"**, so nothing can be approved
and nothing moves the balances. Same grant also blocks all leave approvals.

### 1.4 "How many people took days off — normal holiday or not?"

**Built.** The staff portal counts working days excluding weekends and Uganda
public holidays, tracks the annual balance, and distinguishes leave types.

⚠ **Blocked by the same missing permission.** Since 5 August, leave requires two
signatures — Operations and Finance — and "Finance" means the holder of
"Accounting — approve". Nobody holds it, so **no leave request can reach
approved**. Solomon is about to ask for leave data from a system that has been
unable to record an approval for four weeks.

### 1.5 "The FET has no module of collecting that data"

This was the most damaging claim in the meeting — marketing stating, in front of
the CEO, that the product cannot be measured and that they have lost confidence
in it.

**It is not correct, and IT is responsible for that not being known.**

- **FET savings** (`/admin/fet`, customer view `/account/fet`): staff record each
  device fitted; savings are computed brim-to-brim from readings against a
  baseline, giving reduction %, litres, money and CO₂. **Customers log their own
  fill-ups** and download a branded **Proven Savings certificate**. A monthly
  digest emails each customer their measured savings and nudges overdue readings.
- **FET Trial Manager** (`/admin/fet-trials`): upload the client's own
  spreadsheet in their own layout, 14 data-quality checks, route-stratified
  comparison, branded PDF, and a **read-only client link**.

The honest part: the Hariss trial, once settled, showed **flat — 0.2% more fuel
than baseline** across three comparable pairs. The system refused to publish a
saving it could not defend, which is exactly right and is what protects Vitorra
in front of a client. But it does mean marketing's underlying worry is real and
must be answered with evidence, not reassurance.

### 1.6 "Come up with a pipeline — he pays weekly, then we install"

Agata's father's request. **Built:** per-order pay-in-parts plans; staff record
each payment offline; the order moves pending → partial → paid automatically and
the customer sees the schedule and balance in their portal.

**Online** card and mobile-money payment (Flutterwave, incl. MTN/Airtel) is also
built and tested — and **switched off**. Activating it is configuration, not
code. Given that price is the number-one stated objection, a working "pay in
instalments online" is the most direct commercial answer available.

### 1.7 "Why are you bounded to Kampala? Kenya… Rwanda"

The public site is already **English + Swahili**, with a **French pilot** on
`/careers`. Swahili covers Kenya and Tanzania; French covers Rwanda. Expanding
French site-wide is translation work, not engineering.

### 1.8 Hiring — both roles Solomon ordered

`/careers` is a live job board with **AI CV extraction** and an applicant
pipeline (new → review → shortlist → hired/rejected), CVs encrypted at rest and
auto-purged after 6 months.

**Use it for both the junior developer (due tomorrow) and the digital
marketer.** Post both openings today; it is the fastest route to candidates and
it demonstrates the platform to Solomon at the same time.

---

## 2. Real gaps — verified against the code, not assumed

These are things Solomon asked for that genuinely do not exist.

### 2.1 We cannot say where a single lead came from ✅ BUILT 1 Sept

Solomon spent roughly ten minutes on Google Ads: how much are we spending, why
are we getting betting and loan and dating enquiries, "where is most of the money
being projected".

**We cannot answer any of it.** I checked: there is **no UTM, referrer, `gclid`
or lead-source capture anywhere** in the backend or frontend. The `enquiries`
table has no source column. Every enquiry, from every channel, is
indistinguishable.

So the company has been spending on Google Ads with no way to know whether a
single shilling produced a customer. Victor's diagnosis (ads served inside
betting and loan apps) is almost certainly right and is a placement problem — but
it should never have taken a CEO's cross-examination to surface it.

**Build:** capture `utm_source`/`medium`/`campaign`, `gclid` and referrer on the
enquiry, contact, newsletter and WhatsApp-click paths; store on the record;
report by channel on the admin dashboard and in the executive report. Small —
one migration, a hidden form field carried through the funnel, and a chart.

This turns "how much are we spending on Google?" into a number on a screen.

### 2.2 Prospects have no "last contacted" date

> "This data must be kept alive at least once a month. Be that annoying person
> that only appears once a month."

The `prospects` table has an `outreach_status` flag (`not_contacted` /
`contacted`) and a free-text `follow_up`, but **no timestamp**. Once a lead is
marked contacted it is contacted forever. There is no way to ask "who has not
been touched in 30 days" — which is precisely the campaign Solomon ordered.

**Build:** `last_contacted_at`, set automatically when a campaign email goes out;
a "not contacted since…" filter; and a monthly reminder listing prospects going
cold. The daily digest already does exactly this for the *customer* pipeline
(`PipelineContactsGoingCold`) — extend the same pattern to prospects.

### 2.3 Nothing alerts on an unanswered enquiry ✅ BUILT 1 Sept

> "This was e-mail of 9 July. Nobody responded to it."

`replied_at` exists and is *measured* — the executive report averages response
time — but nothing ever *alerts* on it. An enquiry can sit unanswered
indefinitely and no one is told.

That single unanswered enquiry was a live buyer with a named vehicle. In a year
with UGX 8m of revenue, losing one is material.

**Build:** an SLA alert — enquiry unanswered after 4 working hours emails the
assignee, after 24 hours escalates to Victor and Solomon. Rides the existing
cron. Half a day's work, and it stops the exact failure Solomon caught.

### 2.4 The FET savings calculator uses a European fuel price

`DEFAULT_FUEL_PRICE_EUR = 1.65` — roughly the German pump price. Ugandan diesel
is materially cheaper, so the public calculator **overstates the money a Kampala
buyer saves and understates the payback period**.

Given that marketing's confidence collapsed over savings not matching the
promise, a calculator biased optimistic is a serious credibility risk. A client
who checks the arithmetic will find it.

**Fix:** default to a Uganda pump price and let the user edit it. The pricing
page already carries a currency converter, so the EUR-quoted prices themselves
are fine.

### 2.5 The monthly event log John promised

In the meeting John told Solomon: *"monthly, we can be sending monthly event logs
of how the system is being used."*

The audit trail exists (`/admin/audit` — who opened a contract, medical note, CV
or supplier bank details; who approved or voided money; role changes; 2FA
changes). The **monthly send does not.** It was promised to the CEO in a meeting
about accountability, so it should be built.

**Build:** a monthly audit summary emailed to Solomon. Small — the data is
already there.

### 2.6 WhatsApp is outside the system entirely

Solomon asked for statistics on cold WhatsApp chats and got none, because WhatsApp
lives on a handset. Sarah has been archiving junk leads manually.

WhatsApp Business notifications have been on the backlog since June (needs
Solomon's approval and a one-time business setup, small per-message cost). The
meeting made the case for it: WhatsApp is where the leads actually are, and none
of it is recorded, counted, or followed up.

**Recommend** raising it as a costed proposal rather than building speculatively.

---

## 3. One thing to correct with Solomon, in writing, this week

In the meeting John said self-managed infrastructure would mean **"reduced
costs"**.

`planning/12-aws-migration-plan.md` and `PROGRESS.md` both say the opposite, and
have since it was planned: **AWS is about $78/month against roughly $20 for
Vercel** — deliberately more expensive, because what is being bought is
ownership and control, not a cheaper bill. For a fortnight after the switch we
pay both, because Vercel is the rollback.

Right now that difference is buried in a planning document. When the first bill
arrives in a company that has just spent UGX 152m against UGX 8m of revenue, it
will land as a cost increase nobody was told about — immediately after a meeting
where the CEO said he has no emotion about people who cost him money.

**Correct it proactively, in business language, before the switch:**

> Moving the website onto our own AWS account costs about **$78 a month against
> $20 today** — roughly **UGX 210,000 more per month**. It is not a saving. What
> it buys is that no outside company can change our pricing or terms without our
> agreement, we can see what we spend to the penny with alerts before a bill
> surprises anyone, and it gives the incoming junior engineer a real system to
> own. If the priority right now is cash, this can wait — nothing about it is
> urgent, and the current arrangement works.

Offering the option to defer is what makes this credible rather than defensive.
Note the separate point stands: **Okelcor's** hosting costs with Vasil Inc are
rising, and self-management may well be cheaper *there*. The two should not be
argued as one case.

---

## 4. Decisions John needs, and should ask for

These are not IT's to make alone. Put them in the Monday Q&A.

1. **One CRM, not two.** John raised this and it was not resolved: finance and
   ops use an external CRM while the internal platform holds prospects,
   customers, campaigns, tasks and accounting. Two systems means the answer to
   "how many companies have we reached out to" lives in neither. The internal
   platform costs nothing and is already built — but the decision must be
   Solomon's or Victor's, and then enforced.
2. **Who holds "Accounting — approve"?** One name unblocks leave approvals *and*
   the accounting ledger. A second name stops it stalling when they are away.
   This is currently blocking two whole modules.
3. **Confirm the "ABS" KPI tool** Solomon intends to send, and whether Teams
   integration means an app, a webhook, or a report. Do not start until the name
   and the shape are confirmed.
4. **Testimonials and referrals need recorded consent.** Marketing is being asked
   for live client references and is stuck asking for permission ad hoc. A
   consent flag on the customer record and a short "reference customers" list
   would let sales answer immediately.
5. **Run a pilot on our own vehicles.** Marketing asked, correctly: *"Did we even
   carry out a pilot study besides the tests given to us by Holger?"* The Trial
   Manager already does this end to end. Instrumenting company cars is the
   cheapest route to the live reference every prospect is asking for, and it
   costs nothing but time.

---

## 5. Suggested order of work

**Today**
1. Set executive-report recipients in `/admin/settings` — five minutes, and it is
   the thing Solomon directly asked John for.
2. Grant "Accounting — approve" to the Senior Finance Officer and one backup.
3. Post the junior-developer and digital-marketer openings on `/careers`.

**Before the Wednesday deadline**
4. Present junior-developer candidates to Victor.

**This week**
5. ~~Lead-source capture (§2.1)~~ ✅ built 1 Sept — deploy it.
6. ~~Unanswered-enquiry SLA alert (§2.3)~~ ✅ built 1 Sept — deploy it, and set
   `ENQUIRY_SLA_ESCALATE_TO` or escalations reach the team inbox only.
7. Send the AWS cost correction (§3).
8. Demo the prospect segmentation, campaigns, executive dashboard and FET tools
   in the Q&A. Most of the meeting's complaints close on that one screen-share.

**Next**
9. `last_contacted_at` + monthly cold-prospect reminder (§2.2).
10. Fix the calculator fuel-price default (§2.4).
11. Monthly audit-log summary to the CEO (§2.5).
12. Cost WhatsApp Business and put it to Solomon (§2.6).

**Deliberately not now:** the AWS cutover. It is blocked on Amazon verifying two
member accounts, it increases monthly cost, and none of the above depends on it.

---

## Appendix — the eight complaints, and where each stands

| Raised by | Complaint | Where it stands |
|---|---|---|
| Marketing | Price is the blocker | Instalments built; online payment built, not switched on; calculator overstates savings (§2.4) |
| Marketing | No way to collect proof data | **Incorrect** — FET savings + Trial Manager built (§1.5) |
| Marketing | No confidence in the product | Hariss settled at flat; needs an own-vehicle pilot (§4.5) |
| Marketing | No live client references | Needs consent capture (§4.4) |
| Finance | No proper financial system | Vitorra Books built; blocked on one permission (§1.3) |
| Finance | Reporting not visible to CEO | Executive report built; recipients never set (§1.3) |
| Ops | Google Ads bringing junk leads | Placement problem — and **unmeasurable today** (§2.1) |
| Design | Content reaches nobody but us | Outside IT; needs paid distribution and a digital marketer |
