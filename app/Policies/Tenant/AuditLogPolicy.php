<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\TenantAuditLog;
use App\Models\Tenant\User;

class AuditLogPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::AuditView->value);
    }

    public function view(User $user, TenantAuditLog $log): bool
    {
        return $user->can(Permission::AuditView->value);
    }

    // Audit logs are immutable.
    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, TenantAuditLog $log): bool
    {
        return false;
    }

    public function delete(User $user, TenantAuditLog $log): bool
    {
        return false;
    }
}
