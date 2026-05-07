<?php

declare(strict_types=1);

use App\Http\Controllers\DemoRequestController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Marketing root
|--------------------------------------------------------------------------
|
| Restricted to the bare central root domains so this route does not
| collide with routes/tenant.php's `/`. Auth + profile routes live in
| context-scoped files (routes/central.php, routes/tenant.php).
|
*/
foreach (['einaya.ps', 'einaya.test', 'localhost', '127.0.0.1'] as $domain) {
    Route::domain($domain)->group(function () {
        Route::get('/', function () {
            return Inertia::render('Welcome');
        })->name('marketing.home');

        // Public demo / register-clinic submission. Throttled per IP so a
        // bot can't fill the leads inbox; honeypot validation in the form
        // request catches naive scrapers.
        Route::post('/demo-request', [DemoRequestController::class, 'store'])
            ->middleware('throttle:5,60')
            ->name('marketing.demoRequest');
    });
}
