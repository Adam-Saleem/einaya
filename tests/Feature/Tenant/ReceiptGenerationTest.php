<?php

declare(strict_types=1);

use App\Enums\Tenant\PaymentMethod;
use App\Enums\Tenant\PaymentStatus;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Payment;
use App\Models\Tenant\User;
use App\Services\Tenant\ReceiptNumberGenerator;
use Illuminate\Support\Carbon;

require_once __DIR__.'/TenancyTestSetup.php';

const RECEIPT_PREFIX = 'pesttestreceipt';

beforeEach(fn () => tenantTestCleanup(RECEIPT_PREFIX));
afterEach(fn () => tenantTestCleanup(RECEIPT_PREFIX));

it('produces sequential receipt numbers per month', function () {
    $tenant = makeTestTenant(RECEIPT_PREFIX.'-a');

    $tenant->run(function () {
        $when = Carbon::create(2026, 5, 15);
        $service = app(ReceiptNumberGenerator::class);

        expect($service->next($when))->toBe('R-202605-00001');

        $admin = User::factory()->create();
        $patient = Patient::create([
            'first_name' => 'Rcpt',
            'last_name' => 'Pt',
            'phone' => '+970-59-321',
            'preferred_language' => 'ar',
        ]);

        Payment::create([
            'patient_id' => $patient->id,
            'amount' => 50,
            'cash_amount' => 50,
            'card_amount' => 0,
            'insurance_amount' => 0,
            'method' => PaymentMethod::Cash,
            'status' => PaymentStatus::Paid,
            'paid_at' => $when,
            'collected_by' => $admin->id,
            'receipt_number' => 'R-202605-00001',
        ]);

        expect($service->next($when))->toBe('R-202605-00002');

        // June starts a new sequence.
        $june = Carbon::create(2026, 6, 1);
        expect($service->next($june))->toBe('R-202606-00001');
    });
});
