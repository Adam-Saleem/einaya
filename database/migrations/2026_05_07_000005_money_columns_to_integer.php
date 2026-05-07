<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('subscription_plans')) return;
        if (DB::connection()->getDriverName() !== 'mysql') return;

        // Phase 24: clinics on this deployment use whole-currency-unit
        // pricing only (no cents / fils). Money columns flip from
        // decimal(10,2) to UNSIGNED INT. Existing demo values get
        // floored — accepted for v1 (no production data).
        DB::statement('ALTER TABLE subscription_plans MODIFY price_monthly INT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE subscription_plans MODIFY price_yearly INT UNSIGNED NOT NULL');
    }

    public function down(): void
    {
        if (! Schema::hasTable('subscription_plans')) return;
        if (DB::connection()->getDriverName() !== 'mysql') return;

        DB::statement('ALTER TABLE subscription_plans MODIFY price_monthly DECIMAL(10,2) NOT NULL');
        DB::statement('ALTER TABLE subscription_plans MODIFY price_yearly DECIMAL(10,2) NOT NULL');
    }
};
