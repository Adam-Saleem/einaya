<?php

declare(strict_types=1);

namespace App\Policies\Tenant;

use App\Enums\Tenant\Permission;
use App\Models\Tenant\Payment;
use App\Models\Tenant\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::PaymentsView->value);
    }

    public function view(User $user, Payment $payment): bool
    {
        return $user->can(Permission::PaymentsView->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::PaymentsCreate->value);
    }

    public function refund(User $user, Payment $payment): bool
    {
        return $user->can(Permission::PaymentsRefund->value);
    }

    public function update(User $user, Payment $payment): bool
    {
        // Once recorded, payments are not directly editable — adjustments
        // happen via refund.
        return false;
    }

    public function delete(User $user, Payment $payment): bool
    {
        return false;
    }
}
