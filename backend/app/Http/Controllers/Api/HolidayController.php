<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PublicHoliday;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => PublicHoliday::orderBy('date')->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);
        $holiday = PublicHoliday::create($data + ['source' => 'admin']);

        return response()->json(['data' => $holiday], 201);
    }

    public function update(Request $request, PublicHoliday $holiday): JsonResponse
    {
        $holiday->update($this->validateData($request));

        return response()->json(['data' => $holiday]);
    }

    public function destroy(PublicHoliday $holiday): JsonResponse
    {
        $holiday->delete();

        return response()->json(['message' => 'Holiday removed.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'name'      => ['required', 'string', 'max:255'],
            'date'      => ['required', 'date'],
            'recurring' => ['boolean'],
        ]);
    }
}
