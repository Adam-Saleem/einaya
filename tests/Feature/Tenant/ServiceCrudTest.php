<?php

declare(strict_types=1);

use App\Models\Tenant\Service;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const SVC_PREFIX = 'pesttestsvc';

beforeEach(fn () => tenantTestCleanup(SVC_PREFIX));
afterEach(fn () => tenantTestCleanup(SVC_PREFIX));

it('lets a clinic admin create + edit + archive a service', function () {
    $tenant = makeTestTenant(SVC_PREFIX.'-admin');

    $tenant->run(function () use ($tenant) {
        $admin = User::factory()->create([
            'email' => 'svc-admin@test.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $admin->assignRole('clinic_admin');

        $host = $tenant->id.'.einaya.test';

        // create
        test()
            ->actingAs($admin, 'web')
            ->post('http://'.$host.'/services', [
                'name' => 'X-Ray Chest',
                'price' => 60,
                'is_active' => true,
            ])
            ->assertRedirect();

        $service = Service::query()->first();
        expect($service)->not->toBeNull();
        expect($service->name)->toBe('X-Ray Chest');
        expect($service->code)->toBe('x-ray-chest');
        expect((int) $service->price)->toBe(60);

        // update
        test()
            ->actingAs($admin, 'web')
            ->patch('http://'.$host.'/services/'.$service->id, [
                'price' => 75,
                'is_active' => false,
            ])
            ->assertRedirect();

        $service->refresh();
        expect((int) $service->price)->toBe(75);
        expect($service->is_active)->toBeFalse();

        // soft-delete
        test()
            ->actingAs($admin, 'web')
            ->delete('http://'.$host.'/services/'.$service->id)
            ->assertRedirect();

        expect(Service::query()->find($service->id))->toBeNull();
        expect(Service::withTrashed()->find($service->id))->not->toBeNull();
    });
});

it('blocks the secretary from /services', function () {
    $tenant = makeTestTenant(SVC_PREFIX.'-perm');

    $tenant->run(function () use ($tenant) {
        $secretary = User::factory()->create([
            'email' => 'svc-sec@test.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $secretary->assignRole('secretary');

        $host = $tenant->id.'.einaya.test';

        test()
            ->actingAs($secretary, 'web')
            ->get('http://'.$host.'/services')
            ->assertStatus(403);
    });
});
