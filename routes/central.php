<?php

declare(strict_types=1);

use App\Http\Controllers\Central\AuditController;
use App\Http\Controllers\Central\ClinicController;
use App\Http\Controllers\Central\DashboardController;
use App\Http\Controllers\Central\PlanController;
use App\Http\Controllers\Central\SettingController;
use App\Http\Controllers\Central\SubscriptionController;
use App\Http\Controllers\Central\TicketController;
use App\Http\Controllers\PreferenceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Central Routes — Super Admin
|--------------------------------------------------------------------------
|
| Routes that run in the central context on app.einaya.ps / app.einaya.test.
| Loaded by bootstrap/app.php with the `web` middleware group; the `central`
| alias swaps the default auth guard to `web_central` so shared controllers
| and Auth::user() resolve to App\Models\Central\User.
|
*/

foreach (['app.einaya.ps', 'app.einaya.test'] as $domain) {
    Route::domain($domain)->middleware('central')->group(function () {
        // Shared auth routes (login, password, 2FA, profile) — names prefixed
        // with `central.` so they don't collide with the tenant copy.
        (require __DIR__.'/auth.php')('central');

        Route::middleware('design_system')->get('/design-system', function () {
            return Inertia::render('DesignSystem', ['context' => 'central']);
        })->name('central.design-system');

        Route::post('/api/preferences/language/guest', [PreferenceController::class, 'language'])
            ->name('central.preferences.language.guest');

        Route::post('/api/client-errors', [ClientErrorController::class, 'store'])
            ->name('central.client-errors');

        Route::middleware(['auth', 'super_admin'])->group(function () {
            Route::get('/', [DashboardController::class, 'index'])->name('central.dashboard');
            Route::post('/api/aggregate-stats', [DashboardController::class, 'refreshStats'])
                ->name('central.dashboard.refresh');

            Route::post('/api/preferences/language', [PreferenceController::class, 'language'])
                ->name('central.preferences.language');
            Route::post('/api/preferences/theme', [PreferenceController::class, 'theme'])
                ->name('central.preferences.theme');

            Route::get('/clinics', [ClinicController::class, 'index'])->name('central.clinics.index');
            Route::post('/clinics', [ClinicController::class, 'store'])->name('central.clinics.store');
            Route::get('/clinics/{clinic}', [ClinicController::class, 'show'])->name('central.clinics.show');
            Route::patch('/clinics/{clinic}', [ClinicController::class, 'update'])->name('central.clinics.update');
            Route::post('/clinics/{clinic}/suspend', [ClinicController::class, 'suspend'])->name('central.clinics.suspend');
            Route::post('/clinics/{clinic}/activate', [ClinicController::class, 'activate'])->name('central.clinics.activate');
            Route::post('/clinics/{clinic}/plan', [ClinicController::class, 'changePlan'])->name('central.clinics.change-plan');
            Route::delete('/clinics/{clinic}', [ClinicController::class, 'destroy'])->name('central.clinics.destroy');

            Route::get('/plans', [PlanController::class, 'index'])->name('central.plans.index');
            Route::post('/plans', [PlanController::class, 'store'])->name('central.plans.store');
            Route::patch('/plans/{plan}', [PlanController::class, 'update'])->name('central.plans.update');
            Route::delete('/plans/{plan}', [PlanController::class, 'destroy'])->name('central.plans.destroy');

            Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('central.subscriptions.index');
            Route::patch('/subscriptions/{subscription}', [SubscriptionController::class, 'update'])
                ->name('central.subscriptions.update');

            Route::get('/tickets', [TicketController::class, 'index'])->name('central.tickets.index');
            Route::get('/tickets/{ticket}', [TicketController::class, 'show'])->name('central.tickets.show');
            Route::patch('/tickets/{ticket}', [TicketController::class, 'update'])->name('central.tickets.update');

            Route::get('/audit', [AuditController::class, 'index'])->name('central.audit.index');

            Route::get('/settings', [SettingController::class, 'index'])->name('central.settings.index');
            Route::patch('/settings', [SettingController::class, 'update'])->name('central.settings.update');
        });
    });
}
