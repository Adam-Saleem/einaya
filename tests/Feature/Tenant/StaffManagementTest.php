<?php

declare(strict_types=1);

use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const STAFF_PREFIX = 'pestteststaff';

beforeEach(fn () => tenantTestCleanup(STAFF_PREFIX));
afterEach(fn () => tenantTestCleanup(STAFF_PREFIX));

it('blocks the secretary from creating new staff', function () {
    $tenant = makeTestTenant(STAFF_PREFIX.'-block');

    /** @var User $secretary */
    $secretary = null;
    $tenant->run(function () use (&$secretary) {
        $secretary = User::factory()->create([
            'email' => 'sec@staff.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $secretary->assignRole('secretary');
    });

    $host = STAFF_PREFIX.'-block.einaya.test';

    $response = $this->actingAs($secretary, 'web')
        ->from('http://'.$host.'/')
        ->post('http://'.$host.'/staff', [
            'name' => 'New Staff',
            'email' => 'new@staff.test',
            'phone' => null,
            'role' => 'secretary',
            'is_active' => true,
        ]);

    $response->assertStatus(403);

    $tenant->run(function () {
        expect(User::where('email', 'new@staff.test')->exists())->toBeFalse();
    });
});

it('lets the clinic admin create + reset staff passwords', function () {
    $tenant = makeTestTenant(STAFF_PREFIX.'-allow');

    /** @var User $admin */
    $admin = null;
    $tenant->run(function () use (&$admin) {
        $admin = User::factory()->create([
            'email' => 'admin@staff.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole('clinic_admin');
    });

    $host = STAFF_PREFIX.'-allow.einaya.test';

    $this->actingAs($admin, 'web')
        ->from('http://'.$host.'/')
        ->post('http://'.$host.'/staff', [
            'name' => 'Reception Sara',
            'email' => 'sara@staff.test',
            'phone' => '+970-59-0000',
            'role' => 'secretary',
            'is_active' => true,
        ])
        ->assertRedirect();

    $tenant->run(function () {
        $created = User::where('email', 'sara@staff.test')->first();
        expect($created)->not->toBeNull();
        expect($created->hasRole('secretary'))->toBeTrue();
    });
});
