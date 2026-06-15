<?php

return [
    // Active stages get flagged "stale" if last_activity is older than this
    // many days. Stages not listed (won, fulfilled, lost) are never stale.
    'stale_days' => [
        'lead'      => 5,
        'contacted' => 4,
        'qualified' => 5,
        'quoted'    => 7,
    ],

    // When a contact's pipeline_stage is moved to one of these stages (and it
    // has an owner), auto-create a follow-up Task for that owner if one
    // doesn't already exist for this contact.
    'auto_followup' => [
        'stages'      => ['quoted'],
        'due_in_days' => 3,
    ],
];
