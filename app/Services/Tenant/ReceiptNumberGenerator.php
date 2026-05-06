<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Payment;
use Illuminate\Support\Carbon;

class ReceiptNumberGenerator
{
    /**
     * Format: R-YYYYMM-NNNNN. Sequence is per-month so a year rollover
     * doesn't reset to 00001 unexpectedly. NNNNN is computed on the fly
     * from the highest existing receipt_number for the same YYYYMM
     * prefix — cheap because of the unique index on receipt_number.
     */
    public function next(?Carbon $when = null): string
    {
        $when ??= Carbon::now();
        $prefix = 'R-'.$when->format('Ym').'-';

        $latest = Payment::query()
            ->where('receipt_number', 'like', $prefix.'%')
            ->orderByDesc('receipt_number')
            ->value('receipt_number');

        $next = 1;
        if ($latest !== null) {
            $tail = substr($latest, strlen($prefix));
            $next = ((int) $tail) + 1;
        }

        return $prefix.str_pad((string) $next, 5, '0', STR_PAD_LEFT);
    }
}
