<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\StoreDemoRequest;
use App\Models\Central\DemoRequest;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;

class DemoRequestController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function store(StoreDemoRequest $request): RedirectResponse
    {
        $payload = $request->safe()->only([
            'clinic_name',
            'contact_name',
            'email',
            'phone',
            'country',
            'intent',
            'message',
        ]);

        $demoRequest = DemoRequest::create($payload + [
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
        ]);

        // Log against the central audit trail so super admins see new
        // leads in the recent-activity feed even before they open the
        // dedicated index page.
        $this->audit->log(
            null,
            'demo_request.created',
            $demoRequest,
            [],
            [
                'intent' => $demoRequest->intent,
                'clinic_name' => $demoRequest->clinic_name,
                'email' => $demoRequest->email,
            ],
        );

        return back()->with('success', __('Thanks — we will reach out within one business day.'));
    }
}
