<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Diagnosis;
use App\Models\Tenant\User;

class DiagnosisPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::DiagnosesView->value);
    }

    public function view(User $user, Diagnosis $diagnosis): bool
    {
        return $user->can(Permission::DiagnosesView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::DiagnosesCreate->value);
    }

    public function update(User $user, Diagnosis $diagnosis): bool
    {
        return $user->can(Permission::DiagnosesUpdate->value);
    }

    public function delete(User $user, Diagnosis $diagnosis): bool
    {
        return $user->can(Permission::DiagnosesDelete->value);
    }
}
