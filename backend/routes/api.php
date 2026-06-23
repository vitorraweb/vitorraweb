<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AccountingController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuditController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\BlogAdminController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\CareersController;
use App\Http\Controllers\Api\CompanyEventController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\FetInstallationController;
use App\Http\Controllers\Api\HolidayController;
use App\Http\Controllers\Api\InstallmentController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\JobAdminController;
use App\Http\Controllers\Api\LeaveController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\ExecutiveController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\MonthlyReportController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductAdminController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProspectController;
use App\Http\Controllers\Api\ReplyTemplateController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\SupplierAdminController;
use App\Http\Controllers\Api\SupplierBillController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\UserAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Vitorra API — public routes (no auth required)
|--------------------------------------------------------------------------
*/

// Products (public catalogue)
Route::get('/products',          [ProductController::class, 'index']);
Route::get('/products/{slug}',   [ProductController::class, 'show']);
Route::get('/coffee/products',   [ProductController::class, 'coffee']);

// Blog
Route::get('/blog/posts',         [BlogController::class, 'index']);
Route::get('/blog/posts/{slug}',  [BlogController::class, 'show']);

// Forms — submit enquiry or contact message
Route::post('/enquiries', [EnquiryController::class, 'store']);
Route::post('/contact',   [ContactController::class, 'store']);

// Careers — public job listings + two-step application (CV upload + AI prefill).
// The upload/apply endpoints are throttled (they hit a paid AI API + write files).
Route::get('/careers/openings',        [CareersController::class, 'index']);
Route::get('/careers/openings/{slug}', [CareersController::class, 'show']);
Route::middleware('throttle:15,1')->group(function () {
    Route::post('/careers/extract', [CareersController::class, 'extractCv']);
    Route::post('/careers/apply',   [CareersController::class, 'apply']);
    // Supplier self-onboarding (public, throttled — accepts file uploads).
    Route::post('/suppliers/onboard', [SupplierController::class, 'onboard']);
});

// Newsletter — public signup + token-based unsubscribe (GDPR)
Route::post('/newsletter/subscribe',   [NewsletterController::class, 'subscribe']);
Route::post('/newsletter/unsubscribe', [NewsletterController::class, 'unsubscribe']);

// Orders — guest checkout + confirmation lookup by reference
Route::post('/orders',                 [OrderController::class, 'store']);
Route::post('/orders/reserve',         [OrderController::class, 'reserve']);
Route::get('/orders/{reference}',      [OrderController::class, 'show']);

// Payments — initiate payment for an order + provider webhooks (gateway-agnostic)
Route::post('/orders/{reference}/pay',           [PaymentController::class, 'pay']);
Route::get('/orders/{reference}/payment-status', [PaymentController::class, 'status']);
Route::post('/payments/webhook/{provider}',      [PaymentController::class, 'webhook']);

