<?php

declare(strict_types=1);

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User as TenantUser;

require_once __DIR__.'/TenancyTestSetup.php';

const STATUS_PREFIX = 'pestteststatus';

beforeEach(fn () => tenantTestCleanup(STATUS_PREFIX));
afterEach(fn () => tenantTestCleanup(STATUS_PREFIX));

it('casts appointment status as the enum and tracks transitions', function () {
    $tenant = makeTestTenant('pestteststatus-1');

    $tenant->run(function (): void {
        $user = TenantUser::create([
            'name' => 'Dr. Status',
            'email' => 'status-doc@example.test',
            'password' => 'hashed-not-real',
        ]);
        $doctor = Doctor::create([
            'user_id' => $user->id,
            'specialty' => 'General Medicine',
        ]);
        $patient = Patient::create([
            'first_name' => 'Status',
            'last_name' => 'Patient',
            'phone' => '+970-59-000-7777',
            'preferred_language' => 'ar',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => now()->addDay(),
            'status' => AppointmentStatus::Pending,
            'created_by' => $user->id,
        ]);

        expect($appointment->status)->toBeInstanceOf(AppointmentStatus::class)
            ->and($appointment->status)->toBe(AppointmentStatus::Pending)
            ->and($appointment->status->isTerminal())->toBeFalse();

        $appointment->update(['status' => AppointmentStatus::Confirmed]);
        $appointment->update(['status' => AppointmentStatus::Arrived, 'arrived_at' => now()]);
        $appointment->update(['status' => AppointmentStatus::InProgress]);
        $appointment->update(['status' => AppointmentStatus::Completed]);

        $appointment->refresh();
        expect($appointment->status)->toBe(AppointmentStatus::Completed)
            ->and($appointment->status->isTerminal())->toBeTrue()
            ->and($appointment->arrived_at)->not->toBeNull();

        // Cancellation preserves cancellation metadata.
        $cancelled = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => now()->addDays(2),
            'status' => AppointmentStatus::Cancelled,
            'cancelled_at' => now(),
            'cancellation_reason' => 'Patient travelling',
            'created_by' => $user->id,
        ]);

        expect($cancelled->status->isTerminal())->toBeTrue()
            ->and($cancelled->cancellation_reason)->toBe('Patient travelling');
    });
});
