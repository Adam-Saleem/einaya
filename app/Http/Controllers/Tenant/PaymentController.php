<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Actions\Tenant\RecordPaymentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePaymentRequest;
use App\Http\Resources\Tenant\PaymentResource;
use App\Models\Tenant\ClinicSetting;
use App\Models\Tenant\Payment;
use App\Models\Tenant\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensureCan($request->user(), 'payments.view');

        $query = Payment::query()->with(['patient', 'collector:id,name']);

        if ($from = $request->date('from')) {
            $query->where('paid_at', '>=', $from);
        }
        if ($to = $request->date('to')) {
            $query->where('paid_at', '<=', $to);
        }
        if ($method = $request->string('method')->toString()) {
            $query->where('method', $method);
        }

        $totalQuery = clone $query;
        $payments = $query->latest('paid_at')->paginate(25)->withQueryString();

        return Inertia::render('Tenant/Payments/Index', [
            'payments' => PaymentResource::collection($payments),
            'totals' => [
                'amount' => (float) $totalQuery->sum('amount'),
                'count' => (int) $totalQuery->count(),
            ],
            'filters' => [
                'from' => $request->string('from')->toString(),
                'to' => $request->string('to')->toString(),
                'method' => $request->string('method')->toString(),
            ],
        ]);
    }

    public function store(StorePaymentRequest $request, RecordPaymentAction $action): RedirectResponse
    {
        $payment = $action->execute($request->validated(), $request->user());

        return redirect("/payments/{$payment->id}/receipt")
            ->with('success', "Payment recorded: {$payment->receipt_number}");
    }

    public function receipt(Request $request, Payment $payment): Response
    {
        $this->ensureCan($request->user(), 'payments.view');

        $payment->load(['patient', 'collector:id,name', 'appointment']);

        $clinic = [
            'general' => ClinicSetting::where('key', 'general')->value('value') ?? [],
            'branding' => ClinicSetting::where('key', 'branding')->value('value') ?? [],
            'receipt' => ClinicSetting::where('key', 'receipt')->value('value') ?? [],
        ];

        return Inertia::render('Tenant/Payments/Receipt', [
            'payment' => (new PaymentResource($payment))->toArray($request),
            'clinic' => $clinic,
            'patient' => $payment->patient ? [
                'id' => $payment->patient->id,
                'name' => trim($payment->patient->first_name.' '.$payment->patient->last_name),
                'patient_code' => $payment->patient->patient_code,
                'phone' => $payment->patient->phone,
                'preferred_language' => $payment->patient->preferred_language?->value ?? 'ar',
            ] : null,
        ]);
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
