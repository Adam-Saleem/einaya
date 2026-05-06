<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hard-stops central-only routes (super-admin login, super-admin dashboard)
 * from being reachable through a tenant subdomain.
 *
 * stancl ships PreventAccessFromCentralDomains for the inverse direction
 * (block tenant routes on a central domain), but it does NOT block central
 * routes hit on a tenant domain. This middleware closes that gap and also
 * swaps the auth guard default to `web_central` for the lifetime of the
 * request so controller-level Auth::user() reads the right model.
 *
 * NOTE: this middleware is registered in `bootstrap/app.php`'s priority
 * list ahead of `Authenticate`. Without that, Laravel's default sort
 * would run `auth` first (default guard = `web`, no user) and trigger
 * a redirect to /login, looping forever.
 */
class EnsureCentralContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->getHost();

        $centralDomains = config('tenancy.central_domains', []);

        if (! in_array($host, $centralDomains, true)) {
            abort(404);
        }

        // Make `web_central` the active default guard for this request so
        // shared auth controllers don't have to thread the guard name through
        // every Auth::guard() call.
        config(['auth.defaults.guard' => 'web_central']);
        config(['auth.defaults.passwords' => 'central_users']);

        return $next($request);
    }
}
