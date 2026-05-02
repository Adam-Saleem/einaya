<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Doctor;
use App\Models\Tenant\User;

class DoctorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::DoctorViewProfile->value);
    }

    public function view(User $user, Doctor $doctor): bool
    {
        return $user->can(Permission::DoctorViewProfile->value);
    }

    public function update(User $user, Doctor $doctor): bool
    {
        return $user->can(Permission::DoctorUpdateProfile->value);
    }

    public function manageHours(User $user, Doctor $doctor): bool
    {
        return $user->can(Permission::DoctorManageHours->value);
    }

    // Doctor profiles are created during tenant provisioning; no UI for that.
    public function create(User $user): bool
    {
        return false;
    }

    public function delete(User $user, Doctor $doctor): bool
    {
        return false;
    }
}
