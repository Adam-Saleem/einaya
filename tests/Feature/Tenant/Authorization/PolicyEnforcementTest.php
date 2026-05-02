<?php

declare(strict_types=1);

use App\Enums\Tenant\Role as RoleEnum;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\User as TenantUser;
use Illuminate\Support\Facades\Gate;

require_once __DIR__.'/../TenancyTestSetup.php';

const POLICY_PREFIX = 'pesttestpolicy';

beforeEach(fn () => tenantTestCleanup(POLICY_PREFIX));
afterEach(fn () => tenantTestCleanup(POLICY_PREFIX));

it('routes Gate::forUser through registered policies for each tenant model', function () {
    $tenant = makeTestTenant('pesttestpolicy-1');

    $tenant->run(function (): void {
        $admin = TenantUser::factory()->create();
        $admin->syncRoles([RoleEnum::ClinicAdmin->value]);

        $secretary = TenantUser::factory()->create();
        $secretary->syncRoles([RoleEnum::Secretary->value]);

        $doctorUser = TenantUser::factory()->create();
        $doctor = Doctor::create([
            'user_id' => $doctorUser->id,
            'specialty' => 'GP',
        ]);

        $patient = Patient::create([
            'first_name' => 'Policy',
            'last_name' => 'Patient',
            'phone' => '+970-59-000-1234',
            'preferred_language' => 'ar',
        ]);

        $appointment = Appointment::create([
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'scheduled_for' => now(),
            'status' => 'pending',
            'created_by' => $admin->id,
        ]);

        $consultation = Consultation::create([
            'appointment_id' => $appointment->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'started_at' => now(),
        ]);

        $prescription = Prescription::create([
            'consultation_id' => $consultation->id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ]);

        $provider = InsuranceProvider::create(['name' => 'Test Insurance']);

        // Admin is allowed everything that has a policy.
        expect(Gate::forUser($admin)->allows('view', $patient))->toBeTrue()
            ->and(Gate::forUser($admin)->allows('viewMedical', $patient))->toBeTrue()
            ->and(Gate::forUser($admin)->allows('view', $consultation))->toBeTrue()
            ->and(Gate::forUser($admin)->allows('view', $prescription))->toBeTrue()
            ->and(Gate::forUser($admin)->allows('update', $appointment))->toBeTrue()
            ->and(Gate::forUser($admin)->allows('update', $provider))->toBeTrue();

        // Secretary: view patients (admin) yes; view_medical no; consultations
        // view yes (read-only); prescription view no.
        expect(Gate::forUser($secretary)->allows('view', $patient))->toBeTrue()
            ->and(Gate::forUser($secretary)->allows('viewMedical', $patient))->toBeFalse()
            ->and(Gate::forUser($secretary)->allows('view', $consultation))->toBeTrue()
            ->and(Gate::forUser($secretary)->allows('create', $consultation))->toBeFalse()
            ->and(Gate::forUser($secretary)->allows('view', $prescription))->toBeFalse()
            ->and(Gate::forUser($secretary)->allows('delete', $patient))->toBeFalse();

        // Form submissions are immutable for everyone.
        $submission = new App\Models\Tenant\FormSubmission();
        expect(Gate::forUser($admin)->allows('update', $submission))->toBeFalse();

        // Audit logs are immutable for everyone.
        $log = new App\Models\Tenant\TenantAuditLog();
        expect(Gate::forUser($admin)->allows('update', $log))->toBeFalse()
            ->and(Gate::forUser($admin)->allows('delete', $log))->toBeFalse();

        // UserPolicy: a user can view themselves regardless of staff perms.
        expect(Gate::forUser($secretary)->allows('view', $secretary))->toBeTrue()
            ->and(Gate::forUser($secretary)->allows('delete', $secretary))->toBeFalse();
    });
});
