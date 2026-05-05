<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PreferenceController extends Controller
{
    public function language(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'language' => ['required', Rule::in(['en', 'ar'])],
        ]);

        if ($user = $request->user()) {
            $user->forceFill(['preferred_language' => $validated['language']])->save();
        }

        $request->session()->put('locale', $validated['language']);
        app()->setLocale($validated['language']);

        return back();
    }

    public function theme(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'theme' => ['required', Rule::in(['light', 'dark', 'system'])],
        ]);

        if ($user = $request->user()) {
            $user->forceFill(['theme_preference' => $validated['theme']])->save();
        }

        return back();
    }
}
