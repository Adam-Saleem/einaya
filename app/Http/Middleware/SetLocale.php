<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->session()->get('locale')
            ?? ($request->user()?->preferred_language)
            ?? config('app.locale');

        if (in_array($locale, ['en', 'ar'], true)) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
