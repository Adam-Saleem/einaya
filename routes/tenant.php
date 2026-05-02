<?php

declare(strict_types=1);

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
});
