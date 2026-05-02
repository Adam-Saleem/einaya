<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Forces routes flagged with this middleware to fail closed unless the
 * authenticated user has a confirmed second factor. Used for sensitive
 * actions (account deletion, role changes, etc).
 *
 * Distinct from the login-time 2FA challenge — that lives in
 * TwoFactorChallengeController and gates the session itself.
 */
class RequireTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if ($user === null) {
            return redirect()->route('login');
        }

        if (! method_exists($user, 'hasTwoFactorEnabled') || ! $user->hasTwoFactorEnabled()) {
            return redirect()
                ->route('two-factor.setup')
                ->with('warning', 'Two-factor authentication is required for this action.');
        }

        return $next($request);
    }
}
