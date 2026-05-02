<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Diagnosis;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\Patient;
use App\Models\Tenant\PatientFile;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\TenantAuditLog;
use App\Models\Tenant\User as TenantUser;
use App\Policies\Tenant\AppointmentPolicy;
use App\Policies\Tenant\AuditLogPolicy;
use App\Policies\Tenant\ConsultationPolicy;
use App\Policies\Tenant\DiagnosisPolicy;
use App\Policies\Tenant\DoctorPolicy;
use App\Policies\Tenant\FormSubmissionPolicy;
use App\Policies\Tenant\InsuranceProviderPolicy;
use App\Policies\Tenant\MedicalFormPolicy;
use App\Policies\Tenant\PatientFilePolicy;
use App\Policies\Tenant\PatientPolicy;
use App\Policies\Tenant\PaymentPolicy;
use App\Policies\Tenant\PrescriptionPolicy;
use App\Policies\Tenant\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/**
 * Laravel 12 doesn't ship an AuthServiceProvider by default; we add one for
 * explicit policy registration. Auto-discovery would also work for tenant
 * models named `App\Models\Tenant\X` ↔ `App\Policies\Tenant\XPolicy`, but
 * being explicit makes the mapping greppable.
 */
class AuthServiceProvider extends ServiceProvider
{
    /** @var array<class-string, class-string> */
    protected array $policies = [
        Patient::class => PatientPolicy::class,
        Appointment::class => AppointmentPolicy::class,
        Consultation::class => ConsultationPolicy::class,
        MedicalForm::class => MedicalFormPolicy::class,
        FormSubmission::class => FormSubmissionPolicy::class,
        Prescription::class => PrescriptionPolicy::class,
        Diagnosis::class => DiagnosisPolicy::class,
        Payment::class => PaymentPolicy::class,
        PatientFile::class => PatientFilePolicy::class,
        InsuranceProvider::class => InsuranceProviderPolicy::class,
        TenantUser::class => UserPolicy::class,
        Doctor::class => DoctorPolicy::class,
        TenantAuditLog::class => AuditLogPolicy::class,
    ];

    public function boot(): void
    {
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }
    }
}
