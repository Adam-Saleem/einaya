<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('appointment_id')->nullable()
                ->constrained('appointments')->nullOnDelete();
            $table->foreignId('consultation_id')->nullable()
                ->constrained('consultations')->nullOnDelete();
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('method', 20);
            $table->decimal('insurance_amount', 10, 2)->default(0);
            $table->decimal('cash_amount', 10, 2)->default(0);
            $table->decimal('card_amount', 10, 2)->default(0);
            $table->string('status', 20)->default('paid');
            $table->string('receipt_number', 30)->unique();
            $table->text('notes')->nullable();
            $table->foreignId('collected_by')->constrained('users')->restrictOnDelete();
            $table->dateTime('paid_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('patient_id');
            $table->index('appointment_id');
            $table->index('consultation_id');
            $table->index('paid_at');
            $table->index('status');
            $table->index('collected_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
