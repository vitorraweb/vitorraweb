<?php

namespace App\Console\Commands;

use App\Models\Communication;
use App\Models\ContactMessage;
use App\Models\CustomerNote;
use App\Models\Document;
use App\Models\Enquiry;
use App\Models\Order;
use App\Models\User;
use App\Support\Audit;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Remove the team's own test submissions from the enquiry, order and message
 * feeds, so what is left is customers.
 *
 *   php artisan leads:purge-test                         # list only — deletes nothing
 *   php artisan leads:purge-test --email=me@gmail.com    # add personal test addresses
 *   php artisan leads:purge-test --email=... --force     # delete what was listed
 *
 * A record is the team's when:
 *   - its email belongs to a staff login (admin / ops / employee),
 *   - its email is on @vitorra.org (customers do not write from our domain),
 *   - its email was passed with --email, or
 *   - its name contains a staff member's full name ("John Oluwaseyi").
 *
 * A name that is only a staff FIRST name ("John", "Thurayya") is listed as
 * "check by hand" and kept unless --include-first-names is given: a real
 * customer can be called John.
 *
 * Before deleting, every row is written to a JSON backup on the private disk,
 * and the purge is recorded in the activity log.
 */
class PurgeTestLeads extends Command
{
    protected $signature = 'leads:purge-test
        {--email=* : Extra test email addresses (personal Gmail etc.)}
        {--name=* : Extra test names to match (whole-name contains)}
        {--include-first-names : Also delete records named only with a staff first name}
        {--force : Actually delete (otherwise only lists)}';

    protected $description = 'List, then remove, test enquiries / orders / messages made by staff';

    /** @var list<string> */
    private array $emails = [];

    /** @var list<string> full names, lower-cased */
    private array $fullNames = [];

    /** @var list<string> distinctive first names, lower-cased */
    private array $firstNames = [];

    public function handle(): int
    {
        $this->collectStaffIdentities();

        $found = collect([
            ...$this->scan(Enquiry::query(), 'enquiry', 'name', 'email'),
            ...$this->scan(Order::query(), 'order', 'customer_name', 'customer_email'),
            ...$this->scan(ContactMessage::query(), 'message', 'name', 'email'),
        ]);

        $sure = $found->where('certain', true)->values();
        $maybe = $found->where('certain', false)->values();
        $doomed = $this->option('include-first-names') ? $found : $sure;
        $doomedKeys = $doomed->map(fn ($r) => $r['type'].':'.$r['model']->getKey())->flip();

        $this->newLine();
        $this->line('  Staff identities checked: '.count($this->emails).' email(s), '.count($this->fullNames).' full name(s).');
        $this->newLine();

        if ($found->isEmpty()) {
            $this->info('  Nothing found — the feeds hold no staff test records.');

            return self::SUCCESS;
        }

        $this->table(['Will delete', 'Type', 'ID', 'Date', 'Name', 'Email', 'Why'], $found->map(fn ($r) => [
            isset($doomedKeys[$r['type'].':'.$r['model']->getKey()]) ? 'yes' : 'no — check',
            $r['type'], $r['model']->getKey(), $r['model']->created_at?->format('Y-m-d'),
            Str::limit($r['name'] ?? '', 30), $r['email'], $r['reason'],
        ])->all());

        $this->line(sprintf('  %d to delete (%s).', $doomed->count(), $this->counts($doomed)));
        if ($maybe->isNotEmpty() && ! $this->option('include-first-names')) {
            $this->line("  {$maybe->count()} kept for a human look: first name only. Add --include-first-names to delete them too.");
        }

        if (! $this->option('force')) {
            $this->newLine();
            $this->warn('  Nothing deleted. Check the list, then run again with --force.');

            return self::SUCCESS;
        }

        $backup = $this->backup($doomed);
        $this->purge($doomed);

        Audit::log('leads.purged_test', "Removed {$doomed->count()} staff test record(s): ".$this->counts($doomed), null, ['backup' => $backup]);

        $this->newLine();
        $this->info("  ✓ Deleted {$doomed->count()} record(s). Backup: storage/app/private/{$backup}");

        return self::SUCCESS;
    }

