<?php

declare(strict_types=1);

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

require_once __DIR__.'/TenancyTestSetup.php';

const RESCHED_PREFIX = 'pesttestresched';

beforeEach(fn () => tenantTestCleanup(RESCHED_PREFIX));
afterEach(fn () => tenantTestCleanup(RESCHED_PREFIX));

it('reschedules an appointment via PATCH /appointments/{id}', function () {
    $tenant = makeTestTenant(RESCHED_PREFIX.'-a');

    $admin = null;
    $appointment = null;
    $tenant->run(function () use (&$admin, &$appointment) {
        $admin = User::factory()->create([
            'email' => 'admin@resched.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
            'preferred_language' => 'ar',
        ]);
        $admin->assignRole('clinic_admin');
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);

        $patient = Patient::create([
            'first_name' => 'P', 'last_name' => 'X',
            'phone' => '+97059666',
            'preferred_language' => 'ar',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => Carbon::tomorrow()->setTime(9, 0),
            'duration_minutes' => 30,
            'status' => AppointmentStatus::Confirmed,
            'created_by' => $admin->id,
        ]);
    });

    $newTime = Carbon::tomorrow()->setTime(15, 0);
    $host = RESCHED_PREFIX.'-a.einaya.test';

    test()
        ->actingAs($admin, 'web')
        ->from('http://'.$host.'/appointments')
        ->patch('http://'.$host.'/appointments/'.$appointment->id, [
            'scheduled_for' => $newTime->toIso8601String(),
            'force' => true,
        ])
        ->assertRedirect();

    $tenant->run(function () use ($appointment, $newTime) {
        $fresh = Appointment::find($appointment->id);
        expect($fresh->scheduled_for->format('H:i'))->toBe('15:00');
    });
});
