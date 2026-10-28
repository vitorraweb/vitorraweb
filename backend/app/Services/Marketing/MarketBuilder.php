<?php

namespace App\Services\Marketing;

use App\Models\Enquiry;
use App\Models\Market;
use App\Models\Prospect;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Sorts every contact we hold into markets, so Marketing starts with full
 * audiences instead of empty ones.
 *
 *   1. Website enquirers (FET, SEAL, coffee) become CRM contacts under the
 *      "Website enquiries" industry — they asked about us, so they start as
 *      "responded" (or "converted" if the enquiry became an order). Staff
 *      and @vitorra.org test addresses are left out.
 *   2. One market per product × industry ("Fuel Eco Tech · Cargo"), marked
 *      with an auto_key so a rebuild finds it even after a rename.
 *   3. Contacts who are in no market yet join their product × industry
 *      market. Anyone the team has already placed (or moved) is left alone,
 *      so running this again never undoes their work.
 *
 * Idempotent: safe to run as often as wanted.
 */
class MarketBuilder
{
    private const COLORS = ['FET' => '#1F64A8', 'SEAL' => '#A8406E', 'COFFEE' => '#7A6020'];

    /** @return array{website_added:int, website_updated:int, markets_created:int, contacts_placed:int} */
    public function build(?int $userId = null): array
    {
        [$added, $updated] = $this->syncWebsiteContacts();
        [$created, $placed] = $this->buildMarkets($userId);

        return ['website_added' => $added, 'website_updated' => $updated, 'markets_created' => $created, 'contacts_placed' => $placed];
    }

    /** @return array{0:int,1:int} added, updated */
    public function syncWebsiteContacts(): array
    {
        $staff = User::whereIn('role', ['admin', 'ops', 'employee'])->pluck('email')->map(fn ($e) => mb_strtolower($e))->flip();
        $added = $updated = 0;

        Enquiry::query()->whereIn('product_category', Prospect::PRODUCTS)->orderBy('id')->each(function (Enquiry $e) use ($staff, &$added, &$updated) {
            $email = mb_strtolower(trim((string) $e->email));
            if ($email === '' || isset($staff[$email]) || str_ends_with($email, '@vitorra.org')) {
                return;
            }
            $status = $e->status === 'converted' ? 'converted' : 'responded';

            $existing = Prospect::where('product', $e->product_category)->whereRaw('LOWER(email) = ?', [$email])->first();
            if ($existing) {
                // Only ever move a contact forward, and never past what the team set.
                $rank = array_flip(['not_contacted', 'contacted', 'delivered', 'responded', 'qualified', 'quoted', 'converted']);
                if (isset($rank[$existing->outreach_status]) && $rank[$status] > $rank[$existing->outreach_status]) {
                    $existing->update(['outreach_status' => $status]);
                    $updated++;
                }

                return;
            }

            Prospect::create([
                'name'            => Str::limit(trim($e->company ?: $e->name), 250, ''),
                'category'        => 'WEBSITE_LEAD',
                'product'         => $e->product_category,
                'email'           => $email,
                'phone'           => $e->phone,
                'location'        => $e->country,
                'outreach_status' => $status,
                'feedback'        => Str::limit('Website enquiry #'.$e->id.': '.trim((string) $e->message), 480),
                'source'          => 'website enquiry #'.$e->id,
            ]);
            $added++;
        });

        return [$added, $updated];
    }

    /** @return array{0:int,1:int} markets created, contacts placed */
    public function buildMarkets(?int $userId = null): array
    {
        $created = 0;
        $placed = 0;
        $placedAlready = DB::table('market_members')->distinct()->pluck('prospect_id')->flip();

        $groups = Prospect::query()->where('category', '!=', 'INTERNAL_TEST')
            ->select('product', 'category')->distinct()->get();

        foreach ($groups as $g) {
            $key = "{$g->product}|{$g->category}";
            $market = Market::where('auto_key', $key)->first();
            if (! $market) {
                $market = Market::create([
                    'name'        => (Prospect::PRODUCT_LABELS[$g->product] ?? $g->product).' · '.(Prospect::CATEGORY_LABELS[$g->category] ?? Str::headline(strtolower($g->category))),
                    'description' => 'Built from the '.strtolower(Prospect::CATEGORY_LABELS[$g->category] ?? $g->category).' list. Add, move or remove contacts freely.',
                    'product'     => $g->product,
                    'color'       => self::COLORS[$g->product] ?? '#4D545E',
                    'auto_key'    => $key,
                    'created_by'  => $userId,
                ]);
                $created++;
            }

            $ids = Prospect::where('product', $g->product)->where('category', $g->category)->pluck('id')
                ->reject(fn ($id) => isset($placedAlready[$id]));
            if ($ids->isNotEmpty()) {
                $market->prospects()->syncWithoutDetaching($ids->mapWithKeys(fn ($id) => [$id => ['added_by' => $userId]])->all());
                $placed += $ids->count();
            }
        }

        return [$created, $placed];
    }

    /** The automatic market for a product × industry, if it has been built. */
    public static function autoMarketFor(string $product, string $category): ?Market
    {
        return Market::where('auto_key', "{$product}|{$category}")->first();
    }
}
