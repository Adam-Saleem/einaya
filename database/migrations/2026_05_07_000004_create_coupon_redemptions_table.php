<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupon_redemptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('coupon_id')->constrained()->cascadeOnDelete();
            // Tenant identifiers — clinic_id is a string on the central
            // tenants table (it's the clinic slug), so it's stored here
            // as a string column rather than a foreign-keyed unsignedBigInteger.
            $table->string('clinic_id', 64);
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();

            // The user who applied the coupon. Stored by id only — the user
            // lives in the tenant DB so we can't constrain it here.
            $table->unsignedBigInteger('redeemed_by_user_id')->nullable();

            // Snapshots so a deleted coupon's history stays meaningful.
            $table->unsignedInteger('applied_days');
            $table->foreignId('prior_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->foreignId('new_plan_id')->nullable()->constrained('subscription_plans')->nullOnDelete();
            $table->timestamp('prior_ends_at')->nullable();
            $table->timestamp('new_ends_at')->nullable();
            $table->timestamp('redeemed_at');
            $table->timestamps();

            // Each clinic can redeem each coupon only once.
            $table->unique(['coupon_id', 'clinic_id']);
            $table->index('clinic_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupon_redemptions');
    }
};
