<?php

namespace App\Support;

use App\Models\Prospect;
use Illuminate\Support\Collection;

/**
 * Finds whether an imported row is someone already on a product's list.
 *
 * A row is the same customer when any of these agree with an existing row:
 *   - the name, ignoring case, punctuation, "&"/"and" and a trailing
 *     Ltd / Limited / Co / Company / LLC / GmbH ("Java House Ltd" = "java house");
 *   - the email, ignoring case;
 *   - a phone number, on its last nine digits ("0772 123456" = "+256772123456").
 * Name is checked first, so `find()` reports how the match was made — a match
 * on email or phone under a different name is surfaced for a human to check
 * (two businesses can share an inbox).
 */
class ProspectMatchIndex
{
    /** @var array<string, Prospect> */
    private array $byName = [];

    /** @var array<string, Prospect> */
    private array $byEmail = [];

    /** @var array<string, Prospect> */
    private array $byPhone = [];

    public function __construct(Collection $prospects)
    {
        $prospects->each(fn (Prospect $p) => $this->add($p));
    }

    public function add(Prospect $p): void
    {
        if (($n = self::name($p->name)) !== '') {
            $this->byName[$n] ??= $p;
        }
        if ($p->email) {
            $this->byEmail[strtolower(trim($p->email))] ??= $p;
        }
        foreach (self::phones($p->phone) as $ph) {
            $this->byPhone[$ph] ??= $p;
        }
    }

    /** @return array{0: ?Prospect, 1: ?string} the match and how it was made */
    public function find(string $name, ?string $email, ?string $phone): array
    {
        if (($n = self::name($name)) !== '' && isset($this->byName[$n])) {
            return [$this->byName[$n], 'name'];
        }
        if ($email && isset($this->byEmail[strtolower(trim($email))])) {
            return [$this->byEmail[strtolower(trim($email))], 'email'];
        }
        foreach (self::phones($phone) as $ph) {
            if (isset($this->byPhone[$ph])) {
                return [$this->byPhone[$ph], 'phone'];
            }
        }

        return [null, null];
    }

    public static function name(?string $name): string
    {
        $n = mb_strtolower((string) $name);
        $n = str_replace('&', ' and ', $n);
        $n = preg_replace('/[^\p{L}\p{N}]+/u', ' ', $n);
        $n = preg_replace('/\b(ltd|limited|co|company|llc|gmbh|inc|plc)\b\s*$/u', '', trim($n));

        return trim(preg_replace('/\s+/', ' ', $n));
    }

    /** @return array<int, string> each number's last nine digits */
    public static function phones(?string $phone): array
    {
        $out = [];
        foreach (preg_split('#[/,;]#', (string) $phone) as $part) {
            $digits = preg_replace('/\D/', '', $part);
            if (strlen($digits) >= 9) {
                $out[] = substr($digits, -9);
            }
        }

        return $out;
    }
}
