<?php

declare(strict_types=1);

use App\Models\Tenant\Patient;
use App\Models\Tenant\User as TenantUser;
use Database\Seeders\Tenant\TenantDemoSeeder;

require_once __DIR__.'/TenancyTestSetup.php';

const ISO_PREFIX = 'pesttestiso';
const ISO_TENANT_A = 'pesttestiso-a';
const ISO_TENANT_B = 'pesttestiso-b';

beforeEach(fn () => tenantTestCleanup(ISO_PREFIX));
afterEach(fn () => tenantTestCleanup(ISO_PREFIX));

/**
 * The single most important test in the codebase. If this test ever passes
 * while clinic A's data is visible inside clinic B (or vice versa), the
 * tenancy guarantee is broken and the bug must be fixed immediately.
 */
it('isolates patient data between two tenants', function () {
    $tenantA = makeTestTenant(ISO_TENANT_A);
    $tenantB = makeTestTenant(ISO_TENANT_B);

    // Seed both tenants explicitly (auto-seed is disabled in testing env).
    foreach ([$tenantA, $tenantB] as $tenant) {
        $tenant->run(function (): void {
            (new TenantDemoSeeder())->setContainer(app())->run();
        });
    }

    // Both tenants seeded the same number of patients independently.
    $tenantA->run(fn () => expect(Patient::count())->toBe(20));
    $tenantB->run(fn () => expect(Patient::count())->toBe(20));

    // Create a patient in A; it must not appear in B.
    $tenantA->run(function (): void {
        $secretary = TenantUser::where('email', 'like', 'secretary@%')->first();
        Patient::create([
            'first_name' => 'IsolationCheck',
            'last_name' => 'TenantA',
            'phone' => '+970-59-111-2222',
            'preferred_language' => 'ar',
            'registered_by' => $secretary?->id,
        ]);
    });

    $tenantA->run(function (): void {
        expect(Patient::count())->toBe(21)
            ->and(Patient::where('first_name', 'IsolationCheck')->exists())->toBeTrue();
    });

    $tenantB->run(function (): void {
        expect(Patient::count())->toBe(20)
            ->and(Patient::where('first_name', 'IsolationCheck')->exists())->toBeFalse();
    });

    // Symmetric: create one in B; A must not see it.
    $tenantB->run(function (): void {
        $secretary = TenantUser::where('email', 'like', 'secretary@%')->first();
        Patient::create([
            'first_name' => 'IsolationCheck',
            'last_name' => 'TenantB',
            'phone' => '+970-59-333-4444',
            'preferred_language' => 'ar',
            'registered_by' => $secretary?->id,
        ]);
    });

    $tenantB->run(function (): void {
        expect(Patient::where('last_name', 'TenantB')->exists())->toBeTrue();
    });

    $tenantA->run(function (): void {
        expect(Patient::where('last_name', 'TenantB')->exists())->toBeFalse();
    });
});
