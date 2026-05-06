<?php

declare(strict_types=1);

use App\Actions\Tenant\RegisterPatientAction;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const REG_PREFIX = 'pesttestreg';

beforeEach(fn () => tenantTestCleanup(REG_PREFIX));
afterEach(fn () => tenantTestCleanup(REG_PREFIX));

it('creates a patient with normalized phone and auto-generated code', function () {
    $tenant = makeTestTenant(REG_PREFIX.'-create');

    $tenant->run(function () {
        $admin = User::factory()->create([
            'email' => 'admin@reg.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole('clinic_admin');

        $patient = app(RegisterPatientAction::class)->execute([
            'first_name' => 'Lina',
            'last_name' => 'Habash',
            'phone' => '+970 (599) 991-1111',
            'gender' => 'female',
            'preferred_language' => 'ar',
        ], [], $admin);

        expect($patient->patient_code)->toMatch('/^P-\d{5}$/');
        expect($patient->phone)->toBe('+9705999911111');
    });
});

it('flags duplicate phone via the controller', function () {
    $tenant = makeTestTenant(REG_PREFIX.'-dup');

    $tenant->run(function () {
        $admin = User::factory()->create([
            'email' => 'dup@reg.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole('clinic_admin');

        $existing = app(RegisterPatientAction::class)->execute([
            'first_name' => 'Existing',
            'last_name' => 'Patient',
            'phone' => '+970-59-7777-7777',
            'gender' => 'male',
        ], [], $admin);

        $host = REG_PREFIX.'-dup.einaya.test';

        test()
            ->actingAs($admin, 'web')
            ->from('http://'.$host.'/patients')
            ->post('http://'.$host.'/patients', [
                'first_name' => 'Maybe',
                'last_name' => 'Same',
                'phone' => '+970 59 7777 7777',
                'gender' => 'male',
            ])
            ->assertSessionHasErrors(['phone' => 'phone_duplicate']);

        // Force flag bypasses the guard.
        test()
            ->actingAs($admin, 'web')
            ->from('http://'.$host.'/patients')
            ->post('http://'.$host.'/patients', [
                'first_name' => 'Definitely',
                'last_name' => 'Different',
                'phone' => '+970 59 7777 7777',
                'gender' => 'male',
                'force_duplicate_phone' => true,
            ])
            ->assertRedirect();

        expect(Patient::where('first_name', 'Definitely')->exists())->toBeTrue();
    });
});
