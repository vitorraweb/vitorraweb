<?php

/*
|--------------------------------------------------------------------------
| Admin modules & department access
|--------------------------------------------------------------------------
| Each "module" maps to one operational admin screen. A staff member's
| access is the set of modules they can use. It is resolved (see
| App\Models\User::effectivePermissions) as:
|   - admin role          -> every module
|   - explicit permissions -> that exact list (per-person override)
|   - otherwise           -> the default list for their department
| "dashboard" is always granted. Management screens (staff, settings) are
| gated by the admin role, not by these module permissions.
*/

return [

    // module key => human label
    'modules' => [
        'dashboard'  => 'Dashboard',
        'enquiries'  => 'Enquiries',
        'customers'  => 'Customers',
        'prospects'  => 'Prospects',
        'products'   => 'Products',
        'blog'       => 'Blog',
        'media'      => 'Media',
        'messages'   => 'Messages',
        'orders'     => 'Orders',
        'newsletter' => 'Newsletter',
        'tasks'      => 'Tasks',
    ],

    // department key => human label
    'department_labels' => [
        'leadership' => 'Leadership',
        'operations' => 'Operations',
        'finance'    => 'Finance',
        'marketing'  => 'Marketing',
        'sales'      => 'Sales',
        'it'         => 'IT',
    ],

    // department key => default modules (editable per-person via the override)
    'departments' => [
        'leadership' => ['dashboard', 'enquiries', 'customers', 'prospects', 'products', 'blog', 'media', 'messages', 'orders', 'newsletter', 'tasks'],
        'operations' => ['dashboard', 'orders', 'enquiries', 'messages', 'customers', 'tasks'],
        'finance'    => ['dashboard', 'orders', 'customers', 'enquiries', 'tasks'],
        'marketing'  => ['dashboard', 'blog', 'media', 'prospects', 'enquiries', 'customers', 'newsletter', 'tasks'],
        'sales'      => ['dashboard', 'enquiries', 'prospects', 'customers', 'orders', 'tasks'],
        'it'         => ['dashboard', 'media', 'tasks'],
    ],
];
