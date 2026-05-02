<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Support\AuthContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'context' => AuthContext::prefix(),
            'canResetPassword' => true,
            'status' => session('status'),
        ]);
    }

    /**
     * Verify credentials. If the user has 2FA confirmed, stash their ID in
     * the session and redirect to the challenge instead of logging them in
     * directly.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        $guard = AuthContext::guard();
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (! Auth::guard($guard)->validate($credentials)) {
            RateLimiter::hit($request->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $user = Auth::guard($guard)->getProvider()->retrieveByCredentials($credentials);

        if ($user !== null && method_exists($user, 'hasTwoFactorEnabled') && $user->hasTwoFactorEnabled()) {
            $request->session()->put([
                'auth.two_factor.user_id' => $user->getAuthIdentifier(),
                'auth.two_factor.guard' => $guard,
                'auth.two_factor.remember' => $remember,
            ]);

            return redirect()->route(AuthContext::prefix().'.two-factor.challenge');
        }

        Auth::guard($guard)->login($user, $remember);
        $request->session()->regenerate();

        return redirect()->intended(AuthContext::homePath());
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard(AuthContext::guard())->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route(AuthContext::prefix().'.login');
    }
}
