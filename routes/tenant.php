<?php

declare(strict_types=1);

use App\Http\Controllers\ClientErrorController;
use App\Http\Controllers\PreferenceController;
use App\Models\Tenant\DoctorBreak;
use App\Models\Tenant\DoctorTimeOff;
use App\Models\Tenant\FormQuestion;
use App\Models\Tenant\FormSection;
use App\Models\Tenant\FormSubmission;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\User as TenantUser;
use App\Http\Controllers\Tenant\AppointmentController;
use App\Http\Controllers\Tenant\AuditController;
use App\Http\Controllers\Tenant\ConsultationListController;
use App\Http\Controllers\Tenant\DashboardController;
use App\Http\Controllers\Tenant\Doctor\ConsultationController as DoctorConsultationController;
use App\Http\Controllers\Tenant\Doctor\DashboardController as DoctorDashboardController;
use App\Http\Controllers\Tenant\Doctor\DiagnosisController as DoctorDiagnosisController;
use App\Http\Controllers\Tenant\Doctor\FormSubmissionController as DoctorFormSubmissionController;
use App\Http\Controllers\Tenant\Doctor\PatientHistoryController as DoctorPatientHistoryController;
use App\Http\Controllers\Tenant\Doctor\PrescriptionController as DoctorPrescriptionController;
use App\Http\Controllers\Tenant\Doctor\QueueController as DoctorQueueController;
use App\Http\Controllers\Tenant\DoctorProfileController;
use App\Http\Controllers\Tenant\FormQuestionController;
use App\Http\Controllers\Tenant\FormSectionController;
use App\Http\Controllers\Tenant\FormSubmissionController;
use App\Http\Controllers\Tenant\InsuranceProviderController;
use App\Http\Controllers\Tenant\MedicalFormController;
use App\Http\Controllers\Tenant\PatientController;
use App\Http\Controllers\Tenant\PatientFileController;
use App\Http\Controllers\Tenant\PaymentController;
use App\Http\Controllers\Tenant\ReceptionDashboardController;
use App\Http\Controllers\Tenant\ReportController;
use App\Http\Controllers\Tenant\SettingsController;
use App\Http\Controllers\Tenant\SubscriptionController;
use App\Http\Controllers\Tenant\ServiceController;
use App\Http\Controllers\Tenant\StaffController;
use App\Http\Controllers\Tenant\WorkingHoursController;
use App\Models\Tenant\Appointment;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\Diagnosis;
use App\Models\Tenant\Patient;
use App\Models\Tenant\PatientFile;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\PrescriptionItem;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Loaded by TenancyServiceProvider::mapRoutes(). Auth + profile use the
| default `web` guard which points at App\Models\Tenant\User in the active
| tenant DB.
|
*/

