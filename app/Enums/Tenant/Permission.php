<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum Permission: string
{
    // Patients
    case PatientsView = 'patients.view';
    case PatientsCreate = 'patients.create';
    case PatientsUpdate = 'patients.update';
    case PatientsDelete = 'patients.delete';
    case PatientsViewMedical = 'patients.view_medical';

    // Appointments
    case AppointmentsView = 'appointments.view';
    case AppointmentsCreate = 'appointments.create';
    case AppointmentsUpdate = 'appointments.update';
    case AppointmentsCancel = 'appointments.cancel';
    case AppointmentsDelete = 'appointments.delete';

    // Consultations
    case ConsultationsView = 'consultations.view';
    case ConsultationsCreate = 'consultations.create';
    case ConsultationsUpdate = 'consultations.update';
    case ConsultationsDelete = 'consultations.delete';

    // Medical Forms
    case FormsView = 'forms.view';
    case FormsManage = 'forms.manage';
    case FormsSubmit = 'forms.submit';

    // Prescriptions
    case PrescriptionsView = 'prescriptions.view';
    case PrescriptionsCreate = 'prescriptions.create';
    case PrescriptionsUpdate = 'prescriptions.update';
    case PrescriptionsDelete = 'prescriptions.delete';

    // Diagnoses
    case DiagnosesView = 'diagnoses.view';
    case DiagnosesCreate = 'diagnoses.create';
    case DiagnosesUpdate = 'diagnoses.update';
    case DiagnosesDelete = 'diagnoses.delete';

    // Payments
    case PaymentsView = 'payments.view';
    case PaymentsCreate = 'payments.create';
    case PaymentsRefund = 'payments.refund';

    // Patient Files
    case FilesView = 'files.view';
    case FilesUpload = 'files.upload';
    case FilesDelete = 'files.delete';

    // Insurance Providers
    case InsuranceView = 'insurance.view';
    case InsuranceManage = 'insurance.manage';

    // Staff Management
    case StaffView = 'staff.view';
    case StaffCreate = 'staff.create';
    case StaffUpdate = 'staff.update';
    case StaffDelete = 'staff.delete';

    // Doctor Settings
    case DoctorViewProfile = 'doctor.view_profile';
    case DoctorUpdateProfile = 'doctor.update_profile';
    case DoctorManageHours = 'doctor.manage_hours';

    // Clinic Settings
    case ClinicViewSettings = 'clinic.view_settings';
    case ClinicUpdateSettings = 'clinic.update_settings';
    case ClinicUpdateBranding = 'clinic.update_branding';
    case ClinicManageSubscription = 'clinic.manage_subscription';

    // Reports
    case ReportsView = 'reports.view';
    case ReportsExport = 'reports.export';

    // Audit Logs
    case AuditView = 'audit.view';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $p) => $p->value, self::cases());
    }
}
