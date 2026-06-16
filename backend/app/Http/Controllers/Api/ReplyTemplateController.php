<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReplyTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReplyTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ReplyTemplate::with('creator:id,name')->orderBy('category')->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:100'],
            'subject'  => ['required', 'string', 'max:255'],
            'body'     => ['required', 'string', 'max:10000'],
            'category' => ['nullable', 'string', 'in:FET,SEAL,Coffee,Logistics,General'],
        ]);

        $template = ReplyTemplate::create([...$data, 'created_by' => $request->user()->id]);

        return response()->json(['data' => $template->load('creator:id,name')], 201);
    }

    public function update(Request $request, ReplyTemplate $template): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['sometimes', 'required', 'string', 'max:100'],
            'subject'  => ['sometimes', 'required', 'string', 'max:255'],
            'body'     => ['sometimes', 'required', 'string', 'max:10000'],
            'category' => ['nullable', 'string', 'in:FET,SEAL,Coffee,Logistics,General'],
        ]);

        $template->update($data);

        return response()->json(['data' => $template->fresh('creator:id,name')]);
    }

    public function destroy(ReplyTemplate $template): JsonResponse
    {
        $template->delete();
        return response()->json(['message' => 'Template deleted.']);
    }
}
