<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TwoFactorChallengeRequest;
use App\Support\AuthContext;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Second leg of the login flow. AuthenticatedSessionController validates
 * email + password, and if the user has 2FA enabled it stashes
 *   auth.two_factor.user_id
 *   auth.two_factor.guard
 *   auth.two_factor.remember
 * into the session and redirects here. The user is NOT auth'd at this
 * point — the session bridge is the only state they have.
 */
class TwoFactorChallengeController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        if (! $request->session()->has('auth.two_factor.user_id')) {
            return redirect()->route(AuthContext::prefix().'.login');
        }

        return Inertia::render('Auth/TwoFactorChallenge', [
            'context' => AuthContext::prefix(),
        ]);
    }

    public function store(TwoFactorChallengeRequest $request): RedirectResponse
    {
        $this->ensureIsNotRateLimited($request);

        $userId = $request->session()->get('auth.two_factor.user_id');
        $guard = $request->session()->get('auth.two_factor.guard');
        $remember = (bool) $request->session()->get('auth.two_factor.remember');

        if ($userId === null || $guard === null) {
            return redirect()->route(AuthContext::prefix().'.login');
        }

        $provider = Auth::guard($guard)->getProvider();
        $user = $provider->retrieveById($userId);

        if ($user === null || ! method_exists($user, 'hasTwoFactorEnabled') || ! $user->hasTwoFactorEnabled()) {
            $request->session()->forget(['auth.two_factor.user_id', 'auth.two_factor.guard', 'auth.two_factor.remember']);

            return redirect()->route(AuthContext::prefix().'.login');
        }

        $code = (string) $request->input('code', '');
        $recovery = (string) $request->input('recovery_code', '');

        $passed = false;
        if ($code !== '' && $user->verifyCode($code)) {
            $passed = true;
        } elseif ($recovery !== '' && $user->useRecoveryCode($recovery)) {
            $passed = true;
        }

        if (! $passed) {
            RateLimiter::hit($this->throttleKey($request));

            throw ValidationException::withMessages([
                'code' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey($request));

        Auth::guard($guard)->login($user, $remember);
        $request->session()->regenerate();
        $request->session()->forget(['auth.two_factor.user_id', 'auth.two_factor.guard', 'auth.two_factor.remember']);

        return redirect()->intended(AuthContext::homePath());
    }

    private function ensureIsNotRateLimited(Request $request): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request), 5)) {
            return;
        }

        event(new Lockout($request));

        $seconds = RateLimiter::availableIn($this->throttleKey($request));

        throw ValidationException::withMessages([
            'code' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => (int) ceil($seconds / 60),
            ]),
        ]);
    }

    private function throttleKey(Request $request): string
    {
        $userId = $request->session()->get('auth.two_factor.user_id', 'anon');

        return Str::transliterate('two-factor|'.$userId.'|'.$request->ip());
    }
}
