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

const PHASE25_PREFIX = 'pesttestphase25';

beforeEach(fn () => tenantTestCleanup(PHASE25_PREFIX));
afterEach(fn () => tenantTestCleanup(PHASE25_PREFIX));

it('renders the redesigned reception with bucket counts', function () {
    $tenant = makeTestTenant(PHASE25_PREFIX.'-rec');

    $secretary = null;
    $tenant->run(function () use (&$secretary) {
        $secretary = User::factory()->create([
            'email' => 'sec@p25.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $secretary->assignRole('secretary');

        $doctorUser = User::factory()->create(['email' => 'doc@p25.test']);
        $doctorUser->assignRole('doctor');
        $doctor = Doctor::factory()->create(['user_id' => $doctorUser->id]);

        $today = Carbon::today();
        // 2 scheduled, 1 waiting, 1 engaged, 1 checkout
        foreach ([
            ['status' => AppointmentStatus::Pending, 'time' => $today->copy()->setTime(9, 0)],
            ['status' => AppointmentStatus::Confirmed, 'time' => $today->copy()->setTime(9, 30)],
            ['status' => AppointmentStatus::Arrived, 'time' => $today->copy()->setTime(10, 0)],
            ['status' => AppointmentStatus::InProgress, 'time' => $today->copy()->setTime(10, 30)],
            ['status' => AppointmentStatus::Completed, 'time' => $today->copy()->setTime(11, 0)],
        ] as $row) {
            $patient = Patient::factory()->create();
            Appointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'scheduled_for' => $row['time'],
                'status' => $row['status'],
                'created_by' => $secretary->id,
            ]);
        }
    });

    $host = PHASE25_PREFIX.'-rec.einaya.test';

    test()
        ->actingAs($secretary, 'web')
        ->get('http://'.$host.'/reception')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tenant/Reception/Dashboard')
            ->where('counts.scheduled', 2)
            ->where('counts.waiting', 1)
            ->where('counts.engaged', 1)
            ->where('counts.checkout', 1)
            ->where('counts.cancelled', 0)
            ->has('appointments', 5)
        );
});

it('renders the redesigned doctor dashboard with three buckets', function () {
    $tenant = makeTestTenant(PHASE25_PREFIX.'-doc');

    $doctorUser = null;
    $tenant->run(function () use (&$doctorUser) {
        $doctorUser = User::factory()->create([
            'email' => 'doc2@p25.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $doctorUser->assignRole('doctor');
        $doctor = Doctor::factory()->create(['user_id' => $doctorUser->id]);

        $today = Carbon::today();
        foreach ([
            ['status' => AppointmentStatus::Arrived, 'time' => $today->copy()->setTime(9, 0)],
            ['status' => AppointmentStatus::Arrived, 'time' => $today->copy()->setTime(9, 30)],
            ['status' => AppointmentStatus::InProgress, 'time' => $today->copy()->setTime(10, 0)],
            ['status' => AppointmentStatus::Completed, 'time' => $today->copy()->setTime(11, 0)],
        ] as $row) {
            $patient = Patient::factory()->create();
            Appointment::factory()->create([
                'patient_id' => $patient->id,
                'doctor_id' => $doctor->id,
                'scheduled_for' => $row['time'],
                'arrived_at' => $row['status'] === AppointmentStatus::Arrived
                    ? $row['time']->copy()->subMinutes(5)
                    : null,
                'status' => $row['status'],
                'created_by' => $doctorUser->id,
            ]);
        }
    });

    $host = PHASE25_PREFIX.'-doc.einaya.test';

    test()
        ->actingAs($doctorUser, 'web')
        ->get('http://'.$host.'/doctor?window=3d')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Tenant/Doctor/Dashboard')
            ->has('waiting', 2)
            ->has('inProgress', 1)
            ->has('checkout', 1)
        );
});

it('returns the patient profile JSON for the details modal', function () {
    $tenant = makeTestTenant(PHASE25_PREFIX.'-prof');

    $secretary = null;
    $patientId = null;
    $tenant->run(function () use (&$secretary, &$patientId) {
        $secretary = User::factory()->create([
            'email' => 'sec3@p25.test',
            'password' => Hash::make('Pass#0000'),
            'is_active' => true,
        ]);
        $secretary->assignRole('secretary');

        $patient = Patient::factory()->create([
            'first_name' => 'Sara',
            'last_name' => 'Khalil',
            'phone' => '0599000000',
        ]);
        $patientId = $patient->id;
    });

    $host = PHASE25_PREFIX.'-prof.einaya.test';

    test()
        ->actingAs($secretary, 'web')
        ->getJson('http://'.$host."/patients/{$patientId}/profile")
        ->assertOk()
        ->assertJsonPath('patient.full_name', 'Sara Khalil')
        ->assertJsonStructure([
            'patient' => ['id', 'full_name', 'phone'],
            'history',
        ]);
});
