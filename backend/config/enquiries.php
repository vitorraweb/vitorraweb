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

    /*
    |----------------------------------------------------------------------
    | Response-time SLA
    |----------------------------------------------------------------------
    | An enquiry left sitting in "new" gets chased, then escalated. Raised
    | after a 9 July enquiry went unanswered until the CEO found it.
    |
    | Thresholds are plain elapsed hours, not "working hours" — a working-hours
    | calculator that quietly disagrees with the leave module's holiday
    | calendar would be worse than no rule at all. Instead the command only
    | RUNS inside the window below, so an enquiry arriving on Friday evening is
    | chased first thing Monday rather than at 2am.
    */
    'sla' => [
        // Hours before the owning team is told an enquiry is still unanswered.
        'chase_hours' => (int) env('ENQUIRY_SLA_CHASE_HOURS', 4),

        // Hours before it is escalated to the addresses below.
        'escalate_hours' => (int) env('ENQUIRY_SLA_ESCALATE_HOURS', 24),

        // Who hears about an escalation, on top of the owning team's inbox.
        // Comma-separated. Empty means the team inbox only.
        'escalate_to' => array_values(array_filter(array_map(
            'trim',
            explode(',', (string) env('ENQUIRY_SLA_ESCALATE_TO', ''))
        ))),

        // Local hours (24h) the chaser is allowed to send in, and the weekdays
        // it runs on (1 = Monday … 7 = Sunday).
        'window_start' => (int) env('ENQUIRY_SLA_WINDOW_START', 8),
        'window_end'   => (int) env('ENQUIRY_SLA_WINDOW_END', 18),
        'weekdays'     => [1, 2, 3, 4, 5],
    ],


];
