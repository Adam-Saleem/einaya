<?php

declare(strict_types=1);

use App\Actions\Tenant\CompleteConsultationAction;
use App\Actions\Tenant\StartConsultationAction;
use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Carbon;

require_once __DIR__.'/../TenancyTestSetup.php';

const COMPLETE_PREFIX = 'pesttestcomplete';

beforeEach(fn () => tenantTestCleanup(COMPLETE_PREFIX));
afterEach(fn () => tenantTestCleanup(COMPLETE_PREFIX));

it('marks consultation ended and appointment completed', function () {
    $tenant = makeTestTenant(COMPLETE_PREFIX.'-a');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'C', 'last_name' => 'D',
            'phone' => '+970-59-3', 'preferred_language' => 'ar',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => Carbon::now(),
            'duration_minutes' => 30,
            'status' => AppointmentStatus::Arrived,
            'arrived_at' => Carbon::now(),
            'created_by' => $admin->id,
        ]);

        $consultation = app(StartConsultationAction::class)->execute($patient, $doctor, $appointment, $admin);
        app(CompleteConsultationAction::class)->execute($consultation, $admin);

        expect($consultation->fresh()->ended_at)->not->toBeNull();
        expect($appointment->fresh()->status)->toBe(AppointmentStatus::Completed);
    });
});
