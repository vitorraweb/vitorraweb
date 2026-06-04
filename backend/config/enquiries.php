<?php

/*
|--------------------------------------------------------------------------
| Enquiry routing
|--------------------------------------------------------------------------
| Maps each product to the team that owns its enquiries. On submission the
| enquiry is auto-assigned to that team (shown in the admin panel) and the
| notification email is sent to the team inbox.
|
| Per-team inboxes are optional: set the env vars when separate addresses
| exist, otherwise every enquiry falls back to MAIL_TEAM_ADDRESS — routing
| (the assigned team label) still works regardless.
*/

return [

    'routing' => [
        'FET'       => ['team' => 'Sales & Operations', 'email' => env('MAIL_FET_ADDRESS')],
        'SEAL'      => ['team' => 'Medical Sales',       'email' => env('MAIL_SEAL_ADDRESS')],
        'COFFEE'    => ['team' => 'Marketing',           'email' => env('MAIL_COFFEE_ADDRESS')],
        'LOGISTICS' => ['team' => 'Operations',          'email' => env('MAIL_LOGISTICS_ADDRESS')],
    ],

    // Used when no product category is chosen (general enquiry).
    'default_team' => 'General Enquiries',

];
