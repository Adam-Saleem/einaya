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
| Loaded by bootstrap/app.php with the `web` middleware group.
|
*/

foreach (['app.einaya.ps', 'app.einaya.test'] as $domain) {
    Route::domain($domain)->group(function () {
        Route::get('/', function () {
            return Inertia::render('Central/SuperAdmin');
        })->name('central.dashboard');
    });
}
