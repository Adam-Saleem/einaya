<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\ClinicSetting;
use App\Models\Tenant\Consultation;

class BillingCalculator
{
    /**
     * Compute the bill for a single consultation. Pulls the visit-type
     * base price from clinic_settings.pricing and sums the snapshot
     * prices of every linked service.
     *
     * @return array{
     *   visit_type: ?string,
     *   base_price: int,
     *   services: array<int, array{id:int, name:string, price:int, quantity:int, line_total:int}>,
     *   services_total: int,
     *   total: int,
     * }
     */
    public function summary(Consultation $consultation): array
    {
        $consultation->loadMissing('services');

        [$firstPrice, $reviewPrice] = $this->visitPrices();

        $base = match ($consultation->visit_type) {
            'first' => $firstPrice,
            'review' => $reviewPrice,
            default => 0,
        };

        $services = $consultation->services->map(fn ($row) => [
            'id' => $row->id,
            'service_id' => $row->service_id,
            'name' => $row->service_name_snapshot,
            'price' => (int) $row->price_at_time,
            'quantity' => (int) $row->quantity,
            'line_total' => (int) $row->price_at_time * (int) $row->quantity,
        ])->all();

        $servicesTotal = (int) array_sum(array_column($services, 'line_total'));

        return [
            'visit_type' => $consultation->visit_type,
            'base_price' => $base,
            'services' => $services,
            'services_total' => $servicesTotal,
            'total' => $base + $servicesTotal,
        ];
    }

    /**
     * Read both visit prices from settings. Treats missing entries as 0
     * so a clinic that hasn't configured pricing yet gets a sensible
     * total (just the services).
     *
     * @return array{0: int, 1: int}
     */
    private function visitPrices(): array
    {
        $row = ClinicSetting::where('key', 'pricing')->first();
        $value = $row?->value ?? [];

        return [
            (int) ($value['first_visit_price'] ?? 0),
            (int) ($value['review_visit_price'] ?? 0),
        ];
    }
}
