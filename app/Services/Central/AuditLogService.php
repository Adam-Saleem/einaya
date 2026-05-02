<?php

declare(strict_types=1);

namespace App\Services\Central;

use App\Models\Central\CentralAuditLog;
use App\Models\Central\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    public function __construct(private ?Request $request = null)
    {
    }

    public function log(
        ?User $user,
        string $action,
        ?Model $auditable = null,
        array $oldValues = [],
        array $newValues = [],
    ): CentralAuditLog {
        return CentralAuditLog::create([
            'user_id' => $user?->getKey(),
            'action' => $action,
            'auditable_type' => $auditable !== null ? $auditable::class : null,
            'auditable_id' => $auditable?->getKey(),
            'old_values' => $oldValues === [] ? null : $oldValues,
            'new_values' => $newValues === [] ? null : $newValues,
            'ip_address' => $this->request?->ip(),
            'user_agent' => $this->trimUserAgent($this->request?->userAgent()),
            'created_at' => now(),
        ]);
    }

    private function trimUserAgent(?string $agent): ?string
    {
        if ($agent === null || $agent === '') {
            return null;
        }

        return mb_substr($agent, 0, 500);
    }
}
