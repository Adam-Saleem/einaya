<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('diagnoses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained('consultations')->restrictOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->string('code', 30)->nullable();
            $table->string('description', 255);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('consultation_id');
            $table->index('patient_id');
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('diagnoses');
    }
};
