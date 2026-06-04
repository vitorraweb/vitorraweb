<?php

namespace App\Providers;

use App\Contracts\PaymentGateway;
use App\Services\Payments\ManualGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Resolve the active payment gateway from config. Add real providers
        // (Flutterwave / PayPal / Stripe) as new match arms once accounts exist.
        $this->app->singleton(PaymentGateway::class, function () {
            return match (config('payments.driver')) {
                // 'flutterwave' => new \App\Services\Payments\FlutterwaveGateway(config('services.flutterwave')),
                // 'paypal'      => new \App\Services\Payments\PaypalGateway(config('services.paypal')),
                default => new ManualGateway(),
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
