<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinics', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name', 200);
            $table->string('slug', 60)->unique();
            $table->string('owner_name', 120);
            $table->string('owner_email', 191);
            $table->string('owner_phone', 30)->nullable();
            $table->string('status', 30)->default('pending');
            $table->json('branding')->nullable();
            $table->json('data')->nullable();
            $table->timestamp('trial_ends_at')->nullable();
            $table->unsignedBigInteger('subscription_id')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('subscription_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clinics');
    }
};
