<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('patients', function (Blueprint $table) {
            $table->id();
            $table->string('patient_code', 20)->unique();
            $table->string('first_name', 120);
            $table->string('last_name', 120);
            $table->string('national_id', 30)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender', 10)->nullable();
            $table->string('marital_status', 15)->nullable();
            $table->string('occupation', 120)->nullable();
            $table->string('preferred_language', 5)->default('ar');

            $table->string('phone', 30);
            $table->string('phone_alt', 30)->nullable();
            $table->string('email', 191)->nullable();
            $table->string('address', 255)->nullable();
            $table->string('city', 100)->nullable();

            $table->string('emergency_name', 120)->nullable();
            $table->string('emergency_phone', 30)->nullable();
            $table->string('emergency_relation', 60)->nullable();

            $table->string('blood_type', 5)->nullable();
            $table->text('allergies_summary')->nullable();
            $table->text('chronic_summary')->nullable();
            $table->text('medications_summary')->nullable();

            $table->boolean('has_insurance')->default(false);
            $table->foreignId('insurance_provider_id')->nullable()
                ->constrained('insurance_providers')->nullOnDelete();
            $table->string('insurance_policy_number', 60)->nullable();

            $table->string('profile_photo_path', 500)->nullable();
            $table->text('notes')->nullable();
            $table->string('referred_by', 120)->nullable();

            $table->foreignId('registered_by')->nullable()
                ->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->index('phone');
            $table->index('national_id');
            $table->index(['first_name', 'last_name']);
            $table->index('registered_by');
            $table->index('has_insurance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patients');
    }
};
