<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Partial = 'partial';
    case Refunded = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending',
            self::Paid => 'Paid',
            self::Partial => 'Partial',
            self::Refunded => 'Refunded',
        };
    }
}
