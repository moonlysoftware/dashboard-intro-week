<?php

namespace App\Console\Commands;

use App\Models\AgendaEvent;
use App\Models\Announcement;
use App\Models\Person;
use App\Models\Widget;
use App\Support\ImageTranscoder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

/**
 * One-off: convert already-uploaded WebP/AVIF/GIF images to JPEG and rewrite
 * every DB reference. Run once per environment after deploying.
 *
 *   php artisan images:transcode --dry-run
 *   php artisan images:transcode
 */
class TranscodeImages extends Command
{
    protected $signature = 'images:transcode {--dry-run : List changes without writing}';

    protected $description = 'Convert uploaded WebP/AVIF/GIF images to JPEG and update references';

    /** Public-disk directories that hold user uploads. */
    private const DIRS = ['image_widget', 'birthdays'];

    /** Extensions that break on old TV browsers. */
    private const BAD_EXT = ['webp', 'avif', 'gif'];

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        if (! $dry && ! \extension_loaded('gd')) {
            $this->error('GD extension not loaded — cannot transcode. Aborting.');

            return self::FAILURE;
        }

        $disk = Storage::disk('public');

        /** @var array<string,string> web-path => web-path, e.g. /storage/image_widget/x.webp => .../x.jpg */
        $map = [];

        foreach (self::DIRS as $dir) {
            foreach ($disk->files($dir) as $path) {
                $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
                if (! in_array($ext, self::BAD_EXT, true)) {
                    continue;
                }

                $newPath = preg_replace('/\.[^.]+$/', '.jpg', $path);
                $this->line(($dry ? '[dry] ' : '') . "$path -> $newPath");

                if (! $dry) {
                    $newPath = ImageTranscoder::convertOnDisk($path);
                }

                $map['/storage/' . $path] = '/storage/' . $newPath;
            }
        }

        if (empty($map)) {
            $this->info('No WebP/AVIF/GIF uploads found. Nothing to do.');

            return self::SUCCESS;
        }

        $this->newLine();
        $this->info(count($map) . ' file(s) ' . ($dry ? 'would be' : '') . ' converted. Updating references...');

        $rewrites = 0;
        $rewrites += $this->fixPhotoColumn(Announcement::class, $map, $dry);
        $rewrites += $this->fixPhotoColumn(AgendaEvent::class, $map, $dry);
        $rewrites += $this->fixPhotoColumn(Person::class, $map, $dry);
        $rewrites += $this->fixWidgets($map, $dry);

        $this->info(($dry ? '[dry] ' : '') . "$rewrites reference(s) updated.");
        $this->newLine();
        $this->comment('Also update resources/js/data/birthdays.json + jubilea.json and rebuild the frontend.');

        return self::SUCCESS;
    }

    /**
     * @param  class-string<\Illuminate\Database\Eloquent\Model>  $model
     * @param  array<string,string>  $map
     */
    private function fixPhotoColumn(string $model, array $map, bool $dry): int
    {
        $count = 0;

        foreach ($model::query()->whereNotNull('photo')->get() as $row) {
            if (isset($map[$row->photo])) {
                $this->line(($dry ? '[dry] ' : '') . class_basename($model) . " #{$row->getKey()}: {$row->photo} -> {$map[$row->photo]}");
                if (! $dry) {
                    $row->update(['photo' => $map[$row->photo]]);
                }
                $count++;
            }
        }

        return $count;
    }

    /** @param array<string,string> $map */
    private function fixWidgets(array $map, bool $dry): int
    {
        $count = 0;

        foreach (Widget::all() as $widget) {
            $config = $widget->config ?? [];
            $changed = false;

            if (! empty($config['selected_images']) && is_array($config['selected_images'])) {
                $config['selected_images'] = array_map(function ($url) use ($map, &$changed) {
                    if (isset($map[$url])) {
                        $changed = true;

                        return $map[$url];
                    }

                    return $url;
                }, $config['selected_images']);
            }

            if (! empty($config['image_positions']) && is_array($config['image_positions'])) {
                $remapped = [];
                foreach ($config['image_positions'] as $url => $pos) {
                    $key = $map[$url] ?? $url;
                    if ($key !== $url) {
                        $changed = true;
                    }
                    $remapped[$key] = $pos;
                }
                $config['image_positions'] = $remapped;
            }

            if ($changed) {
                $this->line(($dry ? '[dry] ' : '') . "Widget #{$widget->id} config images remapped");
                if (! $dry) {
                    $widget->update(['config' => $config]);
                }
                $count++;
            }
        }

        return $count;
    }
}
