<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Prescription;
use App\Models\Tenant\User;

class PrescriptionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::PrescriptionsView->value);
    }

    public function view(User $user, Prescription $prescription): bool
    {
        return $user->can(Permission::PrescriptionsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::PrescriptionsCreate->value);
    }

    public function update(User $user, Prescription $prescription): bool
    {
        return $user->can(Permission::PrescriptionsUpdate->value);
    }

    public function delete(User $user, Prescription $prescription): bool
    {
        return $user->can(Permission::PrescriptionsDelete->value);
    }
}
