<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('screens', function (Blueprint $table) {
            $table->string('view_mode')->default('grid');
            $table->foreignId('featured_widget_id')
                ->nullable()
                ->constrained('widgets')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('screens', function (Blueprint $table) {
            $table->dropConstrainedForeignId('featured_widget_id');
            $table->dropColumn('view_mode');
        });
    }
};
