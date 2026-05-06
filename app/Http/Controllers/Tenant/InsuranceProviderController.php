<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreInsuranceProviderRequest;
use App\Http\Requests\Tenant\UpdateInsuranceProviderRequest;
use App\Http\Resources\Tenant\InsuranceProviderResource;
use App\Models\Tenant\InsuranceProvider;
use App\Models\Tenant\User;
use App\Services\Tenant\AuditLogService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InsuranceProviderController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $this->ensureCan($request->user(), 'insurance.view');

        $providers = InsuranceProvider::query()
            ->withCount('patients')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tenant/InsuranceProviders/Index', [
            'providers' => InsuranceProviderResource::collection($providers),
        ]);
    }

    public function store(StoreInsuranceProviderRequest $request): RedirectResponse
    {
        $provider = InsuranceProvider::create($request->validated());
        $this->audit->log($request->user(), 'insurance.created', $provider, [], $provider->only(['name', 'is_active']));

        return back()->with('success', 'Insurance provider added.');
    }

    public function update(UpdateInsuranceProviderRequest $request, InsuranceProvider $insurance_provider): RedirectResponse
    {
        $original = $insurance_provider->only(['name', 'is_active']);
        $insurance_provider->fill($request->validated())->save();

        $this->audit->log(
            $request->user(),
            'insurance.updated',
            $insurance_provider,
            $original,
            $insurance_provider->only(['name', 'is_active']),
        );

        return back()->with('success', 'Insurance provider updated.');
    }

    public function destroy(Request $request, InsuranceProvider $insurance_provider): RedirectResponse
    {
        $this->ensureCan($request->user(), 'insurance.manage');

        if ($insurance_provider->patients()->exists()) {
            return back()->with(
                'error',
                'Cannot remove a provider that has patients linked. Mark it inactive instead.',
            );
        }

        $insurance_provider->delete();
        $this->audit->log($request->user(), 'insurance.deleted', $insurance_provider);

        return back()->with('success', 'Insurance provider archived.');
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
