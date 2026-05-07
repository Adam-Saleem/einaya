<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Per-clinic service catalogue. Each clinic owns its own list.
        Schema::create('clinic_services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('code', 60)->unique();
            $table->string('description', 500)->nullable();
            $table->decimal('price', 10, 2);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();
            $table->softDeletes();
        });

        // Append-only billing rows linked to a consultation. Snapshots
        // the service name + price so editing the catalogue later doesn't
        // rewrite past bills (mirrors the form_snapshot pattern).
        Schema::create('consultation_service', function (Blueprint $table) {
            $table->id();
            $table->foreignId('consultation_id')->constrained()->cascadeOnDelete();
            $table->foreignId('service_id')
                ->nullable()
                ->constrained('clinic_services')
                ->nullOnDelete();
            $table->string('service_name_snapshot', 120);
            $table->decimal('price_at_time', 10, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->index('consultation_id');
        });

        // Track whether this consultation is the patient's first visit
        // or a follow-up review. Drives base price on the receipt.
        Schema::table('consultations', function (Blueprint $table) {
            $table->enum('visit_type', ['first', 'review'])->nullable()->after('ended_at');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn('visit_type');
        });

        Schema::dropIfExists('consultation_service');
        Schema::dropIfExists('clinic_services');
    }
};
