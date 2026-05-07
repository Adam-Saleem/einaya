<?php

declare(strict_types=1);

use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const FLAGS_PREFIX = 'pesttestflags';

beforeEach(fn () => tenantTestCleanup(FLAGS_PREFIX));
afterEach(fn () => tenantTestCleanup(FLAGS_PREFIX));

it('lets the doctor patch allergies + chronic via medical-flags endpoint', function () {
    $tenant = makeTestTenant(FLAGS_PREFIX.'-doctor');

    $tenant->run(function () use ($tenant) {
        $doctor = User::factory()->create([
            'email' => 'doc@flags.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $doctor->assignRole('doctor');

        $patient = Patient::factory()->create([
            'allergies_summary' => null,
            'chronic_summary' => null,
        ]);

        $host = $tenant->id.'.einaya.test';
        test()
            ->actingAs($doctor, 'web')
            ->patch('http://'.$host.'/patients/'.$patient->id.'/medical-flags', [
                'allergies_summary' => 'Penicillin, peanuts',
                'chronic_summary' => 'Type 2 diabetes',
            ])
            ->assertRedirect();

        $patient->refresh();
        expect($patient->allergies_summary)->toBe('Penicillin, peanuts');
        expect($patient->chronic_summary)->toBe('Type 2 diabetes');
    });
});

it('lets a secretary record medical flags too — both roles need fast access', function () {
    $tenant = makeTestTenant(FLAGS_PREFIX.'-sec');

    $tenant->run(function () use ($tenant) {
        $secretary = User::factory()->create([
            'email' => 'sec@flags.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $secretary->assignRole('secretary');

        $patient = Patient::factory()->create();

        // Secretary has patients.update so they CAN actually edit. The
        // endpoint follows the same permission. This test confirms the
        // endpoint works when the secretary updates a patient through
        // the registration flow (existing) — but for a doctor-only
        // policy override, we'd add a stricter guard. For v1 we accept
        // that anyone with patients.update can record flags.
        $host = $tenant->id.'.einaya.test';
        test()
            ->actingAs($secretary, 'web')
            ->patch('http://'.$host.'/patients/'.$patient->id.'/medical-flags', [
                'allergies_summary' => 'Latex',
            ])
            ->assertRedirect();

        expect($patient->fresh()->allergies_summary)->toBe('Latex');
    });
});
