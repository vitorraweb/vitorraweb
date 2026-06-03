<?php

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
| Authenticated routes (Sanctum — added as auth work is built)
|--------------------------------------------------------------------------
*/
// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/account/orders',    [AccountController::class, 'orders']);
//     Route::get('/account/enquiries', [AccountController::class, 'enquiries']);
// });
