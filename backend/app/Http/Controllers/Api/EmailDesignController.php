<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailDesign;
use App\Models\Prospect;
use App\Services\Marketing\EmailDesigner;
use App\Services\Marketing\StarterDesigns;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Saved campaign templates, the starter gallery, live render and image upload. */
class EmailDesignController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data'     => EmailDesign::query()->latest('updated_at')->get(['id', 'name', 'product', 'design', 'updated_at']),
            'starters' => StarterDesigns::all(),
            'fonts'    => array_keys(EmailDesigner::FONTS),
        ]);
    }

    public function show(EmailDesign $design): JsonResponse
    {
        return response()->json(['data' => $design]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $design = EmailDesign::create([
            'name'       => $data['name'],
            'product'    => $data['product'] ?? null,
            'design'     => EmailDesigner::normalise($data['design'], 'u'.$request->user()->id),
            'created_by' => $request->user()->id,
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $design], 201);
    }

    public function update(Request $request, EmailDesign $design): JsonResponse
    {
        $data = $this->validated($request);
        $design->update([
            'name'       => $data['name'],
            'product'    => $data['product'] ?? null,
            'design'     => EmailDesigner::normalise($data['design'], 'u'.$request->user()->id),
            'updated_by' => $request->user()->id,
        ]);

        return response()->json(['data' => $design]);
    }

    public function destroy(EmailDesign $design): JsonResponse
    {
        $design->delete();

        return response()->json(['message' => 'Template deleted.']);
    }

    /** The real email for a design, as the designer edits it (personalised with a sample name). */
    public function render(Request $request): JsonResponse
    {
        $data = $request->validate([
            'design'    => ['required', 'array'],
            'subject'   => ['nullable', 'string', 'max:255'],
            'preheader' => ['nullable', 'string', 'max:200'],
            'sample'    => ['nullable', 'string', 'max:120'],
        ]);
        $design = EmailDesigner::normalise($data['design'], 'u'.$request->user()->id);
        $html = EmailDesigner::render($design, $data['subject'] ?? 'Preview', $data['preheader'] ?? null);
        $name = e(trim($data['sample'] ?? '') ?: 'Kampala Haulage Ltd');
        $html = str_replace(['{name}', '{company}', EmailDesigner::UNSUBSCRIBE_PLACEHOLDER], [$name, $name, '#'], $html);

        return response()->json(['data' => ['html' => $html, 'design' => $design]]);
    }

    /** An image for the designer, stored publicly so inboxes can load it. */
    public function upload(Request $request): JsonResponse
    {
        $request->validate(['file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,gif']]);
        $file = $request->file('file');
        $path = $file->storeAs('campaign-images', Str::random(20).'.'.strtolower($file->getClientOriginalExtension()), 'public');

        return response()->json(['data' => ['url' => Storage::disk('public')->url($path)]], 201);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'name'    => ['required', 'string', 'max:120'],
            'product' => ['nullable', Rule::in(Prospect::PRODUCTS)],
            'design'  => ['required', 'array'],
        ]);
    }
}
