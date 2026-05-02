<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Support\AuthContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Auth/ConfirmPassword', [
            'context' => AuthContext::prefix(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $valid = Auth::guard(AuthContext::guard())->validate([
            'email' => $request->user()->email,
            'password' => $request->password,
        ]);

        if (! $valid) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());

        return redirect()->intended(AuthContext::homePath());
    }
}
