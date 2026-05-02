<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('clinic_id');
            $table->string('opened_by_email', 191);
            $table->string('subject', 200);
            $table->text('body');
            $table->string('status', 30)->default('open');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('clinic_id')
                ->references('id')->on('clinics')
                ->cascadeOnDelete();

            $table->index('clinic_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
