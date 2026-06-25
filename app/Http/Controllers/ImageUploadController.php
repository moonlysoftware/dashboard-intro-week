<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ImageUploadController extends Controller
{
    public function index(): JsonResponse
    {
        $files = Storage::disk('public')->files('image_widget');

        $images = array_map(function (string $path): array {
            return [
                'url' => '/storage/'.$path,
                'filename' => basename($path),
            ];
        }, $files);

        return response()->json(array_values($images));
    }

    public function store(Request $request): JsonResponse
    {
        if (! $request->hasFile('image')) {
            $uploadError = $request->file('image')?->getError() ?? UPLOAD_ERR_NO_FILE;

            return response()->json([
                'message' => $this->uploadErrorMessage($uploadError),
            ], 422);
        }

        $file = $request->file('image');

        if ($file->getError() !== UPLOAD_ERR_OK) {
            return response()->json([
                'message' => $this->uploadErrorMessage($file->getError()),
            ], 422);
        }

        $validated = $request->validate([
            'image' => 'required|file|mimes:jpeg,jpg,png,gif,webp|max:20480',
        ]);

        Storage::disk('public')->makeDirectory('image_widget');

        try {
            $path = $validated['image']->store('image_widget', 'public');
        } catch (\Throwable $e) {
            Log::error('Image upload storage failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Opslaan mislukt. Controleer schrijfrechten op storage/app/public.',
            ], 500);
        }

        if (! $path) {
            return response()->json([
                'message' => 'Opslaan mislukt. Controleer schrijfrechten op storage/app/public.',
            ], 500);
        }

        return response()->json([
            'url' => '/storage/'.$path,
            'filename' => basename($path),
        ], 201);
    }

    public function destroy(string $filename): JsonResponse
    {
        $path = 'image_widget/'.basename($filename);

        if (! Storage::disk('public')->exists($path)) {
            return response()->json(['message' => 'Bestand niet gevonden.'], 404);
        }

        Storage::disk('public')->delete($path);

        return response()->json(['message' => 'Afbeelding verwijderd.']);
    }

    private function uploadErrorMessage(int $error): string
    {
        return match ($error) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Bestand is te groot (max. 20 MB).',
            UPLOAD_ERR_PARTIAL => 'Upload was onvolledig. Probeer het opnieuw.',
            UPLOAD_ERR_NO_FILE => 'Geen bestand ontvangen.',
            default => 'Upload mislukt. Probeer het opnieuw.',
        };
    }
}
