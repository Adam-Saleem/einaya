<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('patients')) return;
        if (DB::connection()->getDriverName() !== 'mysql') return;

        DB::statement('ALTER TABLE patients ADD FULLTEXT INDEX patients_name_fulltext (first_name, last_name)');
    }

    public function down(): void
    {
        if (! Schema::hasTable('patients')) return;
        if (DB::connection()->getDriverName() !== 'mysql') return;

        DB::statement('ALTER TABLE patients DROP INDEX patients_name_fulltext');
    }
};
