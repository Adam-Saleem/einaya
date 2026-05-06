<?php

declare(strict_types=1);

use App\Actions\Tenant\RecordPaymentAction;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Validation\ValidationException;

require_once __DIR__.'/TenancyTestSetup.php';

const PAY_PREFIX = 'pesttestpay';

beforeEach(fn () => tenantTestCleanup(PAY_PREFIX));
afterEach(fn () => tenantTestCleanup(PAY_PREFIX));

it('rejects mixed payments whose split does not equal amount', function () {
    $tenant = makeTestTenant(PAY_PREFIX.'-mixed');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $patient = Patient::create([
            'first_name' => 'M',
            'last_name' => 'X',
            'phone' => '+970599',
            'preferred_language' => 'ar',
        ]);

        expect(fn () => app(RecordPaymentAction::class)->execute([
            'patient_id' => $patient->id,
            'amount' => 100,
            'method' => 'mixed',
            'cash_amount' => 50,
            'card_amount' => 30,
            'insurance_amount' => 10,
        ], $admin))->toThrow(ValidationException::class);
    });
});

it('records a mixed payment with auto-generated receipt number', function () {
    $tenant = makeTestTenant(PAY_PREFIX.'-ok');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $patient = Patient::create([
            'first_name' => 'OK',
            'last_name' => 'P',
            'phone' => '+970599a',
            'preferred_language' => 'ar',
        ]);

        $payment = app(RecordPaymentAction::class)->execute([
            'patient_id' => $patient->id,
            'amount' => 100,
            'method' => 'mixed',
            'cash_amount' => 60,
            'card_amount' => 25,
            'insurance_amount' => 15,
        ], $admin);

        expect($payment->receipt_number)->toMatch('/^R-\d{6}-\d{5}$/');
        expect((float) $payment->cash_amount)->toBe(60.0);
        expect((float) $payment->card_amount)->toBe(25.0);
        expect((float) $payment->insurance_amount)->toBe(15.0);
    });
});
