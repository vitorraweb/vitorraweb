<?php

use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\EnquiryController;
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

// Forms — submit enquiry or contact message
Route::post('/enquiries', [EnquiryController::class, 'store']);
Route::post('/contact',   [ContactController::class, 'store']);

// Exchange rate placeholder (returns a fallback until a live FX endpoint is wired)
Route::get('/exchange-rate', fn () => response()->json([
    'data' => ['ugx_per_usd' => 3750],
]));

/*
|--------------------------------------------------------------------------
| Authenticated routes (Sanctum — added as auth work is built)
|--------------------------------------------------------------------------
*/
// Route::middleware('auth:sanctum')->group(function () {
//     Route::get('/account/orders',    [AccountController::class, 'orders']);
//     Route::get('/account/enquiries', [AccountController::class, 'enquiries']);
// });
