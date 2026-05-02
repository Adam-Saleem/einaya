<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum PreferredLanguage: string
{
    case English = 'en';
    case Arabic = 'ar';

    public function label(): string
    {
        return match ($this) {
            self::English => 'English',
            self::Arabic => 'العربية',
        };
    }
}
