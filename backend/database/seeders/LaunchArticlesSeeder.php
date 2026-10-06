<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * The first four editorial articles (October 2026), written for search:
 * each answers a question Vitorra's buyers actually type into Google.
 * Idempotent (updateOrCreate by slug), so it is safe to run repeatedly:
 *   php artisan db:seed --class=LaunchArticlesSeeder --force
 *
 * Every figure is one Vitorra can stand behind: the CTI GmbH VW T5 report,
 * the public FET pricing and calculator model, the coffee trade listing
 * (frontend/src/lib/coffee-export.ts) and the SEAL product deck. Worked
 * examples are labelled as examples. No Uganda regulatory approval is claimed
 * for SEAL. Images are served by the frontend from /public (real FET field
 * photographs and the SEAL manufacturer image; the coffee image is licensed
 * stock, see public/images/stock/README.md, and is not captioned as ours).
 */
class LaunchArticlesSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::where('role', 'admin')->first() ?? User::first();

        foreach ($this->articles() as $i => $a) {
            BlogPost::updateOrCreate(
                ['slug' => $a['slug']],
                [
                    'user_id'         => $author?->id,
                    'title'           => $a['title'],
                    'excerpt'         => $a['excerpt'],
                    'content'         => trim($a['content']),
                    'cover_image'     => $a['cover'],
                    'status'          => 'published',
                    // Minutes apart, fleet-fuel guide newest so it leads the blog.
                    'published_at'    => Carbon::parse('2026-10-06 09:00:00')->addMinutes((3 - $i) * 10),
                    'seo_title'       => $a['seo_title'],
                    'seo_description' => $a['seo_description'],
                ]
            );
        }
    }

    private function articles(): array
    {
        return [
            [
                'slug'            => 'how-to-reduce-fleet-fuel-costs-uganda',
                'title'           => 'How to reduce your fleet’s fuel costs in Uganda: a practical guide',
                'excerpt'         => 'Fuel is usually the biggest running cost a Ugandan fleet has. Here is how to measure it properly, the everyday habits that bring it down, and how to judge any fuel-saving product on your own numbers.',
                'seo_title'       => 'How to Reduce Fleet Fuel Costs in Uganda',
                'seo_description' => 'A practical guide for Ugandan fleet owners: measure fuel use per vehicle, cut idling and waste, maintain engines and tyres, stop fuel loss, and test savings properly.',
                'cover'           => '/products/fet/field-truck.jpg',
                'content'         => <<<'MD'
For most transport, construction and distribution businesses in Uganda, fuel is the largest cost after salaries. It is also the cost most owners know least about, because it is paid in small amounts, by many drivers, at many pumps.

This guide is for anyone who runs vehicles for a living: a boda boda association, a school with three buses, or a haulier with forty trucks. None of it needs special equipment to start.

## 1. Measure fuel use per vehicle, not per month

You cannot reduce what you do not measure. A monthly fuel bill tells you how much you spent; it does not tell you which vehicle, which route or which driver is costing you money.

For every vehicle, record three things each time it is filled:

- the date and the litres bought
- the odometer reading
- the driver and the route

From that you get the number that matters: **litres per 100 km** (or kilometres per litre, if your team thinks that way). Divide the litres used by the distance driven and multiply by 100.

After a month, compare vehicles doing similar work. The one that uses noticeably more than its twins is where you start looking.

## 2. Put a shilling figure on it

A worked example makes the stakes clear. Take one diesel truck that:

- drives 60,000 km a year
- uses 30 litres per 100 km
- buys diesel at UGX 5,000 a litre (use your own pump price)

That truck burns 18,000 litres a year, which is **UGX 90 million**. Every 1% you save on that one truck is worth UGX 900,000 a year. Multiply by your fleet and small improvements stop being small.

## 3. Stop paying for idling

An engine running while the vehicle stands still uses fuel and goes nowhere. It happens while loading, while waiting at a client's gate, and while a driver keeps the air conditioning on during a break.

Set a simple rule, such as switching off when a stop will last more than a couple of minutes, and check it against your fuel log. Drivers respond to rules they can see being measured.

## 4. Keep tyres and engines in condition

Under-inflated tyres make the engine work harder on every kilometre. Check pressures weekly, with the vehicle cold, against the figure on the door pillar or in the handbook, and adjust for the load you carry.

On the engine side, the cheap items matter most on dusty Ugandan roads: air filters clog quickly, and a choked filter means a richer, wasteful burn. Fuel filters and injectors deserve the same attention. Follow the service interval for your conditions, not the one for ideal roads.

## 5. Plan routes and loads

Empty return journeys, two half-loads where one full load would do, and routes chosen out of habit all burn fuel without earning money. Before buying anything, look at a week of trips and ask which ones could have been combined, shortened or timed to miss the worst traffic in Kampala.

## 6. Coach the way vehicles are driven

Hard acceleration, late braking and high cruising speeds use more fuel than a smooth, steady drive. The difference between drivers on the same vehicle and route is often larger than owners expect, and your per-vehicle log (step 1) will show it. Share the numbers with drivers, recognise the best ones, and coach the rest.

## 7. Close the gaps where fuel disappears

Not every missing litre is burned. Reconcile what you paid for against what each vehicle should have used for the distance it covered. Use fuel cards or receipts tied to a vehicle, lockable tank caps, and spot checks. A gap that keeps appearing on one vehicle or one route needs a conversation.

## Where fuel-saving technology fits

Once you are measuring properly, you are in a position to judge any product that claims to save fuel, including ours. The test is simple: **does your own log show a saving, on your own vehicles, on your own routes?**

[Fuel Eco Tech](/products/fuel-eco-tech) is a device fitted to the fuel line, between the pump and the filter, without modifying the engine. In an independent field test in Germany, a Volkswagen T5 van went from 11.52 to 9.92 litres per 100 km, a 13.9% reduction ([we explain that test, and its limits, here](/blog/fuel-eco-tech-vw-t5-field-test-results)). One vehicle is not your fleet, which is why we sell it the same way this guide recommends: we measure a few of your vehicles before and after fitting, and you decide on the result, including if the saving is small or none.

## Start this week

1. Start a fill-up log for every vehicle.
2. After four weeks, rank vehicles by litres per 100 km.
3. Fix the obvious: tyres, filters, idling.
4. Then test anything else against your own baseline.

If you would like a second pair of eyes on your numbers, [estimate your saving with our calculator](/products/fuel-eco-tech#fet-calculator) or [book a free fuel assessment](/enquire?sector=FET). We will tell you honestly if the device is not worth it for a vehicle.
MD,
            ],
            [
                'slug'            => 'fuel-eco-tech-vw-t5-field-test-results',
                'title'           => 'The VW T5 field test: what a 13.9% fuel reduction does and does not tell you',
                'excerpt'         => 'An independent engineering firm measured a working Volkswagen van before and after Fuel Eco Tech was fitted. Here is what was measured, how to read it, and why we still test on your own vehicles.',
                'seo_title'       => 'Fuel Eco Tech Test Results: 13.9% Fuel Reduction on a VW T5',
                'seo_description' => 'Independent CTI GmbH field test of Fuel Eco Tech on a VW T5: 11.52 to 9.92 litres per 100 km, a 13.9% reduction. What the result means, and its limits.',
                'cover'           => '/products/fet/field-installed.jpg',
                'content'         => <<<'MD'
When a product claims to save fuel, the first question should be: measured by whom, on what, and for how long? This article sets out the evidence behind Fuel Eco Tech (FET) plainly, including what it cannot prove.

## The test in brief

| Detail | |
|---|---|
| Vehicle | Volkswagen T5 van in daily public-sector service |
| Operator | Landesbaubehörde Stadthagen, Hannover region, Germany |
| Period covered | January to October 2025 |
| Assessed by | CTI GmbH, Lippstadt, Germany |
| Report signed | 10 November 2025 |

The van was not a laboratory car. It was a working vehicle doing its normal job, with its fuel use logged before and after the device was fitted.

## What was measured

- **Before FET:** an average of **11.52 litres per 100 km**, recorded over **13,468 km** of normal use.
- **With FET:** **9.92 litres per 100 km** in the first full month after fitting.
- **Difference:** 1.6 litres less for every 100 km, a **13.9% reduction**.

The report compares that against the normal month-to-month variation in a vehicle's fuel use, which it puts at around 3 to 5%. A change of 13.9% sits well outside that band, which is why the assessors treated it as a real effect rather than noise.

## What it means in money

Using the van's own numbers as an example: at 20,000 km a year, 1.6 litres saved per 100 km is 320 litres a year. Multiply that by your own pump price to see the value. For a heavier vehicle that burns more fuel per kilometre, the same percentage is worth considerably more, which is why fleets and trucks see the shortest payback.

Our [savings calculator](/products/fuel-eco-tech#fet-calculator) does this sum with your vehicle, your distance and your fuel price. It starts at a 0% saving on purpose, so you can see what the purchase looks like if it saves nothing.

## What the test does not tell you

We think buyers should hear this from us:

- **It is one vehicle.** A single van's result is evidence, not a guarantee for every engine.
- **The "after" period is one month.** A longer period would show whether the saving holds through seasons and service intervals.
- **German conditions are not Ugandan conditions.** Road surfaces, loads, fuel quality, traffic and driving styles all differ.
- **Results vary by vehicle.** Engine type, age, condition and how the vehicle is driven all affect the outcome.

None of this makes the result less real. It means the right next step is to measure on your vehicles.

## How we apply it in Uganda

That is why we do not ask anyone to buy on the strength of one report:

1. **Assessment.** We look at your vehicles, routes and fuel records, and confirm which of the [four device sizes](/products/fuel-eco-tech) fits each one, at no cost.
2. **A measured trial.** We fit a small number of vehicles and compare their fuel use against their own history, route by route, on terms agreed in writing first.
3. **Your decision.** You see the result in a report, including if the saving is small or none, before we discuss the rest of the fleet.

## About the device

FET fits on the fuel line between the fuel pump and the fuel filter, outside the high-pressure system, with no modification to the engine or factory-set components. Fitting takes under an hour. Devices are sized for engines from small cars to heavy goods vehicles, and carry a 12-month warranty against manufacturing defects.

The full report is available on request, along with the other documents listed on our [certifications page](/trust/certifications). If you run a fleet, [book a free fuel assessment](/enquire?sector=FET) and we will show you what the numbers look like for your own vehicles.
MD,
            ],
            [
                'slug'            => 'buying-ugandan-arabica-coffee-for-export',
                'title'           => 'Buying Ugandan Arabica coffee for export: grades, terms and documents explained',
                'excerpt'         => 'A plain guide for importers and roasters sourcing coffee from Uganda: what the grades mean, how EXW terms and minimum orders work, which documents to ask for, and how to request samples.',
                'seo_title'       => 'Buy Ugandan Arabica Coffee for Export | Grades, MOQ, Terms',
                'seo_description' => 'How to buy Ugandan Arabica coffee for export: AA, A, AB, B and PB grades, HS code 0901.21, 1-tonne minimum, EXW terms, documents and samples explained.',
                'cover'           => '/images/stock/coffee-cherries.jpg',
                'content'         => <<<'MD'
Uganda is one of Africa's leading coffee producers, and its Arabica, grown at altitude on the slopes of Mount Elgon in the east and the Rwenzori mountains in the west, has a following among roasters who want body and sweetness. If you are sourcing from Uganda for the first time, the trade terms can be harder to read than the cup. This guide explains them, using our own export offer as the worked example.

## What the grades mean

Ugandan coffee is graded largely by bean size, measured by the screen a bean will not pass through. Bigger, more uniform beans generally command higher prices.

- **AA:** the largest screen size, the top of the commercial range.
- **A:** a large, even bean, and the grade our listed price is quoted on.
- **AB:** a blend of A and B screens, a common export workhorse.
- **B:** a smaller screen, consistent in the cup.
- **PB (peaberry):** the single round bean that forms when only one seed develops in the cherry, selected separately.

Ask any supplier for a grading report with each lot, and judge the sample in the cup, not just on paper.

## Roasted or green: check the HS code

Our export product is **roasted Arabica beans**, which trade under **HS code 0901.21** (roasted coffee, not decaffeinated). Green coffee falls under a different code (0901.11). The code drives import duties and paperwork in your country, so confirm it with your customs broker before you order.

## Minimum orders and lead times

- **Minimum order:** 1 metric tonne.
- **Lead time:** around 7 working days from order confirmation.
- **Packaging:** made to the buyer's specification.

A one-tonne minimum suits specialty roasters and importers testing a new origin before committing to container volumes.

## Price and incoterms

Our indicative band for the standard grade is **USD 5,600 to 5,800 per metric tonne, EXW** (Ex Works). Two points matter here:

- **EXW** means the price covers the coffee ready for collection; the buyer arranges and pays for transport, export clearance and insurance from that point. Shipments from Uganda typically move through the port of **Mombasa**. If you would rather not manage the inland leg, ask for a quote on other terms, and [our logistics team](/products/logistics) can quote freight separately.
- **Bulk is quoted separately.** The band is not a bulk price. Larger orders are priced on quantity, grade, packaging and destination.

## Documents to ask for

Agree the paperwork before you pay, not after. For most destinations you will want:

- a **certificate of origin**
- a **grading and quality report**
- a **phytosanitary certificate**
- **food-safety documentation**

Requirements differ by market. If you import into the European Union, raise the EU Deforestation Regulation (EUDR) at the very start of the conversation, because traceability evidence has to be gathered before the coffee ships. We confirm in writing exactly which documents we can issue for your destination before you commit.

## Samples

Samples are available before any order, with the cost of the sample and courier carried by the buyer. Tell us the grade and roast you are interested in and where the sample should go.

## How to start

Send us the grade, quantity, packaging and destination, and we will come back with a firm quote and the document list for your market. [Start an export enquiry](/enquire?sector=COFFEE&channel=export), or read more about [Vitorra Coffee](/products/coffee).
MD,
            ],
            [
                'slug'            => 'chitosan-hemostatic-wound-spray-explained',
                'title'           => 'Chitosan wound spray explained: how SEAL helps control bleeding, and where it fits in first aid',
                'excerpt'         => 'What a chitosan hemostatic spray is, how it helps blood clot, the three SEAL formats, and the limits every first-aid kit owner should understand.',
                'seo_title'       => 'Chitosan Hemostatic Wound Spray Explained | SEAL',
                'seo_description' => 'How chitosan hemostatic spray helps control bleeding: how it works, SEAL OTC, PRO and Pet formats, shelf life, storage, and what it does not replace.',
                'cover'           => '/products/seal/Picture1.jpg',
                'content'         => <<<'MD'
Serious bleeding is one of the few emergencies where the first few minutes, and whoever happens to be nearby, decide the outcome. That is why clinics, ambulance crews, factories, mines and transport operators look for first-aid tools that are fast and simple to use under pressure. This article explains one of them: the chitosan hemostatic spray.

## What "hemostatic" means

A hemostatic agent helps the body stop bleeding by speeding up clot formation at the wound. Gauze and pressure remain the foundation of bleeding control; a hemostatic agent is applied to the wound to help a stable clot form faster.

## Why chitosan

Chitosan is a natural material derived from chitin, found in the shells of crustaceans. It carries a positive charge, and red blood cells and platelets carry a negative one, so they are drawn to it and bind together. The result is a clot that forms quickly and holds.

SEAL uses a sterile, dry chitosan powder delivered as an aerosol spray, so it reaches irregular wounds and areas that are awkward to pack with gauze.

## The three formats

One formula comes in three formats, for different settings:

- **SEAL OTC (1.5 oz):** for everyday use at home, at work and when travelling.
- **SEAL PRO (2.5 oz):** a professional grade delivering around 80 PSI, for first responders and tactical teams dealing with moderate to severe bleeding.
- **HemoSEAL Pet (2.8 oz):** a sting-free formula for animal first aid that does not glue fur.

## Practical points for kit owners

- **Shelf life:** 36 months.
- **Storage:** room temperature, with no refrigeration needed, which matters for vehicle and site kits.
- **Durability:** tested to the MIL-STD-810H standard for heat, cold, altitude and humidity.
- **Removal:** the clot is removed with saline or clean water and sterile gauze by the treating clinician.

## The limits you should know

We would rather you hear these from us than learn them in an emergency:

- **It is not a replacement for a tourniquet.** Where a tourniquet is the right tool, use it. A spray is useful where one cannot be applied, such as the neck, groin or armpit.
- **It is single-patient use.** Once a can is activated, use it on one person. Several wounds on the same person are fine.
- **It does not replace professional care.** Apply pressure, call for help, and get the injured person to medical care.
- **Training matters.** Everyone who may use the kit should know where it is and how to use it before they need it.

## Regulatory status

SEAL is cleared by the US Food and Drug Administration under the 510(k) process, is made in the USA, and is used in emergency medical, military and tactical settings, including by agencies such as Maryland EMS. Approval requirements differ by country. For Uganda, we provide the full regulatory and compliance documentation on enquiry so your medical or procurement team can review it before purchase.

## Who it is for

Organisations where bleeding injuries are a foreseeable risk: hospitals and clinics, ambulance and first-responder services, factories, mines and quarries, construction sites, boda boda and transport associations, schools and sports clubs.

To discuss which format suits your setting, or to request the product and compliance documents, [send us an enquiry](/enquire?sector=SEAL) or read more about [SEAL Wound Spray](/products/seal-wound-spray).
MD,
            ],
        ];
    }
}
