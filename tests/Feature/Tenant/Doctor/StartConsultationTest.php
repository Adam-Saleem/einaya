<?php

declare(strict_types=1);

use App\Actions\Tenant\StartConsultationAction;
use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Carbon;

require_once __DIR__.'/../TenancyTestSetup.php';

const START_PREFIX = 'pestteststart';

beforeEach(fn () => tenantTestCleanup(START_PREFIX));
afterEach(fn () => tenantTestCleanup(START_PREFIX));

it('transitions an arrived appointment to in_progress', function () {
    $tenant = makeTestTenant(START_PREFIX.'-a');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'A', 'last_name' => 'P',
            'phone' => '+970-59-1', 'preferred_language' => 'ar',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => Carbon::now(),
            'duration_minutes' => 30,
            'status' => AppointmentStatus::Arrived,
            'arrived_at' => Carbon::now()->subMinutes(5),
            'created_by' => $admin->id,
        ]);

        $consultation = app(StartConsultationAction::class)->execute(
            $patient,
            $doctor,
            $appointment,
            $admin,
        );

        expect($appointment->fresh()->status)->toBe(AppointmentStatus::InProgress);
        expect($consultation->started_at)->not->toBeNull();
        expect($consultation->ended_at)->toBeNull();
    });
});

it('creates a fresh appointment for walk-in consultations', function () {
    $tenant = makeTestTenant(START_PREFIX.'-walk');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'W', 'last_name' => 'X',
            'phone' => '+970-59-2', 'preferred_language' => 'ar',
        ]);

        $consultation = app(StartConsultationAction::class)->execute($patient, $doctor, null, $admin);

        expect($consultation->appointment_id)->not->toBeNull();
        expect($consultation->appointment->status)->toBe(AppointmentStatus::InProgress);
    });
});
