<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum Role: string
{
    case ClinicAdmin = 'clinic_admin';
    case Doctor = 'doctor';
    case Secretary = 'secretary';
    case Nurse = 'nurse';

    public function label(): string
    {
        return match ($this) {
            self::ClinicAdmin => 'Clinic Admin',
            self::Doctor => 'Doctor',
            self::Secretary => 'Secretary',
            self::Nurse => 'Nurse',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $r) => $r->value, self::cases());
    }
}
