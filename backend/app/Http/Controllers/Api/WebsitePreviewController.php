<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\NewEnquiry;
use App\Models\Enquiry;
use App\Rules\PhoneNumber;
use App\Support\LeadSource;
use App\Support\Phone;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;

/**
 * "Get a free preview of your website" — the lead form on /websites, the
 * landing page for Vitorra Digital's starter websites (UGX 500,000: website,
 * web address and hosting for the first year).
 *
 * The owner leaves their name, business, WhatsApp number and what they sell;
 * the request lands in Enquiries as a WEB lead for the Vitorra Digital team,
 * who reply on WhatsApp for photos and send a preview. Nothing is charged
 * until the owner has seen the preview and chooses to book.
 *
 * Phone is required here (unlike the general enquiry form): the whole
 * service runs on WhatsApp, and an owner without a reachable number cannot be
 * sent a preview.
 */
class WebsitePreviewController extends Controller
{
    public const BUSINESS_TYPES = [
        'shop', 'salon', 'restaurant', 'hardware', 'hotel', 'school', 'clinic', 'services', 'farm', 'other',
    ];

    private const TYPE_LABEL = [
        'shop' => 'Shop / boutique', 'salon' => 'Salon / beauty', 'restaurant' => 'Restaurant / café / bakery',
        'hardware' => 'Hardware / building supplies', 'hotel' => 'Hotel / guesthouse / tours',
        'school' => 'School / training', 'clinic' => 'Clinic / pharmacy', 'services' => 'Professional services',
        'farm' => 'Farm / agro products', 'other' => 'Other',
    ];

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'business'      => ['required', 'string', 'max:255'],
            'phone'         => ['required', 'string', 'max:50', new PhoneNumber()],
            'email'         => ['required', 'email', 'max:255'],
            'business_type' => ['required', Rule::in(self::BUSINESS_TYPES)],
            // Where customers find them today (Facebook, Instagram, TikTok, Google Maps…).
            'online_link'   => ['nullable', 'string', 'max:500'],
            'sells'         => ['nullable', 'string', 'max:1000'],
            'add_ads'       => ['nullable', 'boolean'],
            'attribution'   => ['nullable', 'array'],
        ]);

        $requirements = [
            ['key' => 'request', 'label' => 'Request', 'value' => 'Free website preview (starter website, UGX 500,000)'],
            ['key' => 'business', 'label' => 'Business', 'value' => $data['business']],
            ['key' => 'business_type', 'label' => 'Type of business', 'value' => self::TYPE_LABEL[$data['business_type']]],
        ];
        if (! empty($data['online_link'])) {
            $requirements[] = ['key' => 'online_link', 'label' => 'Found online today at', 'value' => $data['online_link']];
        }
        if (! empty($data['sells'])) {
            $requirements[] = ['key' => 'sells', 'label' => 'What they sell', 'value' => $data['sells']];
        }
        if (! empty($data['add_ads'])) {
            $requirements[] = ['key' => 'add_ads', 'label' => 'Interested in ads', 'value' => 'Yes, wants help running ads after launch'];
        }
        $requirements[] = ['key' => 'contact_pref', 'label' => 'Contact preference', 'value' => 'WhatsApp'];

        $route = config('enquiries.routing')['WEB'] ?? null;
        $message = 'Asked for a free website preview. Reply on WhatsApp for their logo, photos and prices, then send the preview within 48 hours.';

        // The same request again a moment later is the same lead (see Enquiry::recentDuplicate).
        if ($dup = Enquiry::recentDuplicate($data['email'], 'WEB', $message, $requirements)) {
            return response()->json(['data' => ['id' => $dup->id], 'duplicate' => true, 'message' => 'Received. We will message you on WhatsApp.'], 200);
        }

        $enquiry = Enquiry::create([
            'product_category' => 'WEB',
            'name'             => $data['name'],
            'email'            => $data['email'],
            'phone'            => Phone::e164($data['phone']),
            'company'          => $data['business'],
            'country'          => 'Uganda',
            'message'          => $message,
            'requirements'     => $requirements,
            'assigned_to'      => $route['team'] ?? config('enquiries.default_team'),
            ...LeadSource::resolve($data['attribution'] ?? []),
        ]);

        // The lead is saved; a notification failing must never lose it or fail the visitor.
        try {
            Mail::to(($route['email'] ?? null) ?: config('mail.team_address'))->send(new NewEnquiry($enquiry));
            app(\App\Services\Teams\TeamsAlerts::class)->newEnquiry($enquiry);
        } catch (\Throwable $e) {
            Log::warning('Website preview team notice failed', ['enquiry' => $enquiry->id, 'error' => $e->getMessage()]);
        }

        // The id lets the browser report this lead to the ad platforms exactly once.
        return response()->json(['data' => ['id' => $enquiry->id], 'message' => 'Received. We will message you on WhatsApp.'], 201);
    }
}
