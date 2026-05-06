<?php

declare(strict_types=1);

use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const MATRIX_PREFIX = 'pesttestmatrix';

beforeEach(fn () => tenantTestCleanup(MATRIX_PREFIX));
afterEach(fn () => tenantTestCleanup(MATRIX_PREFIX));

it('blocks the secretary from doctor-only and admin-only index pages', function () {
    $tenant = makeTestTenant(MATRIX_PREFIX.'-a');

    $secretary = null;
    $tenant->run(function () use (&$secretary) {
        $secretary = User::factory()->create([
            'email' => 'sec@matrix.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $secretary->assignRole('secretary');
    });

    $host = MATRIX_PREFIX.'-a.einaya.test';

    // Secretary should be blocked on these.
    $blocked = [
        '/forms',
        '/doctor/profile',
        '/doctor/hours',
        '/settings',
    ];
    foreach ($blocked as $path) {
        test()
            ->actingAs($secretary, 'web')
            ->get('http://'.$host.$path)
            ->assertStatus(403);
    }

    // Secretary CAN reach these (per Phase 5 permissions).
    $allowed = [
        '/patients',
        '/appointments',
        '/payments',
        '/insurance-providers',
        '/reports',
        '/reception',
        '/consultations',
    ];
    foreach ($allowed as $path) {
        test()
            ->actingAs($secretary, 'web')
            ->get('http://'.$host.$path)
            ->assertOk();
    }
});
