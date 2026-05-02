<?php

declare(strict_types=1);

use App\Enums\Tenant\PatientGender;
use App\Models\Tenant\Patient;

require_once __DIR__.'/TenancyTestSetup.php';

const FACTORY_PREFIX = 'pesttestfactory';

beforeEach(fn () => tenantTestCleanup(FACTORY_PREFIX));
afterEach(fn () => tenantTestCleanup(FACTORY_PREFIX));

it('produces valid records via the patient factory', function () {
    $tenant = makeTestTenant('pesttestfactory-1');

    $tenant->run(function (): void {
        $patients = Patient::factory()->count(5)->create();

        expect($patients)->toHaveCount(5);

        foreach ($patients as $patient) {
            expect($patient->patient_code)->toMatch('/^P-\d{5}$/')
                ->and($patient->first_name)->not->toBeEmpty()
                ->and($patient->last_name)->not->toBeEmpty()
                ->and($patient->phone)->not->toBeEmpty()
                ->and($patient->gender)->toBeInstanceOf(PatientGender::class);
        }

        // Codes are unique across the batch.
        expect($patients->pluck('patient_code')->unique()->count())->toBe(5);
    });
});
