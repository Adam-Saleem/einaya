<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\AuthContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * 2FA enable / confirm / regenerate-codes / disable. Lives on the
 * authenticated profile area — the user is already logged in here.
 */
class TwoFactorSetupController extends Controller
{
    public function show(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Auth/TwoFactorSetup', [
            'context' => AuthContext::prefix(),
            'enabled' => $user->hasTwoFactorEnabled(),
            'pendingConfirmation' => $user->two_factor_secret !== null && $user->two_factor_confirmed_at === null,
        ]);
    }

    public function enable(Request $request): RedirectResponse
    {
        $payload = $request->user()->enableTwoFactor();

        return redirect()
            ->route(AuthContext::prefix().'.two-factor.setup')
            ->with('two_factor', [
                'qr_svg' => $payload['qr_svg'],
                'secret' => $payload['secret'],
                'otpauth_url' => $payload['otpauth_url'],
            ]);
    }

    public function confirm(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'min:4', 'max:10'],
        ]);

        $codes = $request->user()->confirmTwoFactor((string) $request->input('code'));

        if ($codes === null) {
            throw ValidationException::withMessages([
                'code' => trans('auth.failed'),
            ]);
        }

        return redirect()
            ->route(AuthContext::prefix().'.two-factor.setup')
            ->with('recovery_codes', $codes)
            ->with('status', 'two-factor-confirmed');
    }

    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    {
        if (! $request->user()->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages([
                'code' => 'Two-factor authentication is not enabled.',
            ]);
        }

        $codes = $request->user()->regenerateRecoveryCodes();

        return redirect()
            ->route(AuthContext::prefix().'.two-factor.setup')
            ->with('recovery_codes', $codes)
            ->with('status', 'recovery-codes-regenerated');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->user()->disableTwoFactor();

        return redirect()
            ->route(AuthContext::prefix().'.two-factor.setup')
            ->with('status', 'two-factor-disabled');
    }
}
