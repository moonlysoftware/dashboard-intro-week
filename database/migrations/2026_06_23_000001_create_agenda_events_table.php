<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agenda_events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('when_label');   // Display string, e.g. "vr 25 sept" or "06 okt – 10 okt"
            $table->date('when_date')->nullable();  // For sorting / upcoming filter
            $table->string('location')->nullable();
            $table->text('tagline')->nullable();
            $table->string('accent', 30)->default('#6C52FF');
            $table->string('grad')->nullable();
            $table->string('photo')->nullable();
            $table->string('pos', 100)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agenda_events');
    }
};
