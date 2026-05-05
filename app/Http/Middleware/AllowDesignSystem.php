<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AllowDesignSystem
{
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local', 'development')) {
            return $next($request);
        }

        $user = $request->user();
        if ($user && ($user->is_super_admin ?? false)) {
            return $next($request);
        }

        abort(404);
    }
}
