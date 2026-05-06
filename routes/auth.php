<?php

declare(strict_types=1);

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\TwoFactorChallengeController;
use App\Http\Controllers\Auth\TwoFactorSetupController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/**
 * Shared auth routes — registered once per context (central + tenant). The
 * caller passes a name prefix so route names don't collide across contexts:
 *   `central.login`  vs  `tenant.login`
 *
 * Self-registration (`/register`) is intentionally NOT included for v1:
 *   - tenant users are created by the clinic admin
 *   - super admins are seeded
 *
 * The same controllers serve both contexts. They detect which guard to use
 * via config('auth.defaults.guard'), which the EnsureCentralContext
 * middleware sets to `web_central` for central routes (defaults to `web`
 * for tenant routes).
 */
return function (string $prefix): void {
    Route::middleware('guest')->group(function () use ($prefix) {
        Route::get('login', [AuthenticatedSessionController::class, 'create'])
            ->name($prefix.'.login');
        Route::post('login', [AuthenticatedSessionController::class, 'store']);

        Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])
            ->name($prefix.'.password.request');
        Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])
            ->name($prefix.'.password.email');

        Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
            ->name($prefix.'.password.reset');
        Route::post('reset-password', [NewPasswordController::class, 'store'])
            ->name($prefix.'.password.store');

        // Two-factor challenge — gated by an interim "pending 2FA" session
        // flag set by AuthenticatedSessionController::store(). The user is
        // not yet `auth`'d when they hit this route.
        Route::get('two-factor/challenge', [TwoFactorChallengeController::class, 'show'])
            ->name($prefix.'.two-factor.challenge');
        Route::post('two-factor/challenge', [TwoFactorChallengeController::class, 'store']);
    });

    Route::middleware('auth')->group(function () use ($prefix) {
        Route::get('verify-email', EmailVerificationPromptController::class)
            ->name($prefix.'.verification.notice');
        Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
            ->middleware(['signed', 'throttle:6,1'])
            ->name($prefix.'.verification.verify');
        Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
            ->middleware('throttle:6,1')
            ->name($prefix.'.verification.send');

        Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
            ->name($prefix.'.password.confirm');
        Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

        Route::put('password', [PasswordController::class, 'update'])
            ->name($prefix.'.password.update');

        Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
            ->name($prefix.'.logout');

        // Profile
        Route::get('profile', [ProfileController::class, 'edit'])
            ->name($prefix.'.profile.edit');
        Route::patch('profile', [ProfileController::class, 'update'])
            ->name($prefix.'.profile.update');

        // Two-factor setup
        Route::get('two-factor', [TwoFactorSetupController::class, 'show'])
            ->name($prefix.'.two-factor.setup');
        Route::post('two-factor', [TwoFactorSetupController::class, 'enable'])
            ->name($prefix.'.two-factor.enable');
        Route::post('two-factor/confirm', [TwoFactorSetupController::class, 'confirm'])
            ->name($prefix.'.two-factor.confirm');
        Route::post('two-factor/recovery-codes', [TwoFactorSetupController::class, 'regenerateRecoveryCodes'])
            ->name($prefix.'.two-factor.recovery-codes');
        Route::delete('two-factor', [TwoFactorSetupController::class, 'disable'])
            ->name($prefix.'.two-factor.disable');
    });
};
