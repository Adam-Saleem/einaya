<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 7 audits include Clinic rows whose primary key is a string slug
 * (the stancl tenant_id). The original `auditable_id` was
 * unsignedBigInteger which is fine for users + numeric resources but
 * blows up the moment we log a Clinic event. Widening to string(64)
 * covers both numeric and UUID/slug primary keys.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('central_audit_logs', function (Blueprint $table) {
            $table->dropIndex(['auditable_type', 'auditable_id']);
        });

        Schema::table('central_audit_logs', function (Blueprint $table) {
            $table->string('auditable_id', 64)->nullable()->change();
        });

        Schema::table('central_audit_logs', function (Blueprint $table) {
            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    public function down(): void
    {
        Schema::table('central_audit_logs', function (Blueprint $table) {
            $table->dropIndex(['auditable_type', 'auditable_id']);
        });

        Schema::table('central_audit_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('auditable_id')->nullable()->change();
        });

        Schema::table('central_audit_logs', function (Blueprint $table) {
            $table->index(['auditable_type', 'auditable_id']);
        });
    }
};
