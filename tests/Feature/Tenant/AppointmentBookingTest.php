<?php

declare(strict_types=1);

use App\Actions\Tenant\BookAppointmentAction;
use App\Enums\Tenant\AppointmentStatus;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;
use Illuminate\Support\Carbon;

require_once __DIR__.'/TenancyTestSetup.php';

const BOOK_PREFIX = 'pesttestbook';

beforeEach(fn () => tenantTestCleanup(BOOK_PREFIX));
afterEach(fn () => tenantTestCleanup(BOOK_PREFIX));

it('books an appointment for a patient', function () {
    $tenant = makeTestTenant(BOOK_PREFIX.'-a');

    $tenant->run(function () {
        $admin = User::factory()->create();
        $doctor = Doctor::factory()->create(['user_id' => $admin->id]);

        $patient = Patient::create([
            'first_name' => 'Test',
            'last_name' => 'Pt',
            'phone' => '+97059333333',
            'preferred_language' => 'ar',
        ]);

        $appointment = app(BookAppointmentAction::class)->execute([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => Carbon::tomorrow()->setTime(10, 0)->toIso8601String(),
            'duration_minutes' => 30,
            'reason' => 'Routine',
            'force' => true,
        ], $admin);

        expect($appointment)->toBeInstanceOf(Appointment::class);
        expect($appointment->status)->toBe(AppointmentStatus::Pending);
        expect($appointment->scheduled_for->minute)->toBe(0);
    });
});
