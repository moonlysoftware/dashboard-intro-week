<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('widgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('screen_id')->constrained()->onDelete('cascade');
            $table->string('widget_type'); // birthday, room_availability, clock_weather, announcements
            $table->json('config')->nullable(); // widget-specific configuration
            $table->integer('grid_col_span')->default(6); // 1-12 columns
            $table->integer('grid_row_span')->default(1); // row span
            $table->integer('grid_order')->default(0); // order in grid
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('widgets');
    }
};
