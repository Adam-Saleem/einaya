<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Appointment;
use App\Models\Tenant\Diagnosis;
use App\Models\Tenant\Patient;
use App\Models\Tenant\Payment;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    /**
     * @return array{rows: Collection<int, array<string, mixed>>, totals: array<string, mixed>}
     */
    public function appointments(Carbon $from, Carbon $to): array
    {
        $rows = Appointment::query()
            ->whereBetween('scheduled_for', [$from, $to])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => is_object($row->status) ? $row->status->value : (string) $row->status,
                'count' => (int) $row->count,
            ]);

        return [
            'rows' => $rows,
            'totals' => [
                'all' => (int) $rows->sum('count'),
            ],
        ];
    }

    /**
     * @return array{rows: Collection<int, array<string, mixed>>, totals: array<string, mixed>}
     */
    public function revenue(Carbon $from, Carbon $to): array
    {
        $payments = Payment::query()
            ->whereBetween('paid_at', [$from, $to])
            ->get(['method', 'amount', 'cash_amount', 'card_amount', 'insurance_amount']);

        $byMethod = $payments
            ->groupBy(fn ($p) => is_object($p->method) ? $p->method->value : (string) $p->method)
            ->map(fn (Collection $group, $method) => [
                'method' => $method,
                'count' => $group->count(),
                'amount' => (float) $group->sum('amount'),
            ])
            ->values();

        return [
            'rows' => $byMethod,
            'totals' => [
                'count' => $payments->count(),
                'amount' => (float) $payments->sum('amount'),
                'cash' => (float) $payments->sum('cash_amount'),
                'card' => (float) $payments->sum('card_amount'),
                'insurance' => (float) $payments->sum('insurance_amount'),
            ],
        ];
    }

    /**
     * @return array{rows: Collection<int, array<string, mixed>>, totals: array<string, mixed>}
     */
    public function patients(Carbon $from, Carbon $to): array
    {
        $patients = Patient::query()
            ->whereBetween('created_at', [$from, $to])
            ->get(['gender', 'date_of_birth']);

        $byGender = $patients
            ->groupBy(fn ($p) => is_object($p->gender) ? $p->gender->value : (string) ($p->gender ?? 'unknown'))
            ->map(fn (Collection $group, $gender) => [
                'gender' => $gender,
                'count' => $group->count(),
            ])
            ->values();

        $ageBuckets = ['0-12', '13-25', '26-40', '41-60', '61+'];
        $byAge = collect($ageBuckets)->mapWithKeys(fn ($b) => [$b => 0])->toArray();
        foreach ($patients as $patient) {
            if ($patient->date_of_birth === null) continue;
            $age = Carbon::parse($patient->date_of_birth)->age;
            $bucket = match (true) {
                $age <= 12 => '0-12',
                $age <= 25 => '13-25',
                $age <= 40 => '26-40',
                $age <= 60 => '41-60',
                default => '61+',
            };
            $byAge[$bucket]++;
        }

        // "Returning" = patients with appointments in the window who were
        // registered before the window started.
        $returning = Patient::query()
            ->whereHas('appointments', fn ($q) => $q->whereBetween('scheduled_for', [$from, $to]))
            ->where('created_at', '<', $from)
            ->count();

        return [
            'rows' => collect([
                'gender' => $byGender,
                'age' => collect($byAge)->map(fn ($count, $bucket) => [
                    'bucket' => $bucket,
                    'count' => $count,
                ])->values(),
            ])->collect(),
            'totals' => [
                'new' => $patients->count(),
                'returning' => $returning,
            ],
        ];
    }

    /**
     * @return array{rows: Collection<int, array<string, mixed>>, totals: array<string, mixed>}
     */
    public function diagnoses(Carbon $from, Carbon $to): array
    {
        $rows = Diagnosis::query()
            ->whereHas('consultation', fn ($q) => $q->whereBetween('started_at', [$from, $to]))
            ->selectRaw('description, code, COUNT(*) as count')
            ->groupBy('description', 'code')
            ->orderByDesc('count')
            ->limit(50)
            ->get()
            ->map(fn ($row) => [
                'description' => $row->description,
                'code' => $row->code,
                'count' => (int) $row->count,
            ]);

        return [
            'rows' => $rows,
            'totals' => [
                'unique' => $rows->count(),
                'total' => (int) $rows->sum('count'),
            ],
        ];
    }
}
