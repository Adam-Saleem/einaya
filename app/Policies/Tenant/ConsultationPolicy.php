<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Consultation;
use App\Models\Tenant\User;

class ConsultationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ConsultationsView->value);
    }

    public function view(User $user, Consultation $consultation): bool
    {
        return $user->can(Permission::ConsultationsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::ConsultationsCreate->value);
    }

    public function update(User $user, Consultation $consultation): bool
    {
        return $user->can(Permission::ConsultationsUpdate->value);
    }

    public function delete(User $user, Consultation $consultation): bool
    {
        return $user->can(Permission::ConsultationsDelete->value);
    }
}
