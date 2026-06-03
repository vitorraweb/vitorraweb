<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\EnquiryController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\ProductController;
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

// Live exchange rate (cached 1 hr; falls back to config if API key not set)
Route::get('/exchange-rate', [ExchangeRateController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Auth
|--------------------------------------------------------------------------
*/
Route::post('/auth/login',  [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    /*
    |----------------------------------------------------------------------
    | Admin routes (ops + admin roles only)
    |----------------------------------------------------------------------
    */
    Route::middleware('role:admin,ops')->prefix('admin')->group(function () {
        Route::get('/stats',                            [AdminController::class, 'stats']);
        Route::get('/enquiries',                        [AdminController::class, 'enquiries']);
        Route::patch('/enquiries/{enquiry}',            [AdminController::class, 'updateEnquiry']);
        Route::get('/messages',                         [AdminController::class, 'messages']);
        Route::patch('/messages/{message}/read',        [AdminController::class, 'markRead']);
        Route::get('/orders',                           [AdminController::class, 'orders']);
        Route::patch('/orders/{order}',                 [AdminController::class, 'updateOrder']);
    });
});
