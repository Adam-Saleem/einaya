<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Enums\Central\ClinicStatus;
use App\Models\Central\Clinic;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks all tenant traffic for clinics whose central status is suspended or
 * cancelled. Runs after InitializeTenancyByDomain so tenant() is populated.
 *
 * Access stays open for already-authenticated users to /logout so they can
 * leave a session that became invalid mid-flight.
 *
 * Reads status fresh from the central DB on every request rather than
 * trusting the tenant model returned by stancl: when stancl's
 * Tenancy::initialize() is called twice for the same tenant key in one
 * process (test runner, queue worker reusing connections, etc.) it
 * short-circuits and leaves the in-memory Clinic stale. A status change
 * between those two calls would otherwise be silently ignored — a
 * security gap, not just a test annoyance.
 */
class EnsureClinicActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $clinic = tenant();

        if ($clinic === null) {
            return $next($request);
        }

        $fresh = Clinic::query()->whereKey($clinic->getKey())->first();

        if ($fresh === null) {
            // Domain still routes here but the central record is gone (or
            // soft-deleted); treat as cancelled to fail closed.
            abort(404);
        }

        $status = $fresh->status instanceof ClinicStatus
            ? $fresh->status
            : ClinicStatus::tryFrom((string) $fresh->status);

        if (! in_array($status, [ClinicStatus::Suspended, ClinicStatus::Cancelled], true)) {
            return $next($request);
        }

        // Always allow logout so a session that pre-dates the suspension
        // can still terminate cleanly.
        if ($request->is('logout') || $request->routeIs('*.logout')) {
            return $next($request);
        }

        if ($request->user()) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        abort(503, $status === ClinicStatus::Cancelled
            ? 'This clinic has been cancelled. Contact support to reactivate.'
            : 'This clinic is currently suspended. Contact support.');
    }
}
