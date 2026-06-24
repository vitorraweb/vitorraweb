<?php

namespace App\Rules;

use App\Support\Phone;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Validates a phone number with libphonenumber (Uganda by default, any valid
 * international number accepted). Pair with `nullable` for optional fields.
 */
class PhoneNumber implements ValidationRule
{
    public function __construct(private readonly string $region = Phone::DEFAULT_REGION) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! Phone::isValid(is_string($value) ? $value : null, $this->region)) {
            $fail('Please enter a valid phone number (e.g. 0772 123456 or +256 772 123456).');
        }
    }
}
