<?php

declare(strict_types=1);

use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use App\Services\Tenant\AppointmentConflictService;
use Illuminate\Support\Carbon;

require_once __DIR__.'/TenancyTestSetup.php';

const CONFLICT_PREFIX = 'pesttestconflict';

beforeEach(fn () => tenantTestCleanup(CONFLICT_PREFIX));
afterEach(fn () => tenantTestCleanup(CONFLICT_PREFIX));

it('flags overlapping appointments as a hard error', function () {
    $tenant = makeTestTenant(CONFLICT_PREFIX.'-a');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);
        $patient = Patient::create([
            'first_name' => 'A',
            'last_name' => 'B',
            'phone' => '+970-59-555',
            'preferred_language' => 'ar',
        ]);

        $existing = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => Carbon::tomorrow()->setTime(10, 0),
            'duration_minutes' => 30,
            'status' => AppointmentStatus::Confirmed,
            'created_by' => $admin->id,
        ]);

        $check = app(AppointmentConflictService::class)->check(
            $doctor,
            Carbon::tomorrow()->setTime(10, 15),
            30,
        );

        expect($check['errors'])->toContain('overlap');

        // Cancelled appointments don't count as conflicts.
        $existing->update(['status' => AppointmentStatus::Cancelled]);
        $check2 = app(AppointmentConflictService::class)->check(
            $doctor,
            Carbon::tomorrow()->setTime(10, 15),
            30,
        );
        expect($check2['errors'])->toBe([]);
    });
});
