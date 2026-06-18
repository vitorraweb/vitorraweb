<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyEventController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => CompanyEvent::orderBy('start_date', 'desc')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $event = CompanyEvent::create($this->validateData($request) + ['created_by' => $request->user()->id]);

        return response()->json(['data' => $event], 201);
    }

    public function update(Request $request, CompanyEvent $event): JsonResponse
    {
        $event->update($this->validateData($request));

        return response()->json(['data' => $event]);
    }

    public function destroy(CompanyEvent $event): JsonResponse
    {
        $event->delete();

        return response()->json(['message' => 'Event removed.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'title'        => ['required', 'string', 'max:255'],
            'description'  => ['nullable', 'string', 'max:2000'],
            'start_date'   => ['required', 'date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'blocks_leave' => ['boolean'],
        ]);
    }
}
