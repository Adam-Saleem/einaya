<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\User;

class InsuranceProviderPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::InsuranceView->value);
    }

    public function view(User $user, InsuranceProvider $provider): bool
    {
        return $user->can(Permission::InsuranceView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::InsuranceManage->value);
    }

    public function update(User $user, InsuranceProvider $provider): bool
    {
        return $user->can(Permission::InsuranceManage->value);
    }

    public function delete(User $user, InsuranceProvider $provider): bool
    {
        return $user->can(Permission::InsuranceManage->value);
    }
}
