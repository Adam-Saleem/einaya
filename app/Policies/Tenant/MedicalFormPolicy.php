<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\MedicalForm;
use App\Models\Tenant\User;

class MedicalFormPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::FormsView->value);
    }

    public function view(User $user, MedicalForm $form): bool
    {
        return $user->can(Permission::FormsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::FormsManage->value);
    }

    public function update(User $user, MedicalForm $form): bool
    {
        return $user->can(Permission::FormsManage->value);
    }

    public function delete(User $user, MedicalForm $form): bool
    {
        return $user->can(Permission::FormsManage->value);
    }
}
