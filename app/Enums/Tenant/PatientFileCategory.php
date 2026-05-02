<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum PatientFileCategory: string
{
    case IdCard = 'id_card';
    case InsuranceCard = 'insurance_card';
    case ExternalReport = 'external_report';
    case PrescriptionScan = 'prescription_scan';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::IdCard => 'ID Card',
            self::InsuranceCard => 'Insurance Card',
            self::ExternalReport => 'External Report',
            self::PrescriptionScan => 'Prescription Scan',
            self::Other => 'Other',
        };
    }
}
