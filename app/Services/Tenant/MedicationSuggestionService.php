<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\PrescriptionItem;
use Illuminate\Support\Collection;

class MedicationSuggestionService
{
    /**
     * Returns up to N distinct medication names previously prescribed in
     * this clinic that match the query string. Cheap LIKE — no full-text
     * index until a clinic has thousands of prescriptions.
     *
     * @return Collection<int, string>
     */
    public function suggest(string $query, int $limit = 8): Collection
    {
        $term = trim($query);
        if (mb_strlen($term) < 2) return collect();

        return PrescriptionItem::query()
            ->where('medication_name', 'like', '%'.$term.'%')
            ->select('medication_name')
            ->distinct()
            ->orderBy('medication_name')
            ->limit($limit)
            ->pluck('medication_name');
    }
}
