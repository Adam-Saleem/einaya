<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demo_requests', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_name');
            $table->string('contact_name');
            $table->string('email');
            // E.164 (e.g. +970590000000) so wa.me deep-links work directly.
            $table->string('phone', 32);
            // ISO-3166-1 alpha-2; mirrors the country picker on the form.
            $table->string('country', 2)->nullable();
            $table->enum('intent', ['demo', 'register'])->default('demo');
            $table->text('message')->nullable();

            $table->boolean('is_handled')->default(false);
            $table->timestamp('handled_at')->nullable();
            $table->unsignedBigInteger('handled_by')->nullable();

            $table->text('notes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 500)->nullable();

            $table->timestamps();

            $table->index(['is_handled', 'created_at']);
            $table->index('intent');
            $table->index('country');
            $table->foreign('handled_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_requests');
    }
};
