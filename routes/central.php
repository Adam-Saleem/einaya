<?php

declare(strict_types=1);

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

        Route::get('/', function () {
            return Inertia::render('Central/SuperAdmin');
        })->middleware('auth')->name('central.dashboard');
    });
}
