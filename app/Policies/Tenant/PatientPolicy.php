<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Patient;
use App\Models\Tenant\User;

class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::PatientsView->value);
    }

    public function view(User $user, Patient $patient): bool
    {
        return $user->can(Permission::PatientsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::PatientsCreate->value);
    }

    public function update(User $user, Patient $patient): bool
    {
        return $user->can(Permission::PatientsUpdate->value);
    }

    public function delete(User $user, Patient $patient): bool
    {
        return $user->can(Permission::PatientsDelete->value);
    }

    public function viewMedical(User $user, Patient $patient): bool
    {
        return $user->can(Permission::PatientsViewMedical->value);
    }
}
