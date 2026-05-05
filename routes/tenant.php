<?php

declare(strict_types=1);

use App\Http\Controllers\PreferenceController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Loaded by TenancyServiceProvider::mapRoutes(). Auth + profile use the
| default `web` guard which points at App\Models\Tenant\User in the active
| tenant DB.
|
*/

Route::middleware([
    'web',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function () {
    // Shared auth routes — names prefixed with `tenant.`.
    (require __DIR__.'/auth.php')('tenant');

    Route::get('/', function () {
        if (auth()->check()) {
            return Inertia::render('Tenant/Dashboard', [
                'tenantId' => tenant('id'),
            ]);
        }

        return Inertia::render('Tenant/Welcome', [
            'tenantId' => tenant('id'),
        ]);
    })->name('tenant.welcome');

    Route::middleware('auth')->group(function () {
        Route::post('/api/preferences/language', [PreferenceController::class, 'language'])
            ->name('tenant.preferences.language');
        Route::post('/api/preferences/theme', [PreferenceController::class, 'theme'])
            ->name('tenant.preferences.theme');
    });

    Route::middleware('design_system')->get('/design-system', function () {
        return Inertia::render('DesignSystem', ['context' => 'tenant']);
    })->name('tenant.design-system');

    Route::post('/api/preferences/language/guest', [PreferenceController::class, 'language'])
        ->name('tenant.preferences.language.guest');
});
