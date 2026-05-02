<?php

declare(strict_types=1);

use App\Models\Central\User as CentralUser;
use App\Models\Tenant\User as TenantUser;

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Defaults
    |--------------------------------------------------------------------------
    |
    | The default guard is `web` (tenant). Routes in central context explicitly
    | switch to `web_central` via the EnsureCentralContext middleware /
    | controller logic — see app/Http/Middleware/EnsureCentralContext.php.
    |
    */

    'defaults' => [
        'guard' => env('AUTH_GUARD', 'web'),
        'passwords' => env('AUTH_PASSWORD_BROKER', 'tenant_users'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Authentication Guards
    |--------------------------------------------------------------------------
    |
    | `web`         — clinic users (doctors, secretaries) authenticated against
    |                 the active tenant DB's `users` table.
    | `web_central` — super admins authenticated against the central DB's
    |                 `users` table.
    |
    */

    'guards' => [
        'web' => [
            'driver' => 'session',
            'provider' => 'tenant_users',
        ],

        'web_central' => [
            'driver' => 'session',
            'provider' => 'central_users',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | User Providers
    |--------------------------------------------------------------------------
    */

    'providers' => [
        'tenant_users' => [
            'driver' => 'eloquent',
            'model' => TenantUser::class,
        ],

        'central_users' => [
            'driver' => 'eloquent',
            'model' => CentralUser::class,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Resetting Passwords
    |--------------------------------------------------------------------------
    |
    | Two brokers — central uses the central DB's password_reset_tokens, tenant
    | uses the tenant DB's same-named table (added in Phase 3).
    |
    */

    'passwords' => [
        'tenant_users' => [
            'provider' => 'tenant_users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],

        'central_users' => [
            'provider' => 'central_users',
            'table' => 'password_reset_tokens',
            'expire' => 60,
            'throttle' => 60,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Password Confirmation Timeout
    |--------------------------------------------------------------------------
    */

    'password_timeout' => env('AUTH_PASSWORD_TIMEOUT', 10800),

];
