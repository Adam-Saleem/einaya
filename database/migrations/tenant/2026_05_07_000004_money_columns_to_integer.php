<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') return;

        // Phase 24: every money column on the tenant DB flips from
        // decimal(10,2) to UNSIGNED INT. Existing demo values get
        // floored — accepted for v1.
        if (Schema::hasTable('payments')) {
            DB::statement('ALTER TABLE payments MODIFY amount INT UNSIGNED NOT NULL');
            DB::statement('ALTER TABLE payments MODIFY cash_amount INT UNSIGNED NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE payments MODIFY card_amount INT UNSIGNED NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE payments MODIFY insurance_amount INT UNSIGNED NOT NULL DEFAULT 0');
        }

        if (Schema::hasTable('clinic_services')) {
            DB::statement('ALTER TABLE clinic_services MODIFY price INT UNSIGNED NOT NULL');
        }

        if (Schema::hasTable('consultation_service')) {
            DB::statement('ALTER TABLE consultation_service MODIFY price_at_time INT UNSIGNED NOT NULL');
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') return;

        if (Schema::hasTable('payments')) {
            DB::statement('ALTER TABLE payments MODIFY amount DECIMAL(10,2) NOT NULL');
            DB::statement('ALTER TABLE payments MODIFY cash_amount DECIMAL(10,2) NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE payments MODIFY card_amount DECIMAL(10,2) NOT NULL DEFAULT 0');
            DB::statement('ALTER TABLE payments MODIFY insurance_amount DECIMAL(10,2) NOT NULL DEFAULT 0');
        }

        if (Schema::hasTable('clinic_services')) {
            DB::statement('ALTER TABLE clinic_services MODIFY price DECIMAL(10,2) NOT NULL');
        }

        if (Schema::hasTable('consultation_service')) {
            DB::statement('ALTER TABLE consultation_service MODIFY price_at_time DECIMAL(10,2) NOT NULL');
        }
    }
};
