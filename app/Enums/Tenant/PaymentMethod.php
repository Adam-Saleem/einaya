<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum PaymentMethod: string
{
    case Cash = 'cash';
    case Card = 'card';
    case Insurance = 'insurance';
    case Mixed = 'mixed';

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Card => 'Card',
            self::Insurance => 'Insurance',
            self::Mixed => 'Mixed',
        };
    }
}
