<?php

namespace App\Services;

use App\Models\User;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * App-based two-factor (TOTP). Generates secrets + QR codes, verifies codes
 * (with a small time-window for clock drift), and manages one-time recovery
 * codes for when the authenticator device is lost.
 */
class TwoFactorService
{
    public function __construct(private readonly Google2FA $google2fa) {}

    /** A fresh, not-yet-confirmed secret. */
    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    /** otpauth:// URI rendered as an inline SVG data-URI for an <img> tag. */
    public function qrCodeDataUri(User $user, string $secret): string
    {
        $uri = $this->google2fa->getQRCodeUrl(
            config('app.name', 'Vitorra'),
            $user->email,
            $secret,
        );

        $svg = (new Writer(new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd())))->writeString($uri);

        return 'data:image/svg+xml;base64,'.base64_encode($svg);
    }

    /** Verify a 6-digit TOTP code against a secret (±1 window = ~30s drift). */
    public function verify(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey($secret, preg_replace('/\s+/', '', $code), 1) !== false;
    }

    /** @return array<int, string> Eight fresh recovery codes (plaintext, shown once). */
    public function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))
            ->map(fn () => Str::upper(Str::random(4).'-'.Str::random(4)))
            ->all();
    }

    /**
     * Consume a matching recovery code if present. Returns true and removes the
     * code from the user when it matches; false otherwise.
     */
    public function consumeRecoveryCode(User $user, string $code): bool
    {
        $code  = strtoupper(trim($code));
        $codes = $user->two_factor_recovery_codes ?? [];

        if (! in_array($code, $codes, true)) {
            return false;
        }

        $user->two_factor_recovery_codes = array_values(array_diff($codes, [$code]));
        $user->save();

        return true;
    }

    /** True if the supplied code is either a valid TOTP code or a recovery code. */
    public function passesChallenge(User $user, string $code): bool
    {
        if ($user->two_factor_secret && $this->verify($user->two_factor_secret, $code)) {
            return true;
        }

        return $this->consumeRecoveryCode($user, $code);
    }
}
