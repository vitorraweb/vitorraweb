<?php

namespace App\Contracts;

/**
 * Something a customer can pay for through a {@see PaymentGateway} — an Order
 * (coffee / FET) or an Invoice (B2B A/R). The gateway and the single payment
 * webhook depend only on this contract, so one provider integration serves every
 * payable type. Implementations own their own settlement (receipt, ledger, etc.).
 */
interface Payable
{
    /** Stable, human-readable id used as the provider merchant reference + our lookup key (e.g. VIT-… / INV-2026-0007). */
    public function payableReference(): string;

    /** Amount to charge, in the currency's MAJOR unit (UGX shillings, USD dollars). */
    public function payableAmountMajor(): float;

    /** ISO currency the charge settles in (UGX | USD). */
    public function payableCurrency(): string;

    /** Short description shown on the hosted checkout / statement. */
    public function payableDescription(): string;

    /** @return array{email_address:string, phone_number:string, first_name:string, last_name:string} */
    public function payableBilling(): array;

    /** The provider tracking id stored when payment was initiated, if any. */
    public function payableTrackingId(): ?string;

    /** Persist the provider tracking id + method when a payment is started. */
    public function attachPaymentInitiation(string $trackingId, string $method): void;

    /** Whether this payable is already fully paid (used for idempotency + status). */
    public function payableIsPaid(): bool;

    /** Settle the payable once payment is confirmed. MUST be idempotent. */
    public function markPayablePaid(): void;

    /** Where to send the browser back after the hosted checkout (origin-relative path). */
    public function payableReturnPath(): string;
}
