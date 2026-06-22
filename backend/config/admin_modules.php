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
        'fet'        => 'FET savings',
        'newsletter' => 'Newsletter',
        'tasks'      => 'Tasks',
        'people'     => 'People (HR)',
        'executive'  => 'Executive report',
        'suppliers'  => 'Suppliers',
        'accounting'         => 'Accounting',
        'accounting_approve' => 'Accounting — approve',
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
        'leadership' => ['dashboard', 'enquiries', 'customers', 'prospects', 'products', 'blog', 'media', 'messages', 'orders', 'fet', 'newsletter', 'tasks', 'people', 'executive', 'suppliers', 'accounting'],
        'operations' => ['dashboard', 'orders', 'fet', 'enquiries', 'messages', 'customers', 'tasks', 'people', 'suppliers'],
        'finance'    => ['dashboard', 'orders', 'customers', 'enquiries', 'tasks', 'people', 'executive', 'suppliers', 'accounting'],
        'marketing'  => ['dashboard', 'blog', 'media', 'prospects', 'enquiries', 'customers', 'newsletter', 'tasks'],
        'sales'      => ['dashboard', 'enquiries', 'prospects', 'customers', 'orders', 'fet', 'tasks'],
        'it'         => ['dashboard', 'media', 'tasks'],
    ],
];
