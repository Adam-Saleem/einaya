<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Tenant\User;
use App\Services\Tenant\CSVExporter;
use App\Services\Tenant\ReportService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports, private CSVExporter $csv)
    {
    }

    public function index(Request $request): Response
    {
        $this->ensureCan($request->user(), 'reports.view');

        [$from, $to] = $this->range($request);

        return Inertia::render('Tenant/Reports/Index', [
            'range' => ['from' => $from->toIso8601String(), 'to' => $to->toIso8601String()],
            'appointments' => $this->reports->appointments($from, $to),
            'revenue' => $this->reports->revenue($from, $to),
            'patients' => $this->reports->patients($from, $to),
            'diagnoses' => $this->reports->diagnoses($from, $to),
        ]);
    }

    public function export(Request $request, string $type): StreamedResponse
    {
        $this->ensureCan($request->user(), 'reports.export');

        [$from, $to] = $this->range($request);
        $stamp = now()->format('Ymd_His');

        return match ($type) {
            'appointments' => $this->csv->stream(
                "appointments_{$stamp}.csv",
                ['status', 'count'],
                $this->reports->appointments($from, $to)['rows'],
            ),
            'revenue' => $this->csv->stream(
                "revenue_{$stamp}.csv",
                ['method', 'count', 'amount'],
                $this->reports->revenue($from, $to)['rows'],
            ),
            'diagnoses' => $this->csv->stream(
                "diagnoses_{$stamp}.csv",
                ['description', 'code', 'count'],
                $this->reports->diagnoses($from, $to)['rows'],
            ),
            'patients' => $this->csv->stream(
                "patients_{$stamp}.csv",
                ['gender', 'count'],
                $this->reports->patients($from, $to)['rows']->get('gender'),
            ),
            default => abort(404),
        };
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function range(Request $request): array
    {
        $from = $request->date('from') ?? Carbon::now()->startOfMonth();
        $to = $request->date('to') ?? Carbon::now()->endOfMonth();

        return [Carbon::parse($from), Carbon::parse($to)];
    }

    private function ensureCan(?User $user, string $permission): void
    {
        if ($user === null || ! $user->can($permission)) {
            throw new AuthorizationException();
        }
    }
}
