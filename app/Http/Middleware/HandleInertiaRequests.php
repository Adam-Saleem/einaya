<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $locale = $request->session()->get('locale')
            ?? ($user?->preferred_language)
            ?? app()->getLocale();
        $theme = $user?->theme_preference ?? 'light';

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                // Tenant\User has Spatie's HasRoles trait; Central\User does
                // not. method_exists() keeps this middleware context-agnostic
                // — the central super admin just gets empty arrays.
                'permissions' => $user !== null && method_exists($user, 'getAllPermissions')
                    ? $user->getAllPermissions()->pluck('name')->values()->all()
                    : [],
                'roles' => $user !== null && method_exists($user, 'getRoleNames')
                    ? $user->getRoleNames()->values()->all()
                    : [],
                'isSuperAdmin' => (bool) ($user->is_super_admin ?? false),
            ],
            'preferences' => [
                'locale' => $locale,
                'direction' => $locale === 'ar' ? 'rtl' : 'ltr',
                'theme' => $theme,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'status' => $request->session()->get('status'),
                // Phase 11.6: surface PatientController's duplicate-phone
                // matches to the registration dialog. Stashed via
                // back()->with('duplicate_phone_matches', ...) and only
                // present on the immediate next render.
                'duplicate_phone_matches' => $request->session()->get('duplicate_phone_matches'),
            ],
        ];
    }
}
