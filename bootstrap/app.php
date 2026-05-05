<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            Route::middleware('web')
                ->group(__DIR__.'/../routes/central.php');
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'central' => \App\Http\Middleware\EnsureCentralContext::class,
            'two_factor' => \App\Http\Middleware\RequireTwoFactor::class,
            'design_system' => \App\Http\Middleware\AllowDesignSystem::class,
        ]);

        // Auth routes are registered with context-prefixed names
        // (`central.login` / `tenant.login`) — there is no global `login` route,
        // so the default Authenticate middleware can't resolve it. Redirect
        // unauthenticated guests to `/login` on the current host instead.
        $middleware->redirectGuestsTo(fn () => '/login');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
