<?php

use App\Http\Controllers\AgendaEventController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\DisplayController;
use App\Http\Controllers\ImageUploadController;
use App\Http\Controllers\OverlayController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScreenController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\WidgetController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('screens.index');
    }

    return redirect()->route('login');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Screen Management Routes
    Route::resource('screens', ScreenController::class)->except(['create', 'edit', 'show']);

    // Screen Layout Route
    Route::patch('screens/{screen}/layout', [ScreenController::class, 'updateLayout'])->name('screens.updateLayout');

    // Screen Config Route
    Route::patch('screens/{screen}/config', [ScreenController::class, 'updateConfig'])->name('screens.updateConfig');

    // Widget Management Routes
    Route::post('screens/{screen}/widgets', [WidgetController::class, 'store'])->name('widgets.store');
    Route::patch('widgets/{widget}', [WidgetController::class, 'update'])->name('widgets.update');
    Route::delete('widgets/{widget}', [WidgetController::class, 'destroy'])->name('widgets.destroy');
    Route::get('announcement-slides', [WidgetController::class, 'announcementSlides'])->name('announcement-slides.index');

    // Overlay (global meeting room bar for slideshow & general displays)
    Route::patch('overlay', [OverlayController::class, 'update'])->name('overlay.update');

    // Settings Routes
    Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
    Route::post('settings', [SettingController::class, 'update'])->name('settings.update');

    // Image Widget Upload Routes
    Route::get('image-widget/images', [ImageUploadController::class, 'index'])->name('image-widget.index');
    Route::post('image-widget/upload', [ImageUploadController::class, 'store'])->name('image-widget.store');
    Route::delete('image-widget/images/{filename}', [ImageUploadController::class, 'destroy'])->name('image-widget.destroy');

    // Agenda Events (central event library)
    Route::get('agenda-events', [AgendaEventController::class, 'index'])->name('agenda-events.index');
    Route::post('agenda-events', [AgendaEventController::class, 'store'])->name('agenda-events.store');
    Route::patch('agenda-events/{agendaEvent}', [AgendaEventController::class, 'update'])->name('agenda-events.update');
    Route::delete('agenda-events/{agendaEvent}', [AgendaEventController::class, 'destroy'])->name('agenda-events.destroy');

    // Announcements (central announcement library)
    Route::get('announcements', [AnnouncementController::class, 'index'])->name('announcements.index');
    Route::post('announcements', [AnnouncementController::class, 'store'])->name('announcements.store');
    Route::patch('announcements/{announcement}', [AnnouncementController::class, 'update'])->name('announcements.update');
    Route::delete('announcements/{announcement}', [AnnouncementController::class, 'destroy'])->name('announcements.destroy');

    // Birthday People
    Route::get('birthday-people', [PersonController::class, 'index'])->name('birthday-people.index');
    Route::post('birthday-people', [PersonController::class, 'store'])->name('birthday-people.store');
    Route::post('birthday-people/{person}', [PersonController::class, 'update'])->name('birthday-people.update');
    Route::delete('birthday-people/{person}', [PersonController::class, 'destroy'])->name('birthday-people.destroy');
});

// Public Display Routes (no authentication)
Route::get('/display/{screen}', [DisplayController::class, 'show'])->name('display.show');
Route::get('/api/display/{screen}/data', [DisplayController::class, 'data'])->name('display.data');

require __DIR__.'/auth.php';
