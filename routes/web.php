<?php

use App\Http\Controllers\DisplayController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScreenController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\WidgetController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Screen Management Routes
    Route::resource('screens', ScreenController::class);

    // Screen Layout Route
    Route::patch('screens/{screen}/layout', [ScreenController::class, 'updateLayout'])->name('screens.updateLayout');

    // Widget Management Routes
    Route::post('screens/{screen}/widgets', [WidgetController::class, 'store'])->name('widgets.store');
    Route::patch('widgets/{widget}', [WidgetController::class, 'update'])->name('widgets.update');
    Route::delete('widgets/{widget}', [WidgetController::class, 'destroy'])->name('widgets.destroy');

    // Settings Routes
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('settings', [SettingController::class, 'update'])->name('settings.update');
});

// Public Display Routes (no authentication)
Route::get('/display/{screen}', [DisplayController::class, 'show'])->name('display.show');
Route::get('/api/display/{screen}/data', [DisplayController::class, 'data'])->name('display.data');

require __DIR__.'/auth.php';
