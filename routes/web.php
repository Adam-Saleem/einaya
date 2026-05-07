<?php

declare(strict_types=1);

use App\Http\Controllers\DemoRequestController;
use App\Http\Controllers\PreferenceController;
use App\Models\Central\SubscriptionPlan;
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

        Route::get('/about', function () {
            return Inertia::render('About');
        })->name('marketing.about');

        Route::get('/pricing', function () {
            $plans = SubscriptionPlan::query()
                ->where('is_active', true)
                ->orderBy('order')
                ->get(['id', 'slug', 'name', 'price_monthly', 'price_yearly', 'max_patients', 'max_staff', 'features'])
                ->map(fn ($p) => [
                    'id' => $p->id,
                    'slug' => $p->slug,
                    'name' => $p->name,
                    'price_monthly' => (float) $p->price_monthly,
                    'price_yearly' => (float) $p->price_yearly,
                    'max_patients' => $p->max_patients,
                    'max_staff' => $p->max_staff,
                    'features' => $p->features ?? [],
                ]);

            return Inertia::render('Pricing', [
                'plans' => $plans,
            ]);
        })->name('marketing.pricing');

        // Public demo / register-clinic submission. Throttled per IP so a
        // bot can't fill the leads inbox; honeypot validation in the form
        // request catches naive scrapers.
        Route::post('/demo-request', [DemoRequestController::class, 'store'])
            ->middleware('throttle:5,60')
            ->name('marketing.demoRequest');

        // Marketing surface has no auth, so the theme + language toggles
        // need public endpoints. PreferenceController gracefully no-ops the
        // user-pref write when there's no authed user and just stamps the
        // session locale — that's all the marketing site needs.
        Route::post('/api/preferences/language', [PreferenceController::class, 'language'])
            ->name('marketing.preferences.language');
        Route::post('/api/preferences/theme', [PreferenceController::class, 'theme'])
            ->name('marketing.preferences.theme');
    });
}
