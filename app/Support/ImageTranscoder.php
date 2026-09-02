<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Re-encode raster images to baseline JPEG so old TV browsers (LG webOS < 6,
 * older Tizen) can render them. WebP / AVIF are not decodable there.
 */
class ImageTranscoder
{
    /** Formats that must be converted; anything else is stored untouched. */
    private const CONVERT_EXT = ['webp', 'avif', 'gif', 'png'];

    private const MAX_EDGE = 1920;

    private const QUALITY = 82;

    /**
     * Store an uploaded image on the given public-disk directory as JPEG.
     * Returns the disk-relative path, e.g. "image_widget/ab12cd34.jpg".
     */
    public static function storeAsJpeg(UploadedFile $file, string $dir): string
    {
        Storage::disk('public')->makeDirectory($dir);

        $name = bin2hex(random_bytes(16)) . '.jpg';
        $path = $dir . '/' . $name;

        $jpeg = self::toJpeg(file_get_contents($file->getRealPath()));
        Storage::disk('public')->put($path, $jpeg);

        return $path;
    }

    /**
     * Convert an existing file on the public disk in place: writes a sibling
     * .jpg, deletes the original, returns the new disk-relative path.
     * No-op (returns the same path) when the extension needs no conversion.
     */
    public static function convertOnDisk(string $path): string
    {
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        if (! in_array($ext, self::CONVERT_EXT, true)) {
            return $path;
        }

        $disk = Storage::disk('public');
        if (! $disk->exists($path)) {
            return $path;
        }

        $newPath = preg_replace('/\.[^.]+$/', '.jpg', $path);
        $disk->put($newPath, self::toJpeg($disk->get($path)));

        if ($newPath !== $path) {
            $disk->delete($path);
        }

        return $newPath;
    }

    private static function toJpeg(string $bytes): string
    {
        $src = @imagecreatefromstring($bytes);
        if ($src === false) {
            // Unknown/undecodable input — hand it back unchanged rather than lose it.
            return $bytes;
        }

        $w = imagesx($src);
        $h = imagesy($src);
        $scale = min(1, self::MAX_EDGE / max($w, $h));
        $tw = max(1, (int) round($w * $scale));
        $th = max(1, (int) round($h * $scale));

        $dst = imagecreatetruecolor($tw, $th);
        // Flatten any transparency onto white.
        $white = imagecolorallocate($dst, 255, 255, 255);
        imagefilledrectangle($dst, 0, 0, $tw, $th, $white);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $tw, $th, $w, $h);

        ob_start();
        imagejpeg($dst, null, self::QUALITY);
        $out = ob_get_clean();

        imagedestroy($src);
        imagedestroy($dst);

        return $out;
    }
}
