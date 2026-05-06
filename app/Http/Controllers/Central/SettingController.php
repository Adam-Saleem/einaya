<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateSettingsRequest;
use App\Models\Central\GlobalSetting;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    /**
     * Each section is keyed in `global_settings.key` so we can edit a single
     * tab without rewriting the whole bag (and so each save shows a discrete
     * audit row).
     */
    private const SECTIONS = ['general', 'legal', 'branding'];

    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(): Response
    {
        $values = GlobalSetting::whereIn('key', self::SECTIONS)
            ->pluck('value', 'key')
            ->toArray();

        return Inertia::render('Central/Settings/Index', [
            'settings' => [
                'general' => $values['general'] ?? [],
                'legal' => $values['legal'] ?? [],
                'branding' => $values['branding'] ?? [],
            ],
        ]);
    }

    public function update(UpdateSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();

        foreach (self::SECTIONS as $section) {
            if (! array_key_exists($section, $data)) {
                continue;
            }

            $previous = GlobalSetting::where('key', $section)->value('value') ?? [];
            $next = array_filter(
                $data[$section] ?? [],
                fn ($v) => $v !== null && $v !== '',
            );

            GlobalSetting::updateOrCreate(['key' => $section], ['value' => $next]);

            $this->audit->log(
                $request->user(),
                "settings.{$section}.updated",
                null,
                $previous,
                $next,
            );
        }

        return back()->with('success', 'Settings saved.');
    }
}
