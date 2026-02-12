<?php

namespace App\Providers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facedes\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        // Toggl API HTTP Macro
        Http::macro('toggl', function () {
            return Http::withHeaders([
                'Content-Type' => 'application/json',
            ])->withBasicAuth(config('services.toggl.api_token'), 'api_token')
              ->baseUrl('https://api.track.toggl.com');
        });
    }
}
