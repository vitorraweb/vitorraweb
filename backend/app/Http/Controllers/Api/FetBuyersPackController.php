<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\FetBuyersPack;
use App\Mail\NewEnquiry;
use App\Models\Enquiry;
use App\Models\FetStockMovement;
use App\Models\Product;
use App\Rules\PhoneNumber;
use App\Support\LeadSource;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

/**
 * "Send me the FET Buyer's Pack": the light first step for a visitor who is
 * interested but not ready to ask for a quote. They leave a name, an email and
 * the size of their fleet; we email them the published price list, the
 * which-device guide and the datasheet straight away, and the request lands in
 * Enquiries (and Sales → Today) as an FET lead, so sales can follow up.
 *
 * The pack is only what is already public on vitorra.org: nothing is promised
 * in the email that the website does not already say.
 */
class FetBuyersPackController extends Controller
{
    public const FLEET_SIZES = ['1', '2-5', '6-20', '21-50', '50+'];
    public const VEHICLES    = ['car', 'suv', 'lighttruck', 'heavytruck', 'mixed'];

    private const VEHICLE_LABEL = [
        'car' => 'Cars / mini-buses', 'suv' => 'SUVs / large cars / vans', 'lighttruck' => 'Light & medium trucks',
        'heavytruck' => 'Heavy trucks', 'mixed' => 'A mix of vehicles',
    ];

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['required', 'email', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:50', new PhoneNumber()],
            'company'     => ['nullable', 'string', 'max:255'],
            'fleet_size'  => ['required', Rule::in(self::FLEET_SIZES)],
            'vehicle'     => ['nullable', Rule::in(self::VEHICLES)],
            'attribution' => ['nullable', 'array'],
        ]);

        $requirements = [
            ['key' => 'request', 'label' => 'Request', 'value' => "FET Buyer's Pack (price list, device guide, datasheet)"],
            ['key' => 'fleet_size', 'label' => 'Vehicles in fleet', 'value' => $data['fleet_size']],
        ];
        if (! empty($data['vehicle'])) {
            $requirements[] = ['key' => 'vehicle', 'label' => 'Main vehicles', 'value' => self::VEHICLE_LABEL[$data['vehicle']]];
        }

        $enquiry = Enquiry::create([
            'product_category' => 'FET',
            'name'             => $data['name'],
            'email'            => $data['email'],
            'phone'            => Phone::e164($data['phone'] ?? null),
            'company'          => $data['company'] ?? null,
            'country'          => 'Uganda',
            'message'          => "Requested the FET Buyer's Pack from the website. Follow up with a free fuel assessment offer.",
            'requirements'     => $requirements,
            'assigned_to'      => config('enquiries.routing')['FET']['team'] ?? config('enquiries.default_team'),
            ...LeadSource::resolve($data['attribution'] ?? []),
        ]);

        // The visitor gets the pack first; a team notification failing must never cost them it.
        Mail::to($enquiry->email)->send(new FetBuyersPack($enquiry->name, $this->prices()));
        try {
            $route = config('enquiries.routing')['FET'] ?? null;
            Mail::to(($route['email'] ?? null) ?: config('mail.team_address'))->send(new NewEnquiry($enquiry));
            app(\App\Services\Teams\TeamsAlerts::class)->newEnquiry($enquiry);
        } catch (\Throwable $e) {
            Log::warning('Buyer\'s pack team notice failed', ['enquiry' => $enquiry->id, 'error' => $e->getMessage()]);
        }

        return response()->json(['message' => "Sent. Check your inbox for the FET Buyer's Pack."], 201);
    }

    private const FITS = [
        'FI' => 'cars & mini-buses', 'FII' => 'SUVs, large cars & vans',
        'FIII' => 'light & medium trucks', 'FIV' => 'heavy trucks',
    ];

    /** The published prices, read from the same product records reservations charge. */
    private function prices(): array
    {
        $models = array_filter(FetStockMovement::MODELS, fn ($m) => $m['slug'] !== null);
        $prices = Product::whereIn('slug', array_column($models, 'slug'))->pluck('price_ugx', 'slug');
        $out = [];
        foreach ($models as $code => $m) {
            if (! empty($prices[$m['slug']])) {
                $out[] = ['label' => $m['label'], 'fits' => self::FITS[$code], 'price_ugx' => (int) $prices[$m['slug']]];
            }
        }

        return $out;
    }
}
