# FET trial — Hariss International, truck UA 758AM

**What this trial can and cannot prove**

| | |
|---|---|
| **Date** | 11 August 2026 |
| **For** | Marketing & Operations |
| **From** | John Oluwaseyi, IT Officer |
| **Sources** | `UA 758AM FET REPORT.xlsx` (Hariss), `FET_Trial_Log_UA758AM_Branded.xlsx` (Vitorra) |

Hariss fitted a trial FET unit to one truck on 27 July and has sent us their tracking
export. This is a check of that data before anything goes back to the client — what it
shows, what it does not, and what we need to ask for next.

---

## The verdict

> ### The trial cannot yet prove anything — in either direction.
>
> **Do not send a saving figure to Hariss.**
>
> Three trips were recorded after the device was fitted. One carried a return load that
> roughly doubled its work. One is dated four months before the unit was installed. The
> third never finished. That leaves nothing we can honestly compare.
>
> Nothing in this file supports a claim that FET helped. Just as importantly, **nothing
> in it supports a claim that FET did not help** — so a disappointing early reading is
> not a reason to back away from the deal. The trial simply has not run long enough yet.

---

## Finding one — one copying error, and one figure the client contradicts themselves on

> **Correction to the first version of this note.** I originally reported that the
> weighbridge columns in our *Victorra Data* sheet were misaligned across all eleven
> rows. **That was wrong.** A trip's return empty-weight is recorded at the *next*
> loading session, because the truck is weighed again when it gets back and is loaded
> for its next run. The timestamps prove it: trip 1 arrived at the factory at 17:16 on
> 6 July and the next weighbridge ticket is stamped 17:17 — the same event. The
> alignment is correct, in both the client's sheet and ours.

Two real problems remain in the fuel figures.

**1. Kitgum is wrong in our extract.** We recorded **400 litres**. Both of the client's
own sheets say **320**.

**2. Kamwenge is contradicted inside the client's own file.** Their dispatch sheet says
**340 litres**; their tracking export says **400**. We copied 400.

| Trip | Client dispatch sheet | Client tracking export | Our extract | |
|---|---:|---:|---:|---|
| Apac … Masindi (first nine trips) | *agree* | *agree* | *agree* | ✅ |
| Kamwenge | 340 | **400** | 400 | ⚠ client disagrees with themselves |
| Kitgum | 320 | 320 | **400** | ❌ our copying error |

The Kamwenge one matters more than it looks. At 340 litres that trip works out at **45.2**
litres per 100 km; at 400 litres it works out at **53.8**. It also moves the headline
figure in Finding two: the "20.6% worse" reading becomes **8.5% worse** if 340 is the
correct number. A single unresolved figure swings the result by twelve percentage points.

That is the argument for the tool in one line: not that people are careless, but that a
process which depends on retyping numbers between differently-shaped spreadsheets has no
way of catching either of these before they reach a client.

---

## Finding two — the number the file produces is an artefact, not a result

Calculated straight, the eight trips before installation average **43.19 litres per
100 km** and the two measurable trips after it average **52.09** — which reads as the
truck getting **20.6% worse**. (And as Finding one shows, that reading drops to **8.5%
worse** if the disputed Kamwenge fuel figure turns out to be 340 rather than 400 litres.)

**That figure should not leave this document.** Here is why each of the three
post-installation trips fails.

### Masindi — 28 July — EXCLUDED
The truck came back **loaded**. Its return weight was 49,120 kg against the usual empty
weight of about 19,100 kg — roughly 30 tonnes of sugar brought back on top of the 30
tonnes taken out. That is close to twice the work of any trip it is being measured
against, so of course it burned more fuel. This tells us nothing about the device.

### Kamwenge — dated 1 April — EXCLUDED
The unit was fitted on 27 July, so a trip dated April cannot be a trial trip. The client's
own dispatch sheet shows this load leaving on 30 July and returning on 2 August, and the
journey times in the tracking export match that span exactly. **The trip is real; the
dates on it are wrong.** Worth correcting rather than discarding — but it cannot be used
until Hariss confirms it.

### Kitgum — 4 August — EXCLUDED
No distance was recorded and the export marks it as an uncompleted trip. There is nothing
to calculate from.

---

## Finding three — the route decides the fuel, far more than the device could

Before the unit was fitted, this truck's fuel use ranged from **35.77** litres per 100 km
on the Apac run to **50.49** on Mpondwe. That is a **41% difference driven purely by which
road it was sent down** — roughly three times the size of the 13.9% saving FET is
independently certified to deliver.

### Fuel used per 100 km, by destination (before the unit was fitted)

| Destination | L/100 km | | Trips before install |
|---|---:|---|---|
| Apac | 35.77 | `██████████████████████` | 1 trip |
| Moroto | 36.43 | `██████████████████████` | 1 trip |
| Masindi | 39.64 | `████████████████████████` | 1 trip |
| Arua | 42.39 | `██████████████████████████` | 1 trip |
| Bugiri | 44.24 | `███████████████████████████` | 1 trip |
| Kabale | 45.73 | `████████████████████████████` | 1 trip |
| **Mpondwe** | **50.49** | `███████████████████████████████` | **2 trips — the only usable baseline** |
| Kamwenge | — | *no trip on this route before installation* | none |

