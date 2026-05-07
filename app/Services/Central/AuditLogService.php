<?php

declare(strict_types=1);

namespace App\Services\Central;

use App\Models\Central\CentralAuditLog;
use App\Models\Central\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    /** @see \App\Services\Tenant\AuditLogService — same redaction list. */
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'api_token',
    ];

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
        $oldValues = $this->scrub($oldValues);
        $newValues = $this->scrub($newValues);

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

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    private function scrub(array $values): array
    {
        foreach ($values as $key => $_) {
            if (in_array(strtolower((string) $key), self::SENSITIVE_KEYS, true)) {
                $values[$key] = '[redacted]';
            }
        }

        return $values;
    }

    private function trimUserAgent(?string $agent): ?string
    {
        if ($agent === null || $agent === '') {
            return null;
        }

        return mb_substr($agent, 0, 500);
    }
}
