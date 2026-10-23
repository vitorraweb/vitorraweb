<?php

return [
    // How long a signing link works after it is sent. Sending again issues a
    // new link and cancels the old one.
    'link_hours' => (int) env('CONTRACT_LINK_HOURS', 48),

    // Times on the signed copy and in emails are shown in Kampala time.
    'timezone' => env('CONTRACT_TIMEZONE', 'Africa/Kampala'),
];