The two excluded trial trips, for reference: **Masindi 49.47** (returned loaded) and
**Kamwenge 53.76** (no baseline exists to compare it against).

Read across the rows, not down them: **a trip to Mpondwe costs 41% more fuel per kilometre
than a trip to Apac, before any device is involved.** Comparing a post-installation
Mpondwe run against a pre-installation Apac run therefore measures the road, not the
product.

### The encouraging part

Mpondwe was driven twice before the unit was fitted, and the two runs came in at **49.45
and 51.54** litres per 100 km — just **4.2% apart**. On the same road with the same load,
this truck is a remarkably steady measuring instrument.

That matters: a 13.9% improvement would stand out clearly against that kind of
consistency. **The measurement problem is entirely about comparing like with like — not
about the truck being unpredictable.** Get the comparison right and this trial will give
a clean answer.

---

## Why it went wrong — our trial log asks for readings Hariss does not take

This is the root of the confusion the marketing team ran into, and it is on our side.

| Our branded log asks for | What Hariss actually records | Can it be filled? |
|---|---|---|
| Odometer at departure and return | Distance from the vehicle tracker | **No** — they do not read odometers at all |
| Fuel in the tank at departure and return | Opening stock, fuel issued, closing stock | **No** — different measurement entirely |
| Load in tonnes | Weighbridge readings in kilogrammes | Only after converting |
| 14 trips inside 14 days | One trip roughly every 3 days | **No** — 14 trips is about 6 weeks |

Two of the four fuel and distance columns we ask for cannot be filled from anything
Hariss holds. The marketing team was not confused — they were being asked to produce
numbers that do not exist.

### ⚠ A harder problem — the baseline cannot be re-collected

Measuring a saving needs a solid "before" figure on the same route. Mpondwe is the only
destination this truck ran twice before installation; every other route was run exactly
once. **The unit is now fitted, so no further "before" trips can ever be recorded on this
truck.**

There is one way out, and it costs nothing — see action one below.

---

## What to do — five actions, in order of what they are worth

### 1. Ask Hariss for this truck's trip history back to January
*Owner: Marketing · This week*

By far the highest-value thing we can do, and it can be asked for today. Their tracking
system already holds it — the file they sent was simply filtered to the trial period. Six
months of history would give us several "before" trips on every route, rebuild the
baseline that cannot otherwise be recovered, and could make the trial conclusive within
weeks instead of months. Same export format, no extra work for them.

### 2. Ask for three specific corrections
*Owner: Marketing · This week*

- Whether the **Kamwenge** trip really ran from 30 July to 2 August, as their dispatch
  sheet shows — **and whether it took 340 or 400 litres**, since their own two sheets
  disagree and the answer moves the headline by twelve percentage points.
- Whether the **Kitgum** trip ever completed, and what distance it covered.
- Confirmation that the **Masindi** trip on 28 July carried a return load of sugar.

All are quick questions, not a data request.

### 3. Ask that trial loads be sent down routes we can measure
*Owner: Marketing with Operations*

Until the history arrives, Mpondwe is the only destination with a usable "before" figure.
Three trial runs to Mpondwe would give a defensible answer on their own. If Hariss cannot
direct the truck that way, the history in action one becomes essential rather than merely
useful.

### 4. Restate the trial length in trips, not days
*Owner: Marketing · Before the next client conversation*

Our log promises fourteen trips in fourteen days. This truck completes one every three
days, so fourteen trips is about six weeks. Agreeing a realistic window with Hariss now
avoids the trial appearing to fail simply because it was described wrongly at the start.

### 5. Send Hariss nothing but the corrections request until then
*Owner: Everyone on the account*

No percentage, no litres saved, no projected annual figure. A number we cannot defend
under questioning is worse for this deal than saying the trial is still running — which
is the truth, and a perfectly normal thing to tell a client four weeks into a fuel trial.

---

## Next — we are building the tool that prevents this

Work has started on a **FET Trial module** inside the admin panel. Marketing uploads
whatever file the client sends, in whatever shape it arrives. The system reads it, checks
it for the kinds of problems found above, does the arithmetic route by route, and — this
is the important part — **refuses to state a result until the evidence actually supports
one**, telling you instead exactly which trips are still missing.

Clients get a live read-only link and a branded report generated from the checked figures,
instead of a spreadsheet typed out by hand. Hariss will be the first trial loaded into it,
and every trial after this one is then a repeat of the same process rather than a fresh
puzzle.

---

## Notes on method

- All figures independently recalculated from the two source workbooks on 11 August 2026.
- Fuel averages are **weighted by distance**: total litres divided by total kilometres,
  not an average of each trip's figure. Averaging the trips instead would have overstated
  the truck's efficiency by 1.7% (2.354 vs 2.315 km/L).
- The Kamwenge date correction is **inference, not confirmation** — it rests on the
  client's dispatch sheet and matching journey durations. Action 2 asks Hariss to confirm
  it rather than assuming it.
- **Revised 11 August:** the first version of this note claimed the weighbridge columns
  in our extract were misaligned across all eleven rows. They are not — see the
  correction in Finding one. If that version was circulated, this one supersedes it. The
  verdict, the route analysis and the five actions are unchanged; only Finding one moved.
- Nothing has been sent to Hariss. Actions 1 and 2 need someone on the account.

*Questions to john@vitorra.org.*