    private function collectStaffIdentities(): void
    {
        $staff = User::whereIn('role', ['admin', 'ops', 'employee'])->get(['name', 'email']);

        $this->emails = $staff->pluck('email')
            ->merge($this->option('email'))
            ->map(fn ($e) => Str::lower(trim((string) $e)))
            ->filter()->unique()->values()->all();

        $names = $staff->pluck('name')->merge($this->option('name'))
            ->map(fn ($n) => Str::lower(trim(preg_replace('/\s+/', ' ', (string) $n))))
            ->filter();

        // Only real two-part names count as a "full name"; seeded logins
        // called "Admin" or "Ops" would match far too much.
        $this->fullNames = $names->filter(fn ($n) => str_contains($n, ' '))->unique()->values()->all();
        $this->firstNames = $names->map(fn ($n) => Str::before($n, ' '))
            ->filter(fn ($n) => mb_strlen($n) >= 3 && ! in_array($n, ['admin', 'ops', 'staff', 'test', 'the'], true))
            ->unique()->values()->all();
    }

    /** @return list<array{type:string, model:Model, name:?string, email:string, reason:string, certain:bool}> */
    private function scan($query, string $type, string $nameCol, string $emailCol): array
    {
        $out = [];
        foreach ($query->cursor() as $m) {
            $email = Str::lower(trim((string) $m->{$emailCol}));
            $name = Str::lower(trim(preg_replace('/\s+/', ' ', (string) $m->{$nameCol})));
            $reason = null;
            $certain = true;

            if ($email !== '' && in_array($email, $this->emails, true)) {
                $reason = 'staff / test email';
            } elseif (str_ends_with($email, '@vitorra.org')) {
                $reason = '@vitorra.org address';
            } elseif ($hit = collect($this->fullNames)->first(fn ($n) => str_contains($name, $n))) {
                $reason = "name contains \"{$hit}\"";
            } elseif ($name !== '' && in_array($name, $this->firstNames, true)) {
                $reason = 'staff first name only';
                $certain = false;
            }

            if ($reason) {
                $out[] = ['type' => $type, 'model' => $m, 'name' => $m->{$nameCol}, 'email' => $email, 'reason' => $reason, 'certain' => $certain];
            }
        }

        return $out;
    }

    private function counts(Collection $rows): string
    {
        return $rows->countBy('type')->map(fn ($n, $t) => "{$n} {$t}".($n === 1 ? '' : 's'))->implode(', ') ?: 'none';
    }

    /** Write every row (and what hangs off it) to a JSON file before it goes. */
    private function backup(Collection $rows): string
    {
        $path = 'purge-backups/test-leads-'.now()->format('Ymd-His').'.json';
        $data = $rows->map(function ($r) {
            $m = $r['model'];
            $extra = match ($r['type']) {
                'order'   => ['items' => $m->items()->get()->toArray(), 'documents' => Document::where('order_id', $m->id)->get()->toArray()],
                'enquiry' => ['documents' => Document::where('enquiry_id', $m->id)->get()->toArray()],
                default   => [],
            };

            return ['type' => $r['type'], 'reason' => $r['reason'], 'record' => $m->getAttributes(), ...$extra];
        })->values()->all();

        Storage::disk('local')->put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        return $path;
    }

    private function purge(Collection $rows): void
    {
        DB::transaction(function () use ($rows) {
            foreach ($rows as $r) {
                $m = $r['model'];

                // Generated PDFs (reservation, receipt) live on the public disk.
                $docs = Document::query()->where($r['type'] === 'order' ? 'order_id' : 'enquiry_id', $m->id);
                if (in_array($r['type'], ['order', 'enquiry'], true)) {
                    $docs->pluck('path')->filter()->each(fn ($p) => Storage::disk('public')->delete($p));
                }

                // Staff replies logged against this record.
                Communication::where('related_type', $r['type'])->where('related_id', $m->id)->delete();

                // Items, installment plans and documents cascade; FET
                // installs/trials keep their row with the link cleared.
                $m->delete();
            }

            // A test email with nothing left on file should not linger in the
            // customer directory or pipeline either.
            $emails = $rows->pluck('email')->filter()->unique();
            foreach ($emails as $email) {
                $stillUsed = Enquiry::whereRaw('LOWER(email) = ?', [$email])->exists()
                    || Order::whereRaw('LOWER(customer_email) = ?', [$email])->exists()
                    || ContactMessage::whereRaw('LOWER(email) = ?', [$email])->exists();
                if (! $stillUsed) {
                    CustomerNote::where('email', $email)->delete();
                    Communication::whereRaw('LOWER(email) = ?', [$email])->delete();
                }
            }
        });
    }
}
