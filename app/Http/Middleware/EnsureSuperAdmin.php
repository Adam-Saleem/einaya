<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate central-context routes that touch platform-wide data behind the
 * `is_super_admin` flag. The `central` middleware already swaps the default
 * guard, so by the time this runs `$request->user()` resolves to a
 * Central\User.
 */
class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || ! ($user->is_super_admin ?? false)) {
            abort(403, 'Super admin access required.');
        }

        return $next($request);
    }
}
