<?php

declare(strict_types=1);

use App\Actions\Tenant\RegisterPatientAction;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const SIMPLE_PREFIX = 'pesttestsimple';

beforeEach(fn () => tenantTestCleanup(SIMPLE_PREFIX));
afterEach(fn () => tenantTestCleanup(SIMPLE_PREFIX));

it('splits a multi-word full_name into first + last', function () {
    $tenant = makeTestTenant(SIMPLE_PREFIX.'-multi');

    $tenant->run(function () {
        $admin = User::factory()->create([
            'email' => 'multi@simple.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $admin->assignRole('clinic_admin');

        $patient = app(RegisterPatientAction::class)->execute(
            ['full_name' => 'Layla Habash Khoury'],
            [],
            $admin,
        );

        expect($patient->first_name)->toBe('Layla');
        expect($patient->last_name)->toBe('Habash Khoury');
    });
});

it('duplicates the single-word full_name to last_name', function () {
    $tenant = makeTestTenant(SIMPLE_PREFIX.'-single');

    $tenant->run(function () {
        $admin = User::factory()->create([
            'email' => 'single@simple.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $admin->assignRole('clinic_admin');

        $patient = app(RegisterPatientAction::class)->execute(
            ['full_name' => 'Mohammad'],
            [],
            $admin,
        );

        expect($patient->first_name)->toBe('Mohammad');
        expect($patient->last_name)->toBe('Mohammad');
    });
});

it('creates a patient with only full_name via the controller (json response)', function () {
    $tenant = makeTestTenant(SIMPLE_PREFIX.'-json');

    $tenant->run(function () use ($tenant) {
        $admin = User::factory()->create([
            'email' => 'json@simple.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $admin->assignRole('clinic_admin');

        $host = $tenant->id.'.einaya.test';
        $response = test()
            ->actingAs($admin, 'web')
            ->postJson('http://'.$host.'/patients', [
                'full_name' => 'Sara Ahmad',
            ]);

        $response->assertCreated();
        $data = $response->json('patient');
        expect($data['name'])->toBe('Sara Ahmad');

        $patient = Patient::find($data['id']);
        expect($patient->first_name)->toBe('Sara');
        expect($patient->last_name)->toBe('Ahmad');
        expect($patient->phone)->toBe('');
    });
});

it('saves the new village + city columns', function () {
    $tenant = makeTestTenant(SIMPLE_PREFIX.'-village');

    $tenant->run(function () {
        $admin = User::factory()->create([
            'email' => 'village@simple.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $admin->assignRole('clinic_admin');

        $patient = app(RegisterPatientAction::class)->execute(
            [
                'full_name' => 'Ahmad Khalil',
                'city' => 'hebron',
                'village' => 'halhul',
            ],
            [],
            $admin,
        );

        expect($patient->city)->toBe('hebron');
        expect($patient->village)->toBe('halhul');
    });
});
