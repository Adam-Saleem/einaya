<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateClinicSettingsRequest;
use App\Http\Requests\Tenant\UploadLogoRequest;
use App\Models\Tenant\ClinicSetting;
use App\Services\Tenant\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    private const SECTIONS = ['general', 'branding', 'localization', 'receipt', 'notifications'];

    public function __construct(private AuditLogService $audit)
    {
    }

    public function show(): Response
    {
        if (! request()->user()?->can('clinic.view_settings')) {
            abort(403);
        }

        $values = ClinicSetting::whereIn('key', self::SECTIONS)
            ->pluck('value', 'key')
            ->toArray();

        return Inertia::render('Tenant/Settings/Index', [
            'settings' => collect(self::SECTIONS)
                ->mapWithKeys(fn ($key) => [$key => $values[$key] ?? []])
                ->toArray(),
        ]);
    }

    public function update(UpdateClinicSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();

        foreach (self::SECTIONS as $section) {
            if (! array_key_exists($section, $data)) continue;

            $previous = ClinicSetting::where('key', $section)->value('value') ?? [];
            $next = collect($data[$section] ?? [])
                ->reject(fn ($v) => $v === null || $v === '')
                ->all();

            ClinicSetting::updateOrCreate(['key' => $section], ['value' => $next]);
            $this->audit->log($request->user(), "clinic.{$section}.updated", null, $previous, $next);
        }

        return back()->with('success', 'Settings saved.');
    }

    public function uploadLogo(UploadLogoRequest $request): RedirectResponse
    {
        $path = $request->file('logo')->store('branding', 'public');

        $current = ClinicSetting::where('key', 'branding')->value('value') ?? [];
        $previous = $current['logo_url'] ?? null;
        $current['logo_url'] = '/storage/'.$path;

        ClinicSetting::updateOrCreate(['key' => 'branding'], ['value' => $current]);
        $this->audit->log(
            $request->user(),
            'clinic.branding.logo_uploaded',
            null,
            ['logo_url' => $previous],
            ['logo_url' => $current['logo_url']],
        );

        return back()->with('success', 'Logo uploaded.');
    }
}
