<?php

declare(strict_types=1);

use App\Enums\Tenant\PaymentMethod;
use App\Enums\Tenant\PaymentStatus;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Payment;
use App\Models\Tenant\User;
use App\Services\Tenant\ReportService;
use Illuminate\Support\Carbon;

require_once __DIR__.'/TenancyTestSetup.php';

const REPORTS_PREFIX = 'pesttestreports';

beforeEach(fn () => tenantTestCleanup(REPORTS_PREFIX));
afterEach(fn () => tenantTestCleanup(REPORTS_PREFIX));

it('aggregates revenue by payment method over a date range', function () {
    $tenant = makeTestTenant(REPORTS_PREFIX.'-a');

    $tenant->run(function () {
        Doctor::factory()->create(['user_id' => User::factory()->create()->id]);
        $patient = Patient::create([
            'first_name' => 'Test',
            'last_name' => 'Pay',
            'phone' => '+970-59-2222',
            'preferred_language' => 'ar',
        ]);

        Payment::create([
            'patient_id' => $patient->id,
            'amount' => 100,
            'cash_amount' => 100,
            'card_amount' => 0,
            'insurance_amount' => 0,
            'method' => PaymentMethod::Cash,
            'status' => PaymentStatus::Paid,
            'paid_at' => Carbon::now(),
            'collected_by' => 1,
            'receipt_number' => 'TEST-001',
        ]);
        Payment::create([
            'patient_id' => $patient->id,
            'amount' => 250,
            'cash_amount' => 0,
            'card_amount' => 250,
            'insurance_amount' => 0,
            'method' => PaymentMethod::Card,
            'status' => PaymentStatus::Paid,
            'paid_at' => Carbon::now(),
            'collected_by' => 1,
            'receipt_number' => 'TEST-002',
        ]);

        $result = app(ReportService::class)->revenue(
            Carbon::now()->subDay(),
            Carbon::now()->addDay(),
        );

        expect($result['totals']['amount'])->toBe(350.0);
        expect($result['totals']['cash'])->toBe(100.0);
        expect($result['totals']['card'])->toBe(250.0);
        expect($result['rows'])->toHaveCount(2);
    });
});
