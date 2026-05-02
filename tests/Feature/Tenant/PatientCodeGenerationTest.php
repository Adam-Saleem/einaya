<?php

declare(strict_types=1);

use App\Models\Tenant\Patient;

require_once __DIR__.'/TenancyTestSetup.php';

const CODE_PREFIX = 'pesttestcode';
const CODE_TENANT_A = 'pesttestcode-a';
const CODE_TENANT_B = 'pesttestcode-b';

beforeEach(fn () => tenantTestCleanup(CODE_PREFIX));
afterEach(fn () => tenantTestCleanup(CODE_PREFIX));

it('generates sequential patient codes per tenant', function () {
    $tenantA = makeTestTenant(CODE_TENANT_A);
    $tenantB = makeTestTenant(CODE_TENANT_B);

    $codesA = [];
    $tenantA->run(function () use (&$codesA): void {
        for ($i = 0; $i < 3; $i++) {
            $codesA[] = Patient::create([
                'first_name' => 'A'.$i,
                'last_name' => 'Test',
                'phone' => '+970-59-000-000'.$i,
                'preferred_language' => 'ar',
            ])->patient_code;
        }
    });

    $codesB = [];
    $tenantB->run(function () use (&$codesB): void {
        for ($i = 0; $i < 2; $i++) {
            $codesB[] = Patient::create([
                'first_name' => 'B'.$i,
                'last_name' => 'Test',
                'phone' => '+970-59-111-000'.$i,
                'preferred_language' => 'ar',
            ])->patient_code;
        }
    });

    expect($codesA)->toEqual(['P-00001', 'P-00002', 'P-00003']);
    // Counter is per-tenant — tenant B starts at P-00001 too.
    expect($codesB)->toEqual(['P-00001', 'P-00002']);
});

it('skips already-deleted IDs when computing the next code', function () {
    $tenant = makeTestTenant('pesttestcode-skip');

    $tenant->run(function (): void {
        $first = Patient::create([
            'first_name' => 'First',
            'last_name' => 'Patient',
            'phone' => '+970-59-000-1111',
            'preferred_language' => 'ar',
        ]);

        // Soft delete the first patient — generator must NOT reuse the slot.
        $first->delete();

        $next = Patient::create([
            'first_name' => 'Second',
            'last_name' => 'Patient',
            'phone' => '+970-59-000-2222',
            'preferred_language' => 'ar',
        ]);

        expect($next->patient_code)->toBe('P-00002');
    });
});
