<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Auth routes are registered twice — once with the `central.` prefix and
 * once with `tenant.` (see routes/auth.php). Controllers are shared across
 * both contexts; this helper figures out which name prefix the current
 * request belongs to so redirects use the right URL.
 */
final class AuthContext
{
    public static function isCentral(): bool
    {
        $host = request()->getHost();
        $centralDomains = config('tenancy.central_domains', []);

        return in_array($host, $centralDomains, true);
    }

    public static function prefix(): string
    {
        return self::isCentral() ? 'central' : 'tenant';
    }

    public static function guard(): string
    {
        return self::isCentral() ? 'web_central' : 'web';
    }

    public static function passwordBroker(): string
    {
        return self::isCentral() ? 'central_users' : 'tenant_users';
    }

    /**
     * Resolve a context-prefixed route name. Pass the suffix without the
     * prefix — `route('login')` → `central.login` or `tenant.login`.
     */
    public static function route(string $suffix, mixed $parameters = []): string
    {
        return route(self::prefix().'.'.$suffix, $parameters);
    }

    public static function homePath(): string
    {
        return self::isCentral() ? '/' : '/';
    }
}
