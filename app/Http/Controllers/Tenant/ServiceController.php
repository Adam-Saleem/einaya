<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreServiceRequest;
use App\Http\Requests\Tenant\UpdateServiceRequest;
use App\Http\Resources\Tenant\ServiceResource;
use App\Models\Tenant\Service;
use App\Services\Tenant\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        if (! $request->user()?->can('services.manage')) {
            abort(403);
        }

        $services = Service::query()
            ->orderBy('display_order')
            ->orderBy('name')
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('Tenant/Services/Index', [
            'services' => ServiceResource::collection($services),
        ]);
    }

    public function store(StoreServiceRequest $request): RedirectResponse
    {
        $service = Service::create($request->safe()->all());

        $this->audit->log(
            $request->user(),
            'service.created',
            $service,
            [],
            $service->only(['name', 'code', 'price', 'is_active']),
        );

        return back()->with('success', __('Service created.'));
    }

    public function update(UpdateServiceRequest $request, Service $service): RedirectResponse
    {
        $old = $service->only(['name', 'code', 'price', 'is_active', 'description']);
        $service->update($request->safe()->all());

        $this->audit->log(
            $request->user(),
            'service.updated',
            $service,
            $old,
            $service->only(['name', 'code', 'price', 'is_active', 'description']),
        );

        return back()->with('success', __('Service updated.'));
    }

    public function destroy(Request $request, Service $service): RedirectResponse
    {
        if (! $request->user()?->can('services.manage')) {
            abort(403);
        }

        $old = $service->only(['name', 'code', 'price']);
        $service->delete();

        $this->audit->log($request->user(), 'service.deleted', $service, $old, []);

        return back()->with('success', __('Service archived.'));
    }
}
