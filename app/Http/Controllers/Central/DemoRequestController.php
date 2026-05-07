<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Resources\Central\DemoRequestResource;
use App\Models\Central\DemoRequest;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DemoRequestController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $intent = $request->query('intent', '');
        $country = $request->query('country', '');
        $handled = $request->query('handled', 'unhandled');

        $rows = DemoRequest::query()
            ->with('handler:id,name,email')
            ->when($search !== '', function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $like = '%'.$search.'%';
                    $qq->where('clinic_name', 'like', $like)
                        ->orWhere('contact_name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like);
                });
            })
            ->when(in_array($intent, ['demo', 'register'], true), fn ($q) => $q->where('intent', $intent))
            ->when(is_string($country) && $country !== '', fn ($q) => $q->where('country', strtoupper($country)))
            ->when($handled === 'unhandled', fn ($q) => $q->where('is_handled', false))
            ->when($handled === 'handled', fn ($q) => $q->where('is_handled', true))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Central/DemoRequests/Index', [
            'requests' => DemoRequestResource::collection($rows),
            'filters' => [
                'search' => $search,
                'intent' => is_string($intent) ? $intent : '',
                'country' => is_string($country) ? strtoupper($country) : '',
                'handled' => is_string($handled) ? $handled : 'unhandled',
            ],
            'unhandledCount' => DemoRequest::query()->where('is_handled', false)->count(),
        ]);
    }

    public function update(Request $request, DemoRequest $demoRequest): RedirectResponse
    {
        $data = $request->validate([
            'is_handled' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        $old = $demoRequest->only(['is_handled', 'notes', 'handled_at', 'handled_by']);
        $payload = [];

        if (array_key_exists('notes', $data)) {
            $payload['notes'] = $data['notes'];
        }

        if (array_key_exists('is_handled', $data)) {
            $payload['is_handled'] = (bool) $data['is_handled'];
            $payload['handled_at'] = $payload['is_handled'] ? now() : null;
            $payload['handled_by'] = $payload['is_handled'] ? $request->user()?->id : null;
        }

        $demoRequest->update($payload);

        if (array_key_exists('is_handled', $data)) {
            $this->audit->log(
                $request->user(),
                $payload['is_handled'] ? 'demo_request.handled' : 'demo_request.reopened',
                $demoRequest,
                $old,
                $demoRequest->only(['is_handled', 'notes', 'handled_at', 'handled_by']),
            );
        }

        return back()->with('success', __('Saved.'));
    }
}