// Live exchange rate (cached 1 hr; falls back to config if API key not set)
Route::get('/exchange-rate', [ExchangeRateController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
// Throttled to blunt password-guessing / credential-stuffing (per IP).
Route::middleware('throttle:8,1')->group(function () {
    Route::post('/auth/login',    [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout',   [AuthController::class, 'logout']);
    Route::get('/auth/me',        [AuthController::class, 'me']);
    Route::post('/auth/password', [AuthController::class, 'changePassword']);

    // Self-service app-based two-factor (enrol / confirm / disable).
    Route::post('/auth/2fa/setup',   [TwoFactorController::class, 'setup']);
    Route::post('/auth/2fa/confirm', [TwoFactorController::class, 'confirm']);
    Route::post('/auth/2fa/disable', [TwoFactorController::class, 'disable']);

    // Active sessions (signed-in devices) — list + revoke.
    Route::get('/auth/sessions',                  [AuthController::class, 'sessions']);
    Route::delete('/auth/sessions/{id}',          [AuthController::class, 'revokeSession']);
    Route::post('/auth/sessions/revoke-others',   [AuthController::class, 'revokeOtherSessions']);

    /*
    |----------------------------------------------------------------------
    | Customer self-service portal (any authenticated user)
    |----------------------------------------------------------------------
    */
    Route::middleware('ability:customer')->prefix('account')->group(function () {
        Route::get('/orders',                          [AccountController::class, 'orders']);
        Route::get('/orders/{reference}',              [AccountController::class, 'order']);
        Route::patch('/orders/{reference}/installation', [AccountController::class, 'updateInstallation']);
        Route::get('/enquiries',                       [AccountController::class, 'enquiries']);
        // FET proven-savings: see your installations, log fill-ups, get a certificate.
        Route::get('/fet',                             [AccountController::class, 'fetInstallations']);
        Route::get('/fet/{reference}',                 [AccountController::class, 'fetInstallation']);
        Route::post('/fet/{reference}/logs',           [AccountController::class, 'fetLog']);
        Route::get('/fet/{reference}/certificate',     [AccountController::class, 'fetCertificate']);
        Route::get('/documents',                       [AccountController::class, 'documents']);
        Route::get('/profile',                         [AccountController::class, 'profile']);
        Route::put('/profile',                         [AccountController::class, 'updateProfile']);
    });

    /*
    |----------------------------------------------------------------------
    | Staff self-service portal (all team members: admin, ops, employee)
    |----------------------------------------------------------------------
    */
    Route::middleware(['role:admin,ops,employee', 'ability:staff'])->prefix('staff')->group(function () {
        Route::get('/me',                      [StaffController::class, 'me']);
        Route::get('/team',                    [StaffController::class, 'team']);
        Route::get('/documents',               [StaffController::class, 'documents']);
        Route::get('/documents/{document}/download', [StaffController::class, 'download']);

        // Leave — apply, track, and (for supervisors/HR) review.
        Route::get('/leave',                       [LeaveController::class, 'index']);
        Route::get('/leave/preview',               [LeaveController::class, 'preview']);
        Route::get('/leave/pending',               [LeaveController::class, 'pending']);
        Route::post('/leave',                      [LeaveController::class, 'store']);
        Route::post('/leave/{leave}/cancel',       [LeaveController::class, 'cancel']);
        Route::post('/leave/{leave}/decision',     [LeaveController::class, 'decision']);
        Route::get('/leave/{leave}/note',          [LeaveController::class, 'downloadNote']);
        Route::get('/holidays',                    [LeaveController::class, 'holidays']);

        // Monthly work reports — author your own; review your team's.
        Route::get('/reports',                     [MonthlyReportController::class, 'index']);
        Route::get('/reports/team',                [MonthlyReportController::class, 'team']);
        Route::post('/reports',                    [MonthlyReportController::class, 'upsert']);
        Route::post('/reports/{report}/review',    [MonthlyReportController::class, 'review']);
    });

    /*
    |----------------------------------------------------------------------
    | Admin routes (ops + admin roles only)
    |----------------------------------------------------------------------
    */
    Route::middleware(['role:admin,ops', 'ability:admin'])->prefix('admin')->group(function () {
        // Dashboard — every staff member sees this.
        Route::get('/stats',                            [AdminController::class, 'stats']);
        Route::get('/analytics',                        [AdminController::class, 'analytics']);
        Route::get('/alerts',                           [AdminController::class, 'alerts']);

        // Operational modules — each gated by the staff member's permissions.
        Route::middleware('perm:enquiries')->group(function () {
            Route::get('/enquiries',                    [AdminController::class, 'enquiries']);
            Route::get('/enquiries/export',             [AdminController::class, 'exportEnquiries']);
            Route::patch('/enquiries/{enquiry}',        [AdminController::class, 'updateEnquiry']);
            Route::post('/enquiries/{enquiry}/convert', [AdminController::class, 'convertEnquiryToOrder']);
        });
        Route::middleware('perm:messages')->group(function () {
            Route::get('/messages',                     [AdminController::class, 'messages']);
            Route::patch('/messages/{message}/read',    [AdminController::class, 'markRead']);
        });
        Route::middleware('perm:orders')->group(function () {
            Route::get('/orders',                       [AdminController::class, 'orders']);
            Route::patch('/orders/{order}',             [AdminController::class, 'updateOrder']);
            // B2B installments — pay-in-parts plans recorded against an order.
            Route::get('/orders/{order}/installments',    [InstallmentController::class, 'show']);
            Route::post('/orders/{order}/installments',   [InstallmentController::class, 'store']);
            Route::delete('/orders/{order}/installments', [InstallmentController::class, 'destroy']);
            Route::post('/installments/{installment}/pay',   [InstallmentController::class, 'pay']);
            Route::post('/installments/{installment}/unpay', [InstallmentController::class, 'unpay']);
        });
        // FET proven-savings — installations + fuel logs + measured savings.
        Route::middleware('perm:fet')->group(function () {
            Route::get('/fet',                              [FetInstallationController::class, 'index']);
            Route::post('/fet',                             [FetInstallationController::class, 'store']);
            Route::get('/fet/{installation}',               [FetInstallationController::class, 'show']);
            Route::match(['put', 'patch'], '/fet/{installation}', [FetInstallationController::class, 'update']);
            Route::delete('/fet/{installation}',            [FetInstallationController::class, 'destroy']);
            Route::get('/fet/{installation}/certificate',   [FetInstallationController::class, 'certificate']);
            Route::post('/fet/{installation}/logs',         [FetInstallationController::class, 'storeLog']);
            Route::delete('/fet/{installation}/logs/{log}', [FetInstallationController::class, 'destroyLog']);
        });
        Route::middleware('perm:prospects')->group(function () {
            Route::get('/prospects',                        [ProspectController::class, 'index']);
            Route::get('/prospects/export',                 [ProspectController::class, 'export']);
            Route::post('/prospects/bulk-email',            [ProspectController::class, 'bulkEmail']);
            Route::post('/prospects/import',                [ProspectController::class, 'import']);
            Route::post('/prospects/{prospect}/convert',    [ProspectController::class, 'convert']);
            Route::patch('/prospects/{prospect}',           [ProspectController::class, 'update']);
        });
        Route::middleware('perm:products')->group(function () {
            Route::get('/products',                     [ProductAdminController::class, 'index']);
            Route::post('/products',                    [ProductAdminController::class, 'store']);
            Route::get('/products/{product}',           [ProductAdminController::class, 'show']);
            Route::match(['put', 'patch'], '/products/{product}', [ProductAdminController::class, 'update']);
            Route::delete('/products/{product}',        [ProductAdminController::class, 'destroy']);
        });
        Route::middleware('perm:customers')->group(function () {
            Route::get('/customers',                    [CustomerController::class, 'index']);
            Route::get('/customers/export',             [CustomerController::class, 'export']);
            Route::get('/customers/detail',             [CustomerController::class, 'detail']);
            Route::put('/customers/note',               [CustomerController::class, 'saveNote']);
            Route::put('/customers/info',               [CustomerController::class, 'updateInfo']);
            Route::put('/customers/tags',               [CustomerController::class, 'updateTags']);
            Route::put('/customers/pipeline',           [CustomerController::class, 'updatePipeline']);
            Route::post('/communications',              [CustomerController::class, 'sendReply']);
            // Reply templates
            Route::get('/templates',                    [ReplyTemplateController::class, 'index']);
            Route::post('/templates',                   [ReplyTemplateController::class, 'store']);
            Route::match(['put','patch'], '/templates/{template}', [ReplyTemplateController::class, 'update']);
            Route::delete('/templates/{template}',      [ReplyTemplateController::class, 'destroy']);
        });
        Route::middleware('perm:media')->group(function () {
            Route::get('/media',                        [MediaController::class, 'index']);
            Route::post('/media',                       [MediaController::class, 'store']);
            Route::delete('/media/{media}',             [MediaController::class, 'destroy']);
        });
        Route::middleware('perm:newsletter')->group(function () {
            Route::get('/newsletter/subscribers',        [NewsletterController::class, 'index']);
            Route::post('/newsletter/broadcast',         [NewsletterController::class, 'broadcast']);
            Route::get('/newsletter/broadcasts',         [NewsletterController::class, 'broadcasts']);
        });
        Route::middleware('perm:tasks')->group(function () {
            Route::get('/tasks',                        [TaskController::class, 'index']);
            Route::get('/tasks/stats',                  [TaskController::class, 'stats']);
            Route::post('/tasks',                       [TaskController::class, 'store']);
            Route::match(['put', 'patch'], '/tasks/{task}', [TaskController::class, 'update']);
            Route::delete('/tasks/{task}',              [TaskController::class, 'destroy']);
        });
        Route::middleware('perm:blog')->group(function () {
            Route::get('/blog/posts',                   [BlogAdminController::class, 'index']);
            Route::post('/blog/posts',                  [BlogAdminController::class, 'store']);
            Route::get('/blog/posts/{post}',            [BlogAdminController::class, 'show']);
            Route::match(['put', 'patch'], '/blog/posts/{post}', [BlogAdminController::class, 'update']);
            Route::delete('/blog/posts/{post}',         [BlogAdminController::class, 'destroy']);
        });
        // People / HR — leave overview & review, public holidays, company events.
        Route::middleware('perm:people')->group(function () {
            Route::get('/leave',                    [LeaveController::class, 'all']);
            Route::post('/leave/{leave}/decision',  [LeaveController::class, 'decision']);
            Route::get('/leave/{leave}/note',       [LeaveController::class, 'downloadNote']);
            Route::get('/holidays',                 [HolidayController::class, 'index']);
            Route::post('/holidays',                [HolidayController::class, 'store']);
            Route::match(['put', 'patch'], '/holidays/{holiday}', [HolidayController::class, 'update']);
            Route::delete('/holidays/{holiday}',    [HolidayController::class, 'destroy']);
            Route::get('/events',                   [CompanyEventController::class, 'index']);
            Route::post('/events',                  [CompanyEventController::class, 'store']);
            Route::match(['put', 'patch'], '/events/{event}', [CompanyEventController::class, 'update']);
            Route::delete('/events/{event}',        [CompanyEventController::class, 'destroy']);
            Route::get('/probation',                [MonthlyReportController::class, 'probation']);
            // Recruitment — job openings + applicants.
            Route::get('/job-openings',             [JobAdminController::class, 'openings']);
            Route::post('/job-openings',            [JobAdminController::class, 'storeOpening']);
            Route::match(['put', 'patch'], '/job-openings/{opening}', [JobAdminController::class, 'updateOpening']);
            Route::delete('/job-openings/{opening}', [JobAdminController::class, 'destroyOpening']);
            Route::get('/applications',             [JobAdminController::class, 'applications']);
            Route::patch('/applications/{application}', [JobAdminController::class, 'updateApplication']);
            Route::get('/applications/{application}/cv', [JobAdminController::class, 'downloadCv']);
        });
        // Executive report — CEO business summary (leadership/finance/admin).
        Route::middleware('perm:executive')->group(function () {
            Route::get('/executive/summary', [ExecutiveController::class, 'summary']);
        });
        // Suppliers — onboarding review & approval (operations/finance/leadership).
        Route::middleware('perm:suppliers')->group(function () {
            Route::get('/suppliers',                       [SupplierAdminController::class, 'index']);
            Route::get('/suppliers/{supplier}',            [SupplierAdminController::class, 'show']);
            Route::patch('/suppliers/{supplier}/status',   [SupplierAdminController::class, 'updateStatus']);
            Route::post('/suppliers/{supplier}/assign',    [SupplierAdminController::class, 'assignApprover']);
            Route::get('/supplier-documents/{document}/download', [SupplierAdminController::class, 'downloadDocument']);
        });
        // Accounting — money ledger (junior records, senior approves).
        Route::middleware('perm:accounting')->prefix('accounting')->group(function () {
            Route::get('/accounts',                       [AccountingController::class, 'accounts']);
            Route::get('/categories',                     [AccountingController::class, 'categories']);
            Route::get('/transactions',                   [AccountingController::class, 'transactions']);
            Route::post('/transactions',                  [AccountingController::class, 'storeTransaction']);
            Route::get('/transactions/{transaction}/receipt', [AccountingController::class, 'downloadReceipt']);
            Route::get('/bills',                          [SupplierBillController::class, 'index']);
            Route::post('/bills',                         [SupplierBillController::class, 'store']);
            Route::post('/bills/{bill}/pay',              [SupplierBillController::class, 'pay']);
            Route::get('/budgets',                        [BudgetController::class, 'index']);
            Route::get('/reports',                        [AccountingController::class, 'reports']);
            Route::get('/vat-report',                     [AccountingController::class, 'vatReport']);
            Route::get('/transactions/export',            [AccountingController::class, 'exportTransactions']);
            Route::post('/extract-receipt',               [AccountingController::class, 'extractReceipt']);
            Route::get('/recurring',                      [AccountingController::class, 'recurring']);
            // Invoices (accounts receivable).
            Route::get('/invoices',                       [InvoiceController::class, 'index']);
            Route::get('/invoices/{invoice}',             [InvoiceController::class, 'show']);
            Route::post('/invoices',                      [InvoiceController::class, 'store']);
            Route::match(['put', 'patch'], '/invoices/{invoice}', [InvoiceController::class, 'update']);
            Route::post('/invoices/{invoice}/send',       [InvoiceController::class, 'send']);
            Route::post('/invoices/{invoice}/payment',    [InvoiceController::class, 'recordPayment']);
            Route::get('/invoices/{invoice}/pdf',         [InvoiceController::class, 'pdf']);
        });
        // Senior-finance-only actions (approval, account/category/budget management).
        Route::middleware('perm:accounting_approve')->prefix('accounting')->group(function () {
            Route::post('/accounts',                      [AccountingController::class, 'storeAccount']);
            Route::patch('/accounts/{account}',           [AccountingController::class, 'updateAccount']);
            Route::post('/categories',                    [AccountingController::class, 'storeCategory']);
            Route::patch('/categories/{category}',        [AccountingController::class, 'updateCategory']);
            Route::post('/transactions/{transaction}/approve', [AccountingController::class, 'approveTransaction']);
            Route::post('/transactions/{transaction}/void',    [AccountingController::class, 'voidTransaction']);
            Route::post('/bills/{bill}/void',             [SupplierBillController::class, 'void']);
            Route::post('/invoices/{invoice}/void',       [InvoiceController::class, 'void']);
            Route::put('/budgets',                        [BudgetController::class, 'upsert']);
            Route::delete('/budgets/{budget}',            [BudgetController::class, 'destroy']);
            Route::post('/recurring',                     [AccountingController::class, 'storeRecurring']);
            Route::patch('/recurring/{recurring}',        [AccountingController::class, 'updateRecurring']);
            Route::delete('/recurring/{recurring}',       [AccountingController::class, 'destroyRecurring']);
        });

        // System settings + staff management — admin role only (not ops), per the BRD.
        Route::middleware('role:admin')->group(function () {
            Route::get('/settings',  [SettingsController::class, 'index']);
            Route::put('/settings',  [SettingsController::class, 'update']);
            // Audit trail (read-only) — sensitive-action history.
            Route::get('/audit',     [AuditController::class, 'index']);
            Route::get('/users',                       [UserAdminController::class, 'index']);
            Route::post('/users',                      [UserAdminController::class, 'store']);
            Route::patch('/users/{user}',              [UserAdminController::class, 'update']);
            Route::post('/users/{user}/password',      [UserAdminController::class, 'resetPassword']);
            Route::delete('/users/{user}',             [UserAdminController::class, 'destroy']);
            // Private HR documents (employment contract, ID, certificates)
            Route::get('/users/{user}/documents',          [UserAdminController::class, 'documents']);
            Route::post('/users/{user}/documents',         [UserAdminController::class, 'uploadDocument']);
            Route::delete('/staff-documents/{document}',   [UserAdminController::class, 'deleteDocument']);
        });
    });
});
