<?php

/*
|--------------------------------------------------------------------------
| Microsoft Teams
|--------------------------------------------------------------------------
| Everything here is server-side only. None of these values are ever sent to
| the browser — the Workflows webhook URL in particular is a secret (anyone
| holding it can post into the channel).
*/
return [

    // Domains whose addresses are Microsoft 365 accounts. A staff login on one
    // of these is their Teams address; anyone else needs microsoft_email set.
    'm365_domains' => array_values(array_filter(array_map('trim', explode(',', (string) env('MICROSOFT_365_DOMAINS', 'vitorra.org'))))),

    // Notifications: a Teams Workflows webhook ("Send webhook alerts to a
    // channel" template). Empty = notifications are off; nothing else breaks.
    'webhook_url'   => env('TEAMS_WORKFLOW_WEBHOOK_URL'),
    'timeout'       => (int) env('TEAMS_WEBHOOK_TIMEOUT', 10),     // seconds per attempt
    'max_attempts'  => (int) env('TEAMS_WEBHOOK_MAX_ATTEMPTS', 3),
    'backoff'       => [60, 300, 900],                            // seconds before attempts 2, 3, 4

    // Events that can post to Teams (each switched on/off in Settings).
    'events' => [
        'new_enquiry'      => 'New enquiry from the website',
        'new_message'      => 'New contact-form message',
        'new_order'        => 'New order or FET reservation',
        'executive_report' => 'Executive report sent',
    ],

    // Teams tab single sign-on (Microsoft Entra ID, single tenant).
    'entra' => [
        'tenant_id'  => env('ENTRA_TENANT_ID'),
        'client_id'  => env('ENTRA_CLIENT_ID'),
        // Defaults to api://<site host>/<client id>, the form Teams SSO requires.
        'app_id_uri' => env('ENTRA_APP_ID_URI'),
        'scope'      => env('ENTRA_SSO_SCOPE', 'access_as_user'),
    ],
];