// Tenant routes use a mix of param names that don't match Laravel's
// implicit-binding conventions (`{form}` for MedicalForm, `{break}` for
// DoctorBreak, etc.). Bind them explicitly so the framework can resolve
// each one without us having to type it out per route.
Route::bind('staff', fn ($id) => TenantUser::query()->findOrFail($id));
Route::bind('form', fn ($id) => MedicalForm::query()->findOrFail($id));
Route::bind('section', fn ($id) => FormSection::query()->findOrFail($id));
Route::bind('question', fn ($id) => FormQuestion::query()->findOrFail($id));
Route::bind('submission', fn ($id) => FormSubmission::query()->findOrFail($id));
Route::bind('break', fn ($id) => DoctorBreak::query()->findOrFail($id));
Route::bind('time_off', fn ($id) => DoctorTimeOff::query()->findOrFail($id));
Route::bind('insurance_provider', fn ($id) => InsuranceProvider::query()->findOrFail($id));
Route::bind('patient', fn ($id) => Patient::query()->findOrFail($id));
Route::bind('appointment', fn ($id) => Appointment::query()->findOrFail($id));
Route::bind('payment', fn ($id) => Payment::query()->findOrFail($id));
Route::bind('file', fn ($id) => PatientFile::query()->findOrFail($id));
Route::bind('consultation', fn ($id) => Consultation::query()->findOrFail($id));
Route::bind('diagnosis', fn ($id) => Diagnosis::query()->findOrFail($id));
Route::bind('prescription', fn ($id) => Prescription::query()->findOrFail($id));
Route::bind('item', fn ($id) => PrescriptionItem::query()->findOrFail($id));

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
    'clinic_active',
])->group(function () {
    // Shared auth routes — names prefixed with `tenant.`.
    (require __DIR__.'/auth.php')('tenant');

    Route::middleware('design_system')->get('/design-system', function () {
        return Inertia::render('DesignSystem', ['context' => 'tenant']);
    })->name('tenant.design-system');

    Route::post('/api/preferences/language/guest', [PreferenceController::class, 'language'])
        ->name('tenant.preferences.language.guest');

    Route::post('/api/client-errors', [ClientErrorController::class, 'store'])
        ->name('tenant.client-errors');

    // Pre-auth: tenant landing page renders Welcome for guests; the auth
    // group below short-circuits with the Dashboard for logged-in users.
    Route::get('/', function () {
        if (auth()->check()) {
            return app(DashboardController::class)->index();
        }

        return Inertia::render('Tenant/Welcome', [
            'tenantId' => tenant('id'),
        ]);
    })->name('tenant.welcome');

    Route::middleware('auth')->group(function () {
        Route::post('/api/preferences/language', [PreferenceController::class, 'language'])
            ->name('tenant.preferences.language');
        Route::post('/api/preferences/theme', [PreferenceController::class, 'theme'])
            ->name('tenant.preferences.theme');

        // Staff
        Route::get('/staff', [StaffController::class, 'index'])->name('tenant.staff.index');
        Route::post('/staff', [StaffController::class, 'store'])->name('tenant.staff.store');
        Route::patch('/staff/{staff}', [StaffController::class, 'update'])->name('tenant.staff.update');
        Route::post('/staff/{staff}/reset-password', [StaffController::class, 'resetPassword'])
            ->name('tenant.staff.reset-password');
        Route::delete('/staff/{staff}', [StaffController::class, 'destroy'])->name('tenant.staff.destroy');

        // Doctor profile + working hours
        Route::get('/doctor/profile', [DoctorProfileController::class, 'show'])
            ->name('tenant.doctor.profile.show');
        Route::post('/doctor/profile', [DoctorProfileController::class, 'update'])
            ->name('tenant.doctor.profile.update');
        Route::get('/doctor/hours', [WorkingHoursController::class, 'show'])
            ->name('tenant.doctor.hours.show');
        Route::post('/doctor/hours', [WorkingHoursController::class, 'update'])
            ->name('tenant.doctor.hours.update');
        Route::post('/doctor/breaks', [WorkingHoursController::class, 'storeBreak'])
            ->name('tenant.doctor.breaks.store');
        Route::delete('/doctor/breaks/{break}', [WorkingHoursController::class, 'destroyBreak'])
            ->name('tenant.doctor.breaks.destroy');
        Route::post('/doctor/time-off', [WorkingHoursController::class, 'storeTimeOff'])
            ->name('tenant.doctor.timeoff.store');
        Route::delete('/doctor/time-off/{time_off}', [WorkingHoursController::class, 'destroyTimeOff'])
            ->name('tenant.doctor.timeoff.destroy');

        // Settings
        Route::get('/settings', [SettingsController::class, 'show'])->name('tenant.settings.show');
        Route::patch('/settings', [SettingsController::class, 'update'])->name('tenant.settings.update');

        Route::get('/subscription', [SubscriptionController::class, 'show'])->name('tenant.subscription.show');
        Route::post('/subscription/redeem', [SubscriptionController::class, 'redeem'])
            ->name('tenant.subscription.redeem');
        Route::post('/settings/branding/logo', [SettingsController::class, 'uploadLogo'])
            ->name('tenant.settings.branding.logo');

        // Services catalogue (clinic admin)
        Route::get('/services', [ServiceController::class, 'index'])->name('tenant.services.index');
        Route::post('/services', [ServiceController::class, 'store'])->name('tenant.services.store');
        Route::patch('/services/{service}', [ServiceController::class, 'update'])
            ->name('tenant.services.update');
        Route::delete('/services/{service}', [ServiceController::class, 'destroy'])
            ->name('tenant.services.destroy');

        // Insurance providers
        Route::get('/insurance-providers', [InsuranceProviderController::class, 'index'])
            ->name('tenant.insurance.index');
        Route::post('/insurance-providers', [InsuranceProviderController::class, 'store'])
            ->name('tenant.insurance.store');
        Route::patch('/insurance-providers/{insurance_provider}', [InsuranceProviderController::class, 'update'])
            ->name('tenant.insurance.update');
        Route::delete('/insurance-providers/{insurance_provider}', [InsuranceProviderController::class, 'destroy'])
            ->name('tenant.insurance.destroy');

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('tenant.reports.index');
        Route::get('/reports/{type}/export', [ReportController::class, 'export'])
            ->whereIn('type', ['appointments', 'revenue', 'patients', 'diagnoses'])
            ->name('tenant.reports.export');

        // Audit
        Route::get('/audit', [AuditController::class, 'index'])->name('tenant.audit.index');

        // Medical forms
        Route::get('/forms', [MedicalFormController::class, 'index'])->name('tenant.forms.index');
        Route::post('/forms', [MedicalFormController::class, 'store'])->name('tenant.forms.store');
        Route::get('/forms/{form}/edit', [MedicalFormController::class, 'edit'])
            ->name('tenant.forms.edit');
        Route::get('/forms/{form}/snapshot', [MedicalFormController::class, 'snapshot'])
            ->name('tenant.forms.snapshot');
        Route::patch('/forms/{form}', [MedicalFormController::class, 'update'])
            ->name('tenant.forms.update');
        Route::delete('/forms/{form}', [MedicalFormController::class, 'destroy'])
            ->name('tenant.forms.destroy');
        Route::post('/forms/{form}/duplicate', [MedicalFormController::class, 'duplicate'])
            ->name('tenant.forms.duplicate');

        // Form sections
        Route::post('/forms/{form}/sections', [FormSectionController::class, 'store'])
            ->name('tenant.forms.sections.store');
        Route::patch('/forms/{form}/sections/{section}', [FormSectionController::class, 'update'])
            ->name('tenant.forms.sections.update');
        Route::delete('/forms/{form}/sections/{section}', [FormSectionController::class, 'destroy'])
            ->name('tenant.forms.sections.destroy');
        Route::post('/forms/{form}/sections/reorder', [FormSectionController::class, 'reorder'])
            ->name('tenant.forms.sections.reorder');

        // Form questions (scoped under section, not form, to keep the FK
        // path explicit and prevent accidental cross-section moves).
        Route::post('/sections/{section}/questions', [FormQuestionController::class, 'store'])
            ->name('tenant.forms.questions.store');
        Route::patch('/sections/{section}/questions/{question}', [FormQuestionController::class, 'update'])
            ->name('tenant.forms.questions.update');
        Route::delete('/sections/{section}/questions/{question}', [FormQuestionController::class, 'destroy'])
            ->name('tenant.forms.questions.destroy');
        Route::post('/sections/{section}/questions/reorder', [FormQuestionController::class, 'reorder'])
            ->name('tenant.forms.questions.reorder');

        // Form submissions
        Route::get('/forms/{form}/submissions', [FormSubmissionController::class, 'index'])
            ->name('tenant.forms.submissions.index');
        Route::get('/submissions/{submission}', [FormSubmissionController::class, 'show'])
            ->name('tenant.forms.submissions.show');

        // Reception dashboard
        Route::get('/reception', [ReceptionDashboardController::class, 'index'])
            ->name('tenant.reception');

        // Patients
        Route::get('/patients/search', [PatientController::class, 'search'])
            ->name('tenant.patients.search');
        Route::get('/patients', [PatientController::class, 'index'])
            ->name('tenant.patients.index');
        Route::post('/patients', [PatientController::class, 'store'])
            ->name('tenant.patients.store');
        Route::get('/patients/{patient}', [PatientController::class, 'show'])
            ->name('tenant.patients.show');
        Route::patch('/patients/{patient}', [PatientController::class, 'update'])
            ->name('tenant.patients.update');
        Route::patch('/patients/{patient}/medical-flags', [PatientController::class, 'updateMedicalFlags'])
            ->name('tenant.patients.medical-flags');
        Route::delete('/patients/{patient}', [PatientController::class, 'destroy'])
            ->name('tenant.patients.destroy');
        Route::post('/patients/{patient}/files', [PatientFileController::class, 'store'])
            ->name('tenant.patients.files.store');
        Route::delete('/patients/{patient}/files/{file}', [PatientFileController::class, 'destroy'])
            ->name('tenant.patients.files.destroy');

        // Appointments
        Route::get('/appointments', [AppointmentController::class, 'index'])
            ->name('tenant.appointments.index');
        Route::get('/appointments/today', [AppointmentController::class, 'today'])
            ->name('tenant.appointments.today');
        Route::get('/appointments/data', [AppointmentController::class, 'data'])
            ->name('tenant.appointments.data');
        Route::post('/appointments', [AppointmentController::class, 'store'])
            ->name('tenant.appointments.store');
        Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update'])
            ->name('tenant.appointments.update');
        Route::post('/appointments/{appointment}/arrive', [AppointmentController::class, 'arrive'])
            ->name('tenant.appointments.arrive');
        Route::post('/appointments/{appointment}/cancel', [AppointmentController::class, 'cancel'])
            ->name('tenant.appointments.cancel');
        Route::post('/appointments/{appointment}/no-show', [AppointmentController::class, 'noShow'])
            ->name('tenant.appointments.no-show');

        // Payments
        Route::get('/payments', [PaymentController::class, 'index'])
            ->name('tenant.payments.index');
        Route::post('/payments', [PaymentController::class, 'store'])
            ->name('tenant.payments.store');
        Route::get('/payments/{payment}/receipt', [PaymentController::class, 'receipt'])
            ->name('tenant.payments.receipt');

        // Doctor module
        Route::get('/doctor', [DoctorDashboardController::class, 'index'])
            ->name('tenant.doctor.dashboard');
        Route::get('/doctor/queue', [DoctorQueueController::class, 'index'])
            ->name('tenant.doctor.queue');

        // Consultations
        Route::get('/consultations', [ConsultationListController::class, 'index'])
            ->name('tenant.consultations.index');
        Route::post('/consultations', [DoctorConsultationController::class, 'store'])
            ->name('tenant.consultations.store');
        Route::get('/consultations/{consultation}', [DoctorConsultationController::class, 'show'])
            ->name('tenant.consultations.show');
        Route::patch('/consultations/{consultation}', [DoctorConsultationController::class, 'update'])
            ->name('tenant.consultations.update');
        Route::post('/consultations/{consultation}/complete', [DoctorConsultationController::class, 'complete'])
            ->name('tenant.consultations.complete');

        // Form submissions during consultation
        Route::post('/consultations/{consultation}/submissions', [DoctorFormSubmissionController::class, 'store'])
            ->name('tenant.consultations.submissions.store');

        // Diagnoses
        Route::post('/consultations/{consultation}/diagnoses', [DoctorDiagnosisController::class, 'store'])
            ->name('tenant.consultations.diagnoses.store');
        Route::patch('/diagnoses/{diagnosis}', [DoctorDiagnosisController::class, 'update'])
            ->name('tenant.diagnoses.update');
        Route::delete('/diagnoses/{diagnosis}', [DoctorDiagnosisController::class, 'destroy'])
            ->name('tenant.diagnoses.destroy');

        // Prescriptions
        Route::post('/consultations/{consultation}/prescription', [DoctorPrescriptionController::class, 'ensure'])
            ->name('tenant.consultations.prescription.ensure');
        Route::post('/prescriptions/{prescription}/items', [DoctorPrescriptionController::class, 'storeItem'])
            ->name('tenant.prescriptions.items.store');
        Route::patch('/prescriptions/{prescription}/items/{item}', [DoctorPrescriptionController::class, 'updateItem'])
            ->name('tenant.prescriptions.items.update');
        Route::delete('/prescriptions/{prescription}/items/{item}', [DoctorPrescriptionController::class, 'destroyItem'])
            ->name('tenant.prescriptions.items.destroy');
        Route::get('/prescriptions/{prescription}/print', [DoctorPrescriptionController::class, 'print'])
            ->name('tenant.prescriptions.print');
        Route::get('/api/medication-suggestions', [DoctorPrescriptionController::class, 'suggestions'])
            ->name('tenant.prescriptions.suggestions');

        // Patient history
        Route::get('/patients/{patient}/history', [DoctorPatientHistoryController::class, 'show'])
            ->name('tenant.patients.history');
    });
});
