<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SettingsController extends Controller
{
    /** Current settings (defaults merged with stored values). */
    public function index(): JsonResponse
    {
        return response()->json(['data' => Setting::resolved()]);
    }

    /** Update any subset of settings. */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vat_enabled'                => ['sometimes', 'boolean'],
            'vat_rate'                   => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'vat_notice'                 => ['sometimes', 'nullable', 'string', 'max:255'],
            'exchange_rate_mode'         => ['sometimes', Rule::in(['live', 'manual'])],
            'exchange_rate_manual'       => ['sometimes', 'numeric', 'min:1'],
            'shipping_kampala_ugx'       => ['sometimes', 'integer', 'min:0'],
            'shipping_national_ugx'      => ['sometimes', 'integer', 'min:0'],
            'shipping_international_note' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notify_email'               => ['sometimes', 'nullable', 'email', 'max:255'],
            'notify_whatsapp'            => ['sometimes', 'nullable', 'string', 'max:50'],
        ]);

        Setting::put($data);

        return response()->json([
            'data'    => Setting::resolved(),
            'message' => 'Settings saved.',
        ]);
    }
}
