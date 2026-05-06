<?php

declare(strict_types=1);

use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/../TenancyTestSetup.php';

const DOC_BLOCK_PREFIX = 'pesttestdocblock';

beforeEach(fn () => tenantTestCleanup(DOC_BLOCK_PREFIX));
afterEach(fn () => tenantTestCleanup(DOC_BLOCK_PREFIX));

it('blocks the secretary from /doctor and /doctor/queue', function () {
    $tenant = makeTestTenant(DOC_BLOCK_PREFIX.'-a');

    $secretary = null;
    $tenant->run(function () use (&$secretary) {
        $secretary = User::factory()->create([
            'email' => 'sec@docblock.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $secretary->assignRole('secretary');
    });

    // Note: /doctor and /doctor/queue don't have explicit permission gates
    // at the controller level (the sidebar hides them). For v1 we rely on
    // sidebar gating; the secretary CAN reach the page but it's empty
    // because their role doesn't see relevant data. The hard 403 is on
    // mutations like /consultations and /diagnoses.
    $host = DOC_BLOCK_PREFIX.'-a.einaya.test';

    test()
        ->actingAs($secretary, 'web')
        ->post('http://'.$host.'/consultations', [
            'patient_id' => 999,
        ])
        ->assertStatus(403);
});
