<?php

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Actions\Central\ChangeClinicPlanAction;
use App\Actions\Central\CreateClinicAction;
use App\Actions\Central\SuspendClinicAction;
use App\Enums\Central\ClinicStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StoreClinicRequest;
use App\Http\Requests\Central\UpdateClinicRequest;
use App\Http\Resources\Central\AuditLogResource;
use App\Http\Resources\Central\ClinicResource;
use App\Http\Resources\Central\PlanResource;
use App\Models\Central\CentralAuditLog;
use App\Models\Central\Clinic;
use App\Models\Central\GlobalSetting;
use App\Models\Central\SubscriptionPlan;
use App\Services\Central\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClinicController extends Controller
{
    public function __construct(private AuditLogService $audit)
    {
    }

    public function index(Request $request): Response
    {
        $query = Clinic::query()->with(['subscription.plan', 'domains']);

        if ($status = $request->string('status')->toString()) {
            if (ClinicStatus::tryFrom($status) !== null) {
                $query->where('status', $status);
            }
        }

        if ($plan = $request->string('plan')->toString()) {
            $query->whereHas('subscription.plan', fn ($q) => $q->where('slug', $plan));
        }

        if ($search = $request->string('search')->toString()) {
            $like = '%'.$search.'%';
            $query->where(function ($q) use ($like) {
                $q->where('name', 'like', $like)
                    ->orWhere('slug', 'like', $like)
                    ->orWhere('owner_email', 'like', $like);
            });
        }

        $clinics = $query->latest('created_at')->paginate(20)->withQueryString();

        return Inertia::render('Central/Clinics/Index', [
            'clinics' => ClinicResource::collection($clinics),
            'filters' => [
                'status' => $request->string('status')->toString(),
                'plan' => $request->string('plan')->toString(),
                'search' => $request->string('search')->toString(),
            ],
            'plans' => PlanResource::collection(
                SubscriptionPlan::where('is_active', true)->orderBy('order')->get(),
            ),
            'statuses' => collect(ClinicStatus::cases())->map(fn ($s) => [
                'value' => $s->value,
                'label' => $s->label(),
            ]),
        ]);
    }

    public function store(StoreClinicRequest $request, CreateClinicAction $action): RedirectResponse
    {
        $result = $action->execute($request->validated(), $request->user());

        return redirect()
            ->route('central.clinics.show', $result['clinic']->id)
            ->with('success', sprintf(
                'Clinic created. Temporary admin password for %s: %s',
                $result['admin_email'],
                $result['temp_password'],
            ));
    }

    public function show(string $clinic): Response
    {
        /** @var Clinic $clinicModel */
        $clinicModel = Clinic::with(['subscription.plan', 'domains'])->findOrFail($clinic);

        $stats = GlobalSetting::where('key', 'platform_stats')->value('value') ?? [];
        $perClinic = $stats['per_clinic'][$clinicModel->id] ?? null;

        return Inertia::render('Central/Clinics/Show', [
            'clinic' => (new ClinicResource($clinicModel))->toArray(request()),
            'plans' => PlanResource::collection(
                SubscriptionPlan::where('is_active', true)->orderBy('order')->get(),
            ),
            'usage' => $perClinic,
            'auditLogs' => AuditLogResource::collection(
                CentralAuditLog::with('user')
                    ->where('auditable_type', Clinic::class)
                    ->where('auditable_id', $clinicModel->id)
                    ->latest('created_at')
                    ->limit(50)
                    ->get(),
            ),
        ]);
    }

    public function update(UpdateClinicRequest $request, string $clinic): RedirectResponse
    {
        /** @var Clinic $clinicModel */
        $clinicModel = Clinic::findOrFail($clinic);

        $original = $clinicModel->only(['name', 'owner_name', 'owner_email', 'owner_phone', 'trial_ends_at']);
        $clinicModel->fill($request->validated())->save();

        $this->audit->log(
            $request->user(),
            'clinic.updated',
            $clinicModel,
            $original,
            $clinicModel->only(['name', 'owner_name', 'owner_email', 'owner_phone', 'trial_ends_at']),
        );

        return back()->with('success', 'Clinic updated.');
    }

    public function suspend(Request $request, string $clinic, SuspendClinicAction $action): RedirectResponse
    {
        $clinicModel = Clinic::findOrFail($clinic);
        $action->suspend(
            $clinicModel,
            $request->user(),
            $request->string('reason')->toString() ?: null,
        );

        return back()->with('success', 'Clinic suspended.');
    }

    public function activate(Request $request, string $clinic, SuspendClinicAction $action): RedirectResponse
    {
        $clinicModel = Clinic::findOrFail($clinic);
        $action->activate($clinicModel, $request->user());

        return back()->with('success', 'Clinic activated.');
    }

    public function destroy(Request $request, string $clinic, SuspendClinicAction $action): RedirectResponse
    {
        $clinicModel = Clinic::findOrFail($clinic);
        $action->cancel($clinicModel, $request->user(), 'Soft-deleted by super admin');
        $clinicModel->delete();

        return redirect()
            ->route('central.clinics.index')
            ->with('success', 'Clinic cancelled and archived.');
    }

    public function changePlan(Request $request, string $clinic, ChangeClinicPlanAction $action): RedirectResponse
    {
        $request->validate([
            'plan_id' => ['required', 'integer', 'exists:subscription_plans,id'],
        ]);

        $clinicModel = Clinic::findOrFail($clinic);
        $plan = SubscriptionPlan::findOrFail($request->integer('plan_id'));
        $action->execute($clinicModel, $plan, $request->user());

        return back()->with('success', 'Plan changed.');
    }
}
