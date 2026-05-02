<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Patient;

class PatientCodeGenerator
{
    public function next(): string
    {
        $last = Patient::withTrashed()->max('id') ?? 0;

        return sprintf('P-%05d', ((int) $last) + 1);
    }
}
