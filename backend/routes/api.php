<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogAdminController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\NewsletterController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductAdminController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProspectController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TaskController;
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

// Newsletter — public signup + token-based unsubscribe (GDPR)
Route::post('/newsletter/subscribe',   [NewsletterController::class, 'subscribe']);
Route::post('/newsletter/unsubscribe', [NewsletterController::class, 'unsubscribe']);

// Orders — guest checkout + confirmation lookup by reference
Route::post('/orders',                 [OrderController::class, 'store']);
Route::post('/orders/reserve',         [OrderController::class, 'reserve']);
Route::get('/orders/{reference}',      [OrderController::class, 'show']);

// Payments — initiate payment for an order + provider webhooks (gateway-agnostic)
Route::post('/orders/{reference}/pay', [PaymentController::class, 'pay']);
Route::post('/payments/webhook/{provider}', [PaymentController::class, 'webhook']);

// Live exchange rate (cached 1 hr; falls back to config if API key not set)
Route::get('/exchange-rate', [ExchangeRateController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::post('/auth/login',    [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | Customer self-service portal (any authenticated user)
    |----------------------------------------------------------------------
    */
    Route::prefix('account')->group(function () {
        Route::get('/orders',                          [AccountController::class, 'orders']);
        Route::get('/orders/{reference}',              [AccountController::class, 'order']);
        Route::patch('/orders/{reference}/installation', [AccountController::class, 'updateInstallation']);
        Route::get('/enquiries',                       [AccountController::class, 'enquiries']);
        Route::get('/documents',                       [AccountController::class, 'documents']);
        Route::get('/profile',                         [AccountController::class, 'profile']);
        Route::put('/profile',                         [AccountController::class, 'updateProfile']);
    });

    /*
    |----------------------------------------------------------------------
    | Admin routes (ops + admin roles only)
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin,ops')->prefix('admin')->group(function () {
        // Dashboard — every staff member sees this.
        Route::get('/stats',                            [AdminController::class, 'stats']);
        Route::get('/analytics',                        [AdminController::class, 'analytics']);

        // Operational modules — each gated by the staff member's permissions.
        Route::middleware('perm:enquiries')->group(function () {
            Route::get('/enquiries',                    [AdminController::class, 'enquiries']);
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
        });
        Route::middleware('perm:prospects')->group(function () {
            Route::get('/prospects',                    [ProspectController::class, 'index']);
            Route::patch('/prospects/{prospect}',       [ProspectController::class, 'update']);
            Route::post('/prospects/import',            [ProspectController::class, 'import']);
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
            Route::get('/customers/detail',             [CustomerController::class, 'detail']);
            Route::put('/customers/note',               [CustomerController::class, 'saveNote']);
        });
        Route::middleware('perm:media')->group(function () {
            Route::get('/media',                        [MediaController::class, 'index']);
            Route::post('/media',                       [MediaController::class, 'store']);
            Route::delete('/media/{media}',             [MediaController::class, 'destroy']);
        });
        Route::middleware('perm:newsletter')->group(function () {
            Route::get('/newsletter/subscribers',       [NewsletterController::class, 'index']);
        });
        Route::middleware('perm:tasks')->group(function () {
            Route::get('/tasks',                        [TaskController::class, 'index']);
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

        // System settings + staff management — admin role only (not ops), per the BRD.
        Route::middleware('role:admin')->group(function () {
            Route::get('/settings',  [SettingsController::class, 'index']);
            Route::put('/settings',  [SettingsController::class, 'update']);
            Route::get('/users',                       [UserAdminController::class, 'index']);
            Route::post('/users',                      [UserAdminController::class, 'store']);
            Route::patch('/users/{user}',              [UserAdminController::class, 'update']);
            Route::post('/users/{user}/password',      [UserAdminController::class, 'resetPassword']);
            Route::delete('/users/{user}',             [UserAdminController::class, 'destroy']);
        });
    });
});
