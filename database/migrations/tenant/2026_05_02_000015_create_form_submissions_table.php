<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('form_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('medical_form_id')->nullable()
                ->constrained('medical_forms')->nullOnDelete();
            $table->foreignId('consultation_id')->nullable()
                ->constrained('consultations')->nullOnDelete();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->restrictOnDelete();
            $table->json('form_snapshot');
            $table->json('answers_snapshot');
            $table->dateTime('submitted_at');
            $table->timestamps();
            $table->softDeletes();

            $table->index('patient_id');
            $table->index('consultation_id');
            $table->index('medical_form_id');
            $table->index('doctor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_submissions');
    }
};
