<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ImageUploadController extends Controller
{
    public function index(): JsonResponse
    {
        $files = Storage::disk('public')->files('image_widget');

        $images = array_map(function (string $path): array {
            return [
                'url'      => '/storage/' . $path,
                'filename' => basename($path),
            ];
        }, $files);

        return response()->json(array_values($images));
    }

    public function store(Request $request): JsonResponse
    {
        // Debug: log raw file info
        Log::info('Image upload attempt', [
            'has_file'   => $request->hasFile('image'),
            'all_files'  => array_keys($request->allFiles()),
            'file_error' => $request->hasFile('image') ? $request->file('image')->getError() : 'no file',
            'upload_max' => ini_get('upload_max_filesize'),
            'post_max'   => ini_get('post_max_size'),
        ]);

        $request->validate([
            'image' => 'required|image|max:20480',
        ]);

        $path = $request->file('image')->store('image_widget', 'public');

        return response()->json([
            'url'      => '/storage/' . $path,
            'filename' => basename($path),
        ], 201);
    }

    public function destroy(string $filename): JsonResponse
    {
        $path = 'image_widget/' . $filename;

        if (!Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'Bestand niet gevonden.'], 404);
        }

        Storage::disk('public')->delete($path);

        return response()->json(['message' => 'Afbeelding verwijderd.']);
    }
}
