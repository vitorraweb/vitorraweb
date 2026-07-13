<?php

namespace App\Providers;

use App\Contracts\InboundEmailProvider;
use App\Contracts\PaymentGateway;
use App\Services\Email\ResendInboundProvider;
use App\Services\Payments\ManualGateway;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Resolve the active payment gateway from config. Add real providers
        // (PayPal / Stripe) as new match arms once accounts exist.
        $this->app->singleton(PaymentGateway::class, function () {
            return match (config('payments.driver')) {
                'flutterwave' => new \App\Services\Payments\FlutterwaveGateway(config('services.flutterwave')),
                // 'paypal'      => new \App\Services\Payments\PaypalGateway(config('services.paypal')),
                default => new ManualGateway(),
            };
        });

        // Inbound-email capture (shared inbox, Phase B) — only one provider for
        // now; add a match arm here the same way as PaymentGateway if a second
        // one is ever needed.
        $this->app->singleton(InboundEmailProvider::class, function () {
            return new ResendInboundProvider(config('services.resend.inbound_webhook_secret'));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Baseline password policy (used wherever Password::defaults() is the
        // rule): at least 12 characters with letters and numbers. In production
        // we also reject passwords found in known breach corpora (HaveIBeenPwned
        // k-anonymity API) — skipped locally/in tests to avoid a network call.
        Password::defaults(function () {
            $rule = Password::min(12)->letters()->numbers();

            return $this->app->isProduction() ? $rule->uncompromised() : $rule;
        });
    }
}
