<?php

declare(strict_types=1);

use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const SEC_BLOCK_PREFIX = 'pesttestsecblock';

beforeEach(fn () => tenantTestCleanup(SEC_BLOCK_PREFIX));
afterEach(fn () => tenantTestCleanup(SEC_BLOCK_PREFIX));

it('returns 403 for /forms when accessed as secretary', function () {
    $tenant = makeTestTenant(SEC_BLOCK_PREFIX.'-a');

    $secretary = null;
    $tenant->run(function () use (&$secretary) {
        $secretary = User::factory()->create([
            'email' => 'sec@block.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $secretary->assignRole('secretary');
    });

    $host = SEC_BLOCK_PREFIX.'-a.einaya.test';

    test()
        ->actingAs($secretary, 'web')
        ->get('http://'.$host.'/forms')
        ->assertStatus(403);
});

it('lets secretaries reach the patients + appointments + payments routes', function () {
    $tenant = makeTestTenant(SEC_BLOCK_PREFIX.'-b');

    $secretary = null;
    $tenant->run(function () use (&$secretary) {
        $secretary = User::factory()->create([
            'email' => 'sec2@block.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $secretary->assignRole('secretary');
    });

    $host = SEC_BLOCK_PREFIX.'-b.einaya.test';

    foreach (['/patients', '/appointments', '/payments', '/reception'] as $path) {
        test()
            ->actingAs($secretary, 'web')
            ->get('http://'.$host.$path)
            ->assertOk();
    }
});
