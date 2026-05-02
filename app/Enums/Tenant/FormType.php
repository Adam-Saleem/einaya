<?php

declare(strict_types=1);

namespace App\Enums\Tenant;

enum FormType: string
{
    case Intake = 'intake';
    case FollowUp = 'follow_up';
    case Custom = 'custom';

    public function label(): string
    {
        return match ($this) {
            self::Intake => 'Intake',
            self::FollowUp => 'Follow-up',
            self::Custom => 'Custom',
        };
    }
}
