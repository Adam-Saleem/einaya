<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('form_questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_section_id')->constrained('form_sections')->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('label', 255);
            $table->text('help_text')->nullable();
            $table->string('type', 20);
            $table->boolean('is_required')->default(false);
            $table->json('validation_rules')->nullable();
            $table->json('conditions')->nullable();
            $table->unsignedInteger('order')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('form_section_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_questions');
    }
};
