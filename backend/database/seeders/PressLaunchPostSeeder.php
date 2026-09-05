<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

/**
 * The June 2026 Fuel Eco Tech launch press conference, as a published blog post.
 * Idempotent (updateOrCreate by slug), so it is safe to run repeatedly:
 *   php artisan db:seed --class=PressLaunchPostSeeder
 *
 * Facts/quotes are drawn from the Ugnews Line coverage of the launch. Photos are
 * served by the frontend from /public/press (committed to the repo).
 */
class PressLaunchPostSeeder extends Seeder
{
    public function run(): void
    {
        $author = User::where('role', 'admin')->first() ?? User::first();

        $slug = 'fuel-eco-tech-launches-in-uganda';

        $content = <<<'MD'
![The Vitorra team at the Fuel Eco Tech launch](/press/launch-team.jpg)

Vitorra Holdings Limited has officially introduced **Fuel Eco Tech (FET)** to the Ugandan market — a German-engineered fuel-optimisation system designed to cut fuel consumption and emissions across diesel and petrol engines, with no modification to the engine itself.

Announced at a press conference in Kampala, the launch comes as motorists and fleet operators look for relief from rising fuel costs.

## How it works

FET installs between the high-pressure fuel pump and the fuel filter, using nano-technology and magnetic fields to optimise combustion. Because more of the fuel is burned completely, vehicles use less of it — and leave less residue behind.

The system suits passenger cars, SUVs, commercial trucks, buses, and agricultural and construction machinery, and is especially effective on vehicles built in 2018 or earlier.

![Vitorra presenters at the launch](/press/launch-presenters.jpg)

## What it means for owners

> "As fuel prices continue to rise and environmental regulations become increasingly important, Fuel Eco Tec offers a practical and cost-effective solution for vehicle owners, fleet operators, transport companies, schools, logistics firms, agricultural businesses and government institutions."
>
> — Thurayya Nakayima, Head of Marketing, Vitorra Holdings

Mechanic and content creator Moses Kiboneka, who has tested the device, added:

> "This means vehicle owners not only save money on fuel but can also benefit from lower maintenance costs because more fuel is completely burned, leaving very little residue behind."

![The Fuel Eco Tech device demonstrated on screen](/press/launch-device.jpg)

## Pricing and payback

FET is priced from **€366 to €1,098** depending on the vehicle, with an estimated payback of around **14 months** through fuel savings alone. The technology carries ISO 9001:2015, ISO/IEC 27001 and ISO 14001:2015 certifications and is backed by Zurich liability insurance.

To find out which device fits your vehicles, [request a free fuel savings assessment](/enquire?sector=FET).
MD;

        $swContent = <<<'MD'
![Timu ya Vitorra kwenye uzinduzi wa Fuel Eco Tech](/press/launch-team.jpg)

Vitorra Holdings Limited imezindua rasmi **Fuel Eco Tech (FET)** kwenye soko la Uganda — mfumo wa kuboresha mafuta uliotengenezwa Ujerumani, ulioundwa kupunguza matumizi ya mafuta na hewa chafu kwa injini za dizeli na petroli, bila marekebisho yoyote ya injini.

Ukitangazwa kwenye mkutano na waandishi wa habari mjini Kampala, uzinduzi huu unakuja wakati wamiliki wa magari na waendeshaji wa makundi ya magari wakitafuta nafuu kutokana na kupanda kwa bei za mafuta.

## Jinsi inavyofanya kazi

FET inawekwa kati ya pampu ya mafuta ya shinikizo la juu na chujio la mafuta, ikitumia teknolojia ya nano na uga wa sumaku kuboresha mwako. Kwa sababu mafuta mengi zaidi yanawaka kikamilifu, magari hutumia kidogo — na kuacha mabaki machache zaidi.

Mfumo unafaa kwa magari ya abiria, SUV, malori ya kibiashara, mabasi, na mitambo ya kilimo na ujenzi, na unafaa zaidi kwa magari yaliyotengenezwa mwaka 2018 au kabla.

![Wawasilishaji wa Vitorra kwenye uzinduzi](/press/launch-presenters.jpg)

## Maana yake kwa wamiliki

> "Wakati bei za mafuta zikiendelea kupanda na kanuni za mazingira zikizidi kuwa muhimu, Fuel Eco Tec inatoa suluhisho la vitendo na lenye gharama nafuu kwa wamiliki wa magari, waendeshaji wa makundi ya magari, kampuni za usafiri, shule, kampuni za usafirishaji, biashara za kilimo na taasisi za serikali."
>
> — Thurayya Nakayima, Mkuu wa Masoko, Vitorra Holdings

Fundi na mtengenezaji wa maudhui Moses Kiboneka, ambaye amejaribu kifaa hicho, aliongeza:

> "Hii inamaanisha wamiliki wa magari hawaokoi tu pesa za mafuta bali pia wanaweza kunufaika na gharama ndogo za matengenezo kwa sababu mafuta mengi zaidi yanawaka kikamilifu, yakiacha mabaki machache sana."

![Kifaa cha Fuel Eco Tech kikionyeshwa kwenye skrini](/press/launch-device.jpg)

## Bei na marejesho

FET ina bei kuanzia **€366 hadi €1,098** kulingana na gari, ikiwa na makadirio ya marejesho ya takriban **miezi 14** kupitia uokoaji wa mafuta pekee. Teknolojia hii ina vyeti vya ISO 9001:2015, ISO/IEC 27001 na ISO 14001:2015 na inaungwa mkono na bima ya dhima ya Zurich.

Kujua ni kifaa kipi kinachofaa magari yako, [omba tathmini ya bure ya uokoaji wa mafuta](/enquire?sector=FET).
MD;

        $post = BlogPost::updateOrCreate(
            ['slug' => $slug],
            [
                'user_id'         => $author?->id,
                'title'           => 'Fuel Eco Tech officially launches in Uganda',
                'excerpt'         => 'Vitorra Holdings has introduced Fuel Eco Tech — a German-engineered fuel-saving system — to the Ugandan market, helping motorists and fleets cut fuel costs with no engine modification.',
                'content'         => $content,
                'cover_image'     => '/press/launch-team.jpg',
                'status'          => 'published',
                'published_at'    => Carbon::parse('2026-06-06 10:00:00'),
                'seo_title'       => 'Fuel Eco Tech Launches in Uganda — Vitorra Holdings',
                'seo_description' => 'Vitorra Holdings launches the German-engineered Fuel Eco Tech fuel-saving system in Uganda: how it works, pricing from €366, ~14-month payback, and what the press said.',
            ]
        );

        $post->translations()->updateOrCreate(
            ['locale' => 'sw'],
            [
                'title'           => 'Fuel Eco Tech yazinduliwa rasmi nchini Uganda',
                'excerpt'         => 'Vitorra Holdings imeletea soko la Uganda Fuel Eco Tech — mfumo wa kuokoa mafuta uliotengenezwa Ujerumani — ikisaidia wamiliki wa magari na makundi ya magari kupunguza gharama za mafuta bila marekebisho ya injini.',
                'content'         => $swContent,
                'seo_title'       => 'Fuel Eco Tech Yazinduliwa Nchini Uganda — Vitorra Holdings',
                'seo_description' => 'Vitorra Holdings yazindua mfumo wa kuokoa mafuta wa Fuel Eco Tech nchini Uganda: jinsi unavyofanya kazi, bei kuanzia €366, marejesho ya takriban miezi 14, na vyombo vya habari vilivyosema nini.',
            ]
        );

        $this->command?->info("Seeded blog post: {$slug} (+ sw translation)");
    }
}
