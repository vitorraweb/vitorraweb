<?php

/*
| Blog autopilot — `php artisan blog:draft` researches this week's news on one
| of Vitorra's sectors and writes a DRAFT post for Marketing to check. Nothing
| is published without a person pressing Publish (email link or console).
|
| Runs Monday + Thursday (routes/console.php). Needs ANTHROPIC_API_KEY; without
| it the command logs and does nothing.
*/

return [
    'enabled' => env('BLOG_AUTOPILOT_ENABLED', true),

    'model' => env('BLOG_AUTOPILOT_MODEL', 'claude-opus-5-5'),

    // FET is the priority revenue product, so it comes round every other draft.
    'rotation' => ['fet', 'coffee', 'fet', 'logistics', 'fet', 'seal'],

    // Days a review link in the email stays valid.
    'link_days' => 14,

    'topics' => [
        'fet' => [
            'label'  => 'Fuel and fleet costs',
            'brief'  => 'diesel and petrol pump prices in Uganda and East Africa, fuel import and tax changes, transport and fleet operating costs, fuel efficiency, vehicle emissions rules, and anything that changes what Ugandan fleet owners pay to keep vehicles moving',
            'covers' => ['/products/fet/field-truck.jpg', '/images/stock/highway-sunset.jpg', '/images/stock/road-mountains.jpg', '/images/stock/engine-hands.jpg', '/images/stock/hills-road.jpg'],
        ],
        'coffee' => [
            'label'  => 'Ugandan coffee markets',
            'brief'  => 'Uganda coffee exports and earnings, Arabica and Robusta world prices, harvest and weather news, buyer requirements such as the EU deforestation regulation, and anything an international buyer of Ugandan coffee should know',
            'covers' => ['/images/stock/coffee-valley.jpg', '/images/stock/coffee-cherries.jpg', '/images/stock/coffee-hands.jpg', '/images/stock/coffee-roaster.jpg'],
        ],
        'logistics' => [
            'label'  => 'Freight and trade routes',
            'brief'  => 'East African freight and logistics: the Northern and Central corridors, Mombasa and Dar es Salaam ports, border and customs changes, shipping and air-freight rates, and regional trade rules affecting Ugandan importers and exporters',
            'covers' => ['/images/stock/port-aerial.jpg', '/images/stock/ship-wake.jpg', '/images/stock/ship-aerial.jpg', '/images/stock/warehouse-dark.jpg'],
        ],
        'seal' => [
            'label'  => 'First aid and emergency care',
            'brief'  => 'road safety and trauma in Uganda and East Africa, emergency medical services, first-aid training, workplace safety rules, and bleeding-control practice for first responders',
            'covers' => ['/images/stock/ambulance-motion.jpg', '/images/stock/trauma-kit-open.jpg'],
        ],
    ],
];
